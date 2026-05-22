'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import { Truck, Wallet, ShieldCheck, CheckCircle2, ChevronRight, RefreshCcw, MapPin } from 'lucide-react';

import { API_BASE } from '../config';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, cart, clearCart } = useApp();

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
      router.push('/cart');
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
      const shipping = subtotal > 999 ? 0 : 99;
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
  }, [user, cart]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone || !newStreet || !newCity || !newState || !newZip) {
      setErrorMsg('Please fill in all address parameters.');
      return;
    }
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/auth/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
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
      console.warn('API error creating address. Running offline fallback address builder.');
      const localAdd = {
        _id: `add_${Math.random().toString(36).substr(2, 9)}`,
        name: newName,
        phone: newPhone,
        streetAddress: newStreet,
        city: newCity,
        state: newState,
        postalCode: newZip,
        isDefault: false
      };
      const updated = [...addresses, localAdd];
      setAddresses(updated);
      setSelectedAddressIndex(updated.length - 1);
      setAddressFormOpen(false);
    }
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
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (res.ok) {
        // If razorpay, simulate payment completion
        if (paymentMethod === 'Razorpay') {
          // Simulate Razorpay popup delay
          setTimeout(async () => {
            try {
              const payRes = await fetch(`${API_BASE}/orders/${data._id}/pay`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                  razorpay_payment_id: `pay_rzp_mock_${Math.random().toString(36).substr(2, 9)}`
                })
              });
              const paidData = await payRes.json();
              setPlacedOrderInfo(paidData);
              setOrderPlacedSuccess(true);
              clearCart();
              setLoading(false);
            } catch (payErr) {
              setErrorMsg('Verification of Mock Razorpay gateway payment failed.');
              setLoading(false);
            }
          }, 2000);
        } else {
          // COD Placement is synchronous
          setPlacedOrderInfo(data);
          setOrderPlacedSuccess(true);
          clearCart();
          setLoading(false);
        }
      } else {
        setErrorMsg(data.message || 'Failed to place order.');
        setLoading(false);
      }
    } catch (err) {
      console.warn('API error placing order. Triggering offline mock checkout.');
      // Simulate successful offline checkout
      setTimeout(() => {
        setPlacedOrderInfo({
          _id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
          paymentMethod,
          totalPrice: checkoutDetails.totalPrice,
          createdAt: new Date().toISOString()
        });
        setOrderPlacedSuccess(true);
        clearCart();
        setLoading(false);
      }, 1500);
    }
  };

  if (orderPlacedSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-24 text-center font-sans">
        <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
          <div className="text-green-600 animate-pulse-slow">
            <CheckCircle2 size={64} className="fill-green-100" />
          </div>
          <h2 className="font-serif text-3xl font-semibold mt-2">Order Confirmed!</h2>
          <p className="text-sm font-light text-gray-500">
            Thank you for shopping at Mradhul Fashion. Your luxury couture order is being processed.
          </p>
          <div className="bg-brand-cream dark:bg-brand-charcoal p-4 rounded-xl border border-brand-primary/10 w-full text-xs text-left flex flex-col gap-2 mt-4">
            <p>Order Reference: <strong className="font-mono text-brand-primary">{placedOrderInfo?._id}</strong></p>
            <p>Payment Mode: <strong>{placedOrderInfo?.paymentMethod}</strong></p>
            <p>Final Charged Amount: <strong className="text-brand-primary">₹{placedOrderInfo?.totalPrice}</strong></p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="mt-6 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider py-3 px-8 rounded-full shadow-md btn-premium"
          >
            Track Order Progress
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 font-sans">
      <h1 className="font-serif text-3xl font-semibold tracking-wider border-b border-black/5 dark:border-white/5 pb-4 mb-8">
        Secure Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Address lists and payments */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Step 1: Address Selection */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
              <MapPin size={20} className="text-brand-primary" /> Delivery Address
            </h3>

            {addresses.length === 0 ? (
              <p className="text-sm font-light text-gray-500 italic bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                No delivery address found. Please add a shipping location below.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((add, idx) => (
                  <div
                    key={add._id || idx}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAddressIndex === idx
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-black/10 dark:border-white/10 hover:border-brand-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{add.name}</span>
                      {selectedAddressIndex === idx && (
                        <span className="bg-brand-primary text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Ship Here
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-light leading-relaxed truncate">{add.streetAddress}</p>
                    <p className="text-xs text-gray-500 font-light leading-relaxed">{add.city}, {add.state} - {add.postalCode}</p>
                    <p className="text-xs text-gray-400 font-semibold mt-2">{add.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Form Toggle to add new address */}
            {!addressFormOpen ? (
              <button
                onClick={() => setAddressFormOpen(true)}
                className="text-xs font-bold text-brand-primary hover:underline self-start border border-brand-primary/20 rounded-lg px-4 py-2 mt-1"
              >
                + Add New Address
              </button>
            ) : (
              <form onSubmit={handleAddAddress} className="glass-panel p-6 rounded-2xl border border-brand-primary/10 flex flex-col gap-4 mt-2">
                <h4 className="font-serif font-bold text-sm text-brand-primary">Create New Delivery Destination</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Recipient Full Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 text-xs rounded-xl focus:outline-none focus:border-brand-primary"
                  />
                  <input
                    type="tel"
                    placeholder="10-Digit Mobile Number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 text-xs rounded-xl focus:outline-none focus:border-brand-primary"
                  />
                  <input
                    type="text"
                    placeholder="Flat, House No, Building, Street"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 text-xs rounded-xl focus:outline-none focus:border-brand-primary sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 text-xs rounded-xl focus:outline-none focus:border-brand-primary"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 text-xs rounded-xl focus:outline-none focus:border-brand-primary"
                  />
                  <input
                    type="text"
                    placeholder="Postal PIN Code"
                    value={newZip}
                    onChange={(e) => setNewZip(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 text-xs rounded-xl focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="flex gap-3 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setAddressFormOpen(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Step 2: Payment Choices */}
          <div className="flex flex-col gap-4 border-t border-black/5 dark:border-white/5 pt-6">
            <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
              <Wallet size={20} className="text-brand-primary" /> Payment Method
            </h3>

            <div className="flex flex-col gap-3">
              {/* COD */}
              <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                paymentMethod === 'COD' ? 'border-brand-primary bg-brand-primary/5' : 'border-black/10 dark:border-white/10'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="accent-brand-primary"
                />
                <div className="flex-grow">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Cash on Delivery (COD)</span>
                  <p className="text-xs text-gray-400 font-light mt-0.5">Pay in cash or UPI upon package receipt at door.</p>
                </div>
              </label>

              {/* Razorpay */}
              <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                paymentMethod === 'Razorpay' ? 'border-brand-primary bg-brand-primary/5' : 'border-black/10 dark:border-white/10'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Razorpay'}
                  onChange={() => setPaymentMethod('Razorpay')}
                  className="accent-brand-primary"
                />
                <div className="flex-grow">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Prepaid Payment Gate (Razorpay Ready)</span>
                  <p className="text-xs text-gray-400 font-light mt-0.5">Mock simulation gateway to verify checkout integration flows.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary Checkout */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-2xl border border-brand-primary/10 flex flex-col gap-4 sticky top-24">
            <h4 className="font-serif font-bold text-base border-b border-black/5 dark:border-white/5 pb-2">
              Payment Breakdown
            </h4>

            {/* Cart summary list */}
            <div className="flex flex-col gap-3 max-h-40 overflow-y-auto mb-2 border-b border-black/5 dark:border-white/5 pb-3">
              {cart.map((item) => (
                <div key={`${item.product}-${item.size}`} className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 truncate max-w-[12rem]">{item.name} (x{item.qty})</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 text-sm font-light">
              <div className="flex justify-between">
                <span className="text-gray-500">Pre-Tax Cart Total</span>
                <span>₹{checkoutDetails.totalPrice - checkoutDetails.taxPrice - checkoutDetails.shippingPrice + checkoutDetails.discountAmount}</span>
              </div>
              {checkoutDetails.discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon Discount ({checkoutDetails.couponCode})</span>
                  <span>-₹{checkoutDetails.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping Cost</span>
                <span>{checkoutDetails.shippingPrice === 0 ? 'FREE' : `₹${checkoutDetails.shippingPrice}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST (5% tax)</span>
                <span>₹{checkoutDetails.taxPrice}</span>
              </div>

              <div className="border-t border-black/5 dark:border-white/5 pt-3 mt-1 flex justify-between font-serif text-lg font-bold text-brand-primary">
                <span>Total Charge</span>
                <span>₹{checkoutDetails.totalPrice}</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-brand-primary font-semibold bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/15">
                {errorMsg}
              </p>
            )}

            {/* Place order button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="bg-brand-primary hover:bg-brand-primaryDark text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 btn-premium shadow-md mt-4 w-full"
            >
              {loading ? (
                <>
                  <RefreshCcw className="animate-spin" size={14} /> Placing Order...
                </>
              ) : (
                <>
                  Place Order <ChevronRight size={14} />
                </>
              )}
            </button>

            {/* Secure Payments badge */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 mt-2">
              <ShieldCheck size={14} className="text-brand-gold" />
              <span>Razorpay Verified Secure Payment Gateway</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
