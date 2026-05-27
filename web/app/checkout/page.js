'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import { Truck, Wallet, ShieldCheck, CheckCircle2, ChevronRight, RefreshCcw, MapPin, Check, Edit2 } from 'lucide-react';
import Image from 'next/image';

import { API_BASE } from '../config';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, cart, clearCart } = useApp();

  // Accordion Step State
  // Steps: 1: Address, 2: Payment
  const [currentStep, setCurrentStep] = useState(1);

  // Checkout pricing states
  const [checkoutDetails, setCheckoutDetails] = useState({
    discountPercent: 0,
    couponCode: '',
    discountAmount: 0,
    shippingPrice: 0,
    taxPrice: 0,
    totalPrice: 0
  });

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState(false);
  const [placedOrderInfo, setPlacedOrderInfo] = useState(null);
  const [pendingOrderDetails, setPendingOrderDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Address creation form states
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/profile?redirect=checkout');
      return;
    }

    if (cart.length === 0) {
      router.push('/products');
      return;
    }

    // Load totals
    const details = sessionStorage.getItem('mf_checkout_details');
    if (details) {
      setCheckoutDetails(JSON.parse(details));
    } else {
      // Calculate inline fallback
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
      const tax = Math.round(subtotal * 0.05);
      const shipping = subtotal > 1499 ? 0 : 99;
      setCheckoutDetails({
        discountPercent: 0,
        couponCode: '',
        discountAmount: 0,
        shippingPrice: shipping,
        taxPrice: tax,
        totalPrice: subtotal + shipping + tax
      });
    }

    // Load addresses from user context
    setAddresses(user.addresses || []);
    if (user.addresses && user.addresses.length > 0) {
      setAddressFormOpen(false);
    } else {
      setAddressFormOpen(true);
    }
  }, [user, cart]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone || !newStreet || !newCity || !newState || !newZip) {
      setErrorMsg('Please fill in all address parameters.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          streetAddress: newStreet,
          city: newCity,
          state: newState,
          postalCode: newZip,
          isDefault: addresses.length === 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAddresses(data);
        setSelectedAddressIndex(data.length - 1);
        setAddressFormOpen(false);
        // Clear inputs
        setNewName('');
        setNewPhone('');
        setNewStreet('');
        setNewCity('');
        setNewState('');
        setNewZip('');
      } else {
        setErrorMsg(data.message || 'Failed to add address.');
      }
    } catch (err) {
      setErrorMsg('Unable to save this address right now. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const proceedToPayment = () => {
    if (addresses.length === 0) {
      setErrorMsg('Please add a delivery address first.');
      return;
    }
    setErrorMsg('');
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    if (addresses.length === 0) {
      setErrorMsg('Please enter a shipping address to receive the couture shipment.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const shippingAddress = addresses[selectedAddressIndex];

    const orderPayload = {
      orderItems: cart,
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        streetAddress: shippingAddress.streetAddress,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode
      },
      paymentMethod,
      itemsPrice: cart.reduce((acc, item) => acc + item.price * item.qty, 0),
      taxPrice: checkoutDetails.taxPrice,
      shippingPrice: checkoutDetails.shippingPrice,
      totalPrice: checkoutDetails.totalPrice
    };

    try {
      let data = pendingOrderDetails;
      
      if (!data) {
        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
          },
          body: JSON.stringify(orderPayload)
        });

        data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.message || 'Failed to place order.');
          setLoading(false);
          return;
        }
        setPendingOrderDetails(data);
      }

      // If razorpay, trigger the actual SDK checkout dialog
        if (paymentMethod === 'Razorpay') {
          const loaded = await loadRazorpayScript();
          if (!loaded) {
            setErrorMsg('Unable to load Razorpay payment gateway. Check your internet connection.');
            setLoading(false);
            return;
          }

          const rzpOrderId = data.paymentResult?.id;

          if (!rzpOrderId || !rzpOrderId.startsWith('order_')) {
            setErrorMsg('Unable to initialize Razorpay for this order. Please try again or choose Cash on Delivery.');
            setLoading(false);
            return;
          }

          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock',
            amount: Math.round(data.totalPrice * 100),
            currency: 'INR',
            name: 'Mradhul Fashion',
            description: 'Jaipur Luxury Handcrafted Apparel',
            image: '/logo.png',
            order_id: rzpOrderId,
            handler: async function (response) {
              try {
                setLoading(true);
                const payRes = await fetch(`${API_BASE}/orders/${data._id}/pay`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });

                if (payRes.ok) {
                  const paidData = await payRes.json();
                  setPlacedOrderInfo(paidData);
                  setOrderPlacedSuccess(true);
                  clearCart();
                } else {
                  const errData = await payRes.json();
                  setErrorMsg(errData.message || 'Payment verification failed.');
                }
              } catch (err) {
                setErrorMsg('Network error verifying payment.');
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: shippingAddress.phone || ''
            },
            theme: {
              color: '#701122'
            },
            modal: {
              ondismiss: function () {
                setLoading(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // COD placement
          setPlacedOrderInfo(data);
          setOrderPlacedSuccess(true);
          setPendingOrderDetails(null);
          clearCart();
          setLoading(false);
        }
    } catch (err) {
      setErrorMsg('Unable to place this order right now. Please try again in a moment.');
      setLoading(false);
    }
  };

  if (orderPlacedSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-24 text-center font-sans">
        <div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
          <div className="text-green-600 animate-pulse-slow">
            <CheckCircle2 size={64} className="fill-green-100" />
          </div>
          <h2 className="font-serif text-3xl font-semibold mt-2">Order Confirmed!</h2>
          <p className="text-sm font-light text-gray-500 mb-4">
            Thank you for shopping at Mradhul Fashion. Your luxury couture order is being processed.
          </p>
          <div className="bg-gray-50 dark:bg-[#1E1E1E] p-6 rounded-2xl border border-gray-200 dark:border-[#333] w-full text-sm text-left flex flex-col gap-3 shadow-sm">
            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-[#333]">
              <span className="text-gray-500">Order Reference</span>
              <strong className="font-mono text-brand-primary">{placedOrderInfo?._id}</strong>
            </div>
            <div className="flex justify-between pb-3 border-b border-gray-200 dark:border-[#333]">
              <span className="text-gray-500">Payment Mode</span>
              <strong>{placedOrderInfo?.paymentMethod}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Final Charged Amount</span>
              <strong className="text-brand-primary text-lg">₹{placedOrderInfo?.totalPrice}</strong>
            </div>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="mt-6 bg-brand-primary hover:bg-brand-primaryDark text-white text-sm font-bold uppercase tracking-wider py-4 px-10 rounded-lg shadow-md transition-all hover:-translate-y-1"
          >
            Track Order Progress
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 font-sans text-gray-900 dark:text-gray-100 bg-[#F9F9F9] dark:bg-[#121212] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Accordion Steps */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Step 1: Login (Always completed since we redirect if not logged in) */}
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#333]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 dark:bg-[#333] text-gray-400 font-bold h-8 w-8 rounded flex items-center justify-center shadow-inner">
                  1
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-gray-500 uppercase tracking-widest text-sm flex items-center gap-2">
                    Account <Check size={14} className="text-green-500" />
                  </h3>
                  <p className="text-gray-900 dark:text-white font-medium text-sm mt-1">{user?.name} <span className="text-gray-400 font-normal">({user?.email})</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Address */}
          <div className={`bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border ${currentStep === 1 ? 'border-brand-primary/50 ring-1 ring-brand-primary/20' : 'border-gray-200 dark:border-[#333]'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`font-bold h-8 w-8 rounded flex items-center justify-center shadow-inner ${currentStep === 1 ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-[#333] text-gray-400'}`}>
                    2
                  </div>
                  <h3 className={`font-semibold uppercase tracking-widest text-sm flex items-center gap-2 ${currentStep === 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                    Delivery Address {currentStep > 1 && <Check size={14} className="text-green-500" />}
                  </h3>
                </div>
                {currentStep > 1 && (
                  <button onClick={() => setCurrentStep(1)} className="text-brand-primary text-sm font-semibold uppercase hover:underline">Change</button>
                )}
              </div>

              {currentStep === 1 && (
                <div className="pl-12 pt-2 animate-fade-in">
                  {addresses.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4">You don't have any saved addresses. Please add one below.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {addresses.map((add, idx) => (
                        <div
                          key={add._id || idx}
                          onClick={() => setSelectedAddressIndex(idx)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all relative ${
                            selectedAddressIndex === idx
                              ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
                              : 'border-gray-200 dark:border-[#333] hover:border-gray-300'
                          }`}
                        >
                          {selectedAddressIndex === idx && (
                            <div className="absolute top-4 right-4 text-brand-primary">
                              <CheckCircle2 size={20} className="fill-brand-primary/20" />
                            </div>
                          )}
                          <div className="font-semibold text-sm mb-1">{add.name}</div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pr-6">{add.streetAddress}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{add.city}, {add.state} - {add.postalCode}</p>
                          <p className="text-xs font-medium mt-2">{add.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!addressFormOpen ? (
                    <button
                      onClick={() => setAddressFormOpen(true)}
                      className="text-sm font-semibold text-brand-primary hover:text-brand-primaryDark flex items-center gap-1 mb-6"
                    >
                      + Add New Address
                    </button>
                  ) : (
                    <form onSubmit={handleAddAddress} className="bg-gray-50 dark:bg-[#121212] p-5 rounded-lg border border-gray-200 dark:border-[#333] flex flex-col gap-4 mb-6">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">New Address Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#444] px-4 py-3 text-sm rounded-md focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                        <input
                          type="tel"
                          placeholder="Mobile Number"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#444] px-4 py-3 text-sm rounded-md focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                        <input
                          type="text"
                          placeholder="Address (House No, Building, Street, Area)"
                          value={newStreet}
                          onChange={(e) => setNewStreet(e.target.value)}
                          className="bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#444] px-4 py-3 text-sm rounded-md focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary sm:col-span-2"
                        />
                        <input
                          type="text"
                          placeholder="Locality / Town / City"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#444] px-4 py-3 text-sm rounded-md focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="State"
                            value={newState}
                            onChange={(e) => setNewState(e.target.value)}
                            className="bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#444] px-4 py-3 text-sm rounded-md focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                          <input
                            type="text"
                            placeholder="Pincode"
                            value={newZip}
                            onChange={(e) => setNewZip(e.target.value)}
                            className="bg-white dark:bg-[#1E1E1E] border border-gray-300 dark:border-[#444] px-4 py-3 text-sm rounded-md focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end mt-2">
                        {addresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setAddressFormOpen(false)}
                            className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#333] rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-8 py-2.5 bg-brand-primary text-white rounded-md text-sm font-bold shadow-sm flex items-center justify-center min-w-[120px]"
                        >
                          {loading ? <RefreshCcw className="animate-spin" size={16} /> : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  )}

                  {addresses.length > 0 && !addressFormOpen && (
                    <button
                      onClick={proceedToPayment}
                      className="bg-brand-primary hover:bg-brand-primaryDark text-white text-sm font-bold uppercase tracking-wider py-4 px-10 rounded-md shadow-md transition-all hover:shadow-lg mt-2"
                    >
                      Deliver Here
                    </button>
                  )}
                </div>
              )}
              
              {/* Step Summary when collapsed */}
              {currentStep > 1 && addresses[selectedAddressIndex] && (
                <div className="pl-12 pt-1 text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-semibold text-gray-900 dark:text-white">{addresses[selectedAddressIndex].name}</p>
                  <p>{addresses[selectedAddressIndex].streetAddress}, {addresses[selectedAddressIndex].city}</p>
                  <p>{addresses[selectedAddressIndex].phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Payment Options */}
          <div className={`bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border ${currentStep === 2 ? 'border-brand-primary/50 ring-1 ring-brand-primary/20' : 'border-gray-200 dark:border-[#333]'}`}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`font-bold h-8 w-8 rounded flex items-center justify-center shadow-inner ${currentStep === 2 ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-[#333] text-gray-400'}`}>
                  3
                </div>
                <h3 className={`font-semibold uppercase tracking-widest text-sm ${currentStep === 2 ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                  Payment Options
                </h3>
              </div>

              {currentStep === 2 && (
                <div className="pl-12 pt-2 animate-fade-in">
                  <div className="flex flex-col gap-4 mb-8">
                    {/* Razorpay */}
                    <label className={`flex items-start gap-4 p-5 rounded-lg border cursor-pointer select-none transition-all ${
                      paymentMethod === 'Razorpay' ? 'border-brand-primary bg-brand-primary/5 shadow-sm' : 'border-gray-200 dark:border-[#333]'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'Razorpay'}
                        onChange={() => setPaymentMethod('Razorpay')}
                        className="accent-brand-primary mt-1"
                      />
                      <div className="flex-grow">
                        <span className="font-bold text-gray-900 dark:text-white block mb-1">Pay Online (Razorpay Checkout)</span>
                        <p className="text-xs text-gray-500 font-light leading-relaxed">Secure payment via Credit/Debit Cards, UPI, Netbanking, or Wallets.</p>
                      </div>
                    </label>
                    
                    {/* COD */}
                    <label className={`flex items-start gap-4 p-5 rounded-lg border cursor-pointer select-none transition-all ${
                      paymentMethod === 'COD' ? 'border-brand-primary bg-brand-primary/5 shadow-sm' : 'border-gray-200 dark:border-[#333]'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="accent-brand-primary mt-1"
                      />
                      <div className="flex-grow">
                        <span className="font-bold text-gray-900 dark:text-white block mb-1">Cash on Delivery (COD)</span>
                        <p className="text-xs text-gray-500 font-light leading-relaxed">Pay in cash or via UPI scan when the package arrives at your doorstep.</p>
                      </div>
                    </label>
                  </div>

                  {errorMsg && (
                    <p className="text-sm text-red-500 font-medium mb-6 bg-red-50 dark:bg-red-900/10 p-3 rounded-md border border-red-100 dark:border-red-900/30">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full sm:w-auto min-w-[250px] bg-brand-primary hover:bg-brand-primaryDark text-white text-sm font-bold uppercase tracking-wider py-4 px-10 rounded-md shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCcw className="animate-spin" size={16} /> Processing...
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'Razorpay' ? 'Pay & Place Order' : 'Place Order'} <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-4 font-medium">
                    <ShieldCheck size={14} className="text-brand-gold" />
                    <span>Safe and secure payments. 100% Authentic products.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm sticky top-28">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4 pb-3 border-b border-gray-100 dark:border-[#333]">
              Price Details ({cart.reduce((a,c) => a + c.qty, 0)} Items)
            </h4>

            <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div className="flex justify-between">
                <span>Total MRP</span>
                <span>₹{cart.reduce((acc, item) => acc + (item.price * item.qty), 0)}</span>
              </div>
              {checkoutDetails.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount on MRP</span>
                  <span>-₹{checkoutDetails.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (5% GST)</span>
                <span>₹{checkoutDetails.taxPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span>
                  {checkoutDetails.shippingPrice === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `₹${checkoutDetails.shippingPrice}`
                  )}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-[#333] pt-4 flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">₹{checkoutDetails.totalPrice}</span>
            </div>
            
            {checkoutDetails.shippingPrice === 0 && (
               <div className="bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400 text-xs font-semibold px-3 py-2 rounded mt-4 text-center">
                 You will save ₹99 on shipping for this order
               </div>
            )}

            {/* Cart Preview Items */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#333]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">
                Order Summary
              </h4>
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-16 h-20 bg-gray-100 shrink-0 rounded overflow-hidden border border-gray-200 dark:border-[#333]">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</span>
                      <span className="text-xs text-gray-500 mt-1">Size: {item.size} | Qty: {item.qty}</span>
                      <span className="text-sm font-bold mt-auto text-gray-900 dark:text-white">₹{item.price * item.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
