'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../app/context';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function CartDrawer() {
  const { cart, removeFromCart, updateCartQty, cartOpen, setCartOpen } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [cartOpen]);

  if (!mounted) return null;

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.qty, 0);

  const handleCheckout = () => {
    setCartOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      {cartOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] animate-fade-in"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-[#121212] z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
        cartOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#333] shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-primary" />
            <h2 className="font-serif text-xl font-bold">Your Bag</h2>
            <span className="bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {cartItemCount}
            </span>
          </div>
          <button 
            onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Banner */}
        {cartTotal > 0 && cartTotal < 1499 && (
          <div className="bg-gray-50 dark:bg-[#1E1E1E] p-3 text-center border-b border-gray-200 dark:border-[#333] shrink-0">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Add <span className="font-bold text-brand-primary">₹{1499 - cartTotal}</span> more to get <span className="font-bold">FREE SHIPPING</span>
            </p>
            <div className="w-full bg-gray-200 dark:bg-[#333] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-brand-primary h-full transition-all duration-500" 
                style={{ width: `${Math.min((cartTotal / 1499) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {cartTotal >= 1499 && (
          <div className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 p-3 text-center border-b border-green-100 dark:border-green-900/30 shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider">🎉 You have unlocked Free Shipping!</p>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
              <ShoppingBag size={48} className="text-gray-300 mb-4" />
              <h3 className="font-serif text-lg font-medium mb-2">Your bag is empty</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-[250px]">Looks like you haven't added any luxury pieces to your bag yet.</p>
              <button 
                onClick={() => {
                  setCartOpen(false);
                  router.push('/products');
                }}
                className="bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs tracking-wider px-6 py-3 rounded-full hover:scale-105 transition-transform"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.product}-${item.size}`} className="flex gap-4 group">
                <Link 
                  href={`/products/${item.product}`} 
                  onClick={() => setCartOpen(false)}
                  className="w-20 h-28 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200 dark:border-[#333]"
                >
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex justify-between items-start gap-2">
                    <Link 
                      href={`/products/${item.product}`}
                      onClick={() => setCartOpen(false)}
                      className="font-medium text-sm line-clamp-2 hover:text-brand-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                    <button 
                      onClick={() => removeFromCart(item.product, item.size)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">Size: <span className="font-semibold text-gray-700 dark:text-gray-300">{item.size}</span></div>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-gray-200 dark:border-[#444] rounded-md h-8">
                      <button 
                        onClick={() => updateCartQty(item.product, item.size, item.qty - 1)}
                        className="px-2.5 h-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-semibold w-8 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateCartQty(item.product, item.size, item.qty + 1)}
                        className="px-2.5 h-full text-gray-500 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    
                    <span className="font-bold text-sm">₹{item.price * item.qty}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 dark:border-[#333] p-5 shrink-0 bg-white dark:bg-[#121212]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Subtotal</span>
              <span className="font-serif text-xl font-bold">₹{cartTotal}</span>
            </div>
            <p className="text-[10px] text-gray-500 text-center mb-4 uppercase tracking-wider">Taxes and shipping calculated at checkout</p>
            <button 
              onClick={handleCheckout}
              className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white font-bold uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02]"
            >
              Secure Checkout <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
