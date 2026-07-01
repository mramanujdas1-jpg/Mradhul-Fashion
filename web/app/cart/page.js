'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import { Trash2, ShoppingBag, ArrowRight, Tag, RefreshCcw } from 'lucide-react';

import { API_BASE } from '../config';

export default function CartPage() {
  const router = useRouter();
  const { user, cart, updateCartQty, removeFromCart } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponAppliedCode, setCouponAppliedCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const shippingPrice = subtotal > 999 || subtotal === 0 ? 0 : 99; // Free shipping over 999
  const taxPrice = Math.round(subtotal * 0.05); // 5% GST
  const totalPrice = subtotal - discountAmount + shippingPrice + taxPrice;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponAppliedCode('');
    setDiscountPercent(0);

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    if (!user) {
      setCouponError('Please login to apply discount coupons.');
      return;
    }

    setCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({ code: couponCode })
      });

      const data = await res.json();
      if (res.ok) {
        setDiscountPercent(data.discountPercentage);
        setCouponAppliedCode(data.code);
        setCouponCode('');
      } else {
        setCouponError(data.message || 'Invalid coupon code.');
      }
    } catch (err) {
      setCouponError('Unable to validate this coupon right now. Please try again in a moment.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      router.push('/profile?redirect=checkout');
    } else {
      // Store summary temporarily for checkout
      sessionStorage.setItem('mf_checkout_details', JSON.stringify({
        discountPercent,
        couponCode: couponAppliedCode,
        discountAmount,
        shippingPrice,
        taxPrice,
        totalPrice
      }));
      router.push('/checkout');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-24 text-center font-sans">
        <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
          <div className="p-4 bg-brand-primary/10 text-brand-primary rounded-full animate-bounce">
            <ShoppingBag size={48} />
          </div>
          <h2 className="font-serif text-2xl font-semibold mt-2">Your Bag Is Empty</h2>
          <p className="text-sm font-light text-gray-500">Add premium apparel items to your bag and start customizing your boutique wardrobe styles.</p>
          <Link href="/products" className="mt-6 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider py-3 px-8 rounded-full shadow-md btn-premium">
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 font-sans">
      <h1 className="font-serif text-3xl font-semibold tracking-wider border-b border-black/5 dark:border-white/5 pb-4 mb-8">
        Your Shopping Bag
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Items in Cart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cart.map((item) => (
            <div
              key={`${item.product}-${item.size}-${item.color || 'default'}`}
              className="flex items-center gap-4 bg-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-primary/5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product item image */}
              <div className="h-24 w-18 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>

              {/* Product Info details */}
              <div className="flex-grow flex flex-col gap-1">
                <h3 className="font-sans font-medium text-sm text-gray-800 dark:text-gray-200 line-clamp-1">
                  {item.name}
                </h3>
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                  <span>Size: <strong className="text-brand-gold uppercase">{item.size}</strong></span>
                  {item.color && <span>Color: <strong className="text-brand-gold uppercase">{item.color}</strong></span>}
                  <span>Price: <strong className="text-gray-700 dark:text-gray-300">₹{item.price}</strong></span>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-black/10 dark:border-white/10 rounded-lg overflow-hidden h-7 text-xs">
                    <button
                      onClick={() => updateCartQty(item.product, item.size, item.qty - 1, item.color || '')}
                      className="px-2 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      -
                    </button>
                    <span className="px-3 font-semibold">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.product, item.size, item.qty + 1, item.color || '')}
                      className="px-2 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product, item.size, item.color || '')}
                    className="p-1.5 hover:text-brand-primary text-gray-400 rounded-md hover:bg-brand-primary/5 transition-colors ml-2"
                    aria-label="Delete item from cart"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Total item price */}
              <div className="text-right flex-shrink-0">
                <span className="font-bold text-base text-brand-primary">₹{item.price * item.qty}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Order Summaries and Coupons */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Coupon codes panel */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-primary/10 flex flex-col gap-4">
            <h4 className="font-serif font-bold text-base text-brand-primary flex items-center gap-1.5">
              <Tag size={18} className="text-brand-gold" /> Promo Coupons
            </h4>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-primary flex-grow uppercase font-semibold"
              />
              <button
                type="submit"
                disabled={couponLoading}
                className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center min-w-[5rem]"
              >
                {couponLoading ? <RefreshCcw size={12} className="animate-spin" /> : 'Apply'}
              </button>
            </form>

            {couponAppliedCode && (
              <p className="text-xs text-green-600 font-semibold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/15">
                ✓ Coupon Applied: <strong>{couponAppliedCode}</strong> ({discountPercent}% OFF)
              </p>
            )}
            {couponError && (
              <p className="text-xs text-brand-primary font-semibold bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/15">
                {couponError}
              </p>
            )}

            {!couponAppliedCode && (
              <p className="border-t border-black/5 pt-3 text-[10px] leading-normal text-gray-500">
                Promotional codes are validated securely before checkout.
              </p>
            )}
          </div>

          {/* Pricing Order summary */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-primary/10 flex flex-col gap-4">
            <h4 className="font-serif font-bold text-base border-b border-black/5 dark:border-white/5 pb-2">
              Order Summary
            </h4>

            <div className="flex flex-col gap-2.5 text-sm font-light">
              <div className="flex justify-between">
                <span className="text-gray-500">Bag Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount Coupon</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping Estimate</span>
                <span>{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST (5% tax)</span>
                <span>₹{taxPrice}</span>
              </div>
              
              <div className="border-t border-black/5 dark:border-white/5 pt-3 mt-1 flex justify-between font-serif text-lg font-bold text-brand-primary">
                <span>Order Total</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>

            {/* Checkout forward button */}
            <button
              onClick={handleProceedToCheckout}
              className="bg-brand-primary hover:bg-brand-primaryDark text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 btn-premium shadow-md mt-4 w-full"
            >
              Proceed to Checkout <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
