'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal text-gray-300 border-t border-white/5 pt-16 pb-8 px-4 md:px-12 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        
        {/* Brand Information */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Mradhul Fashion"
              width={40}
              height={40}
              className="h-10 w-10 object-contain rounded-full border border-brand-gold/30"
            />
            <div>
              <span className="font-serif text-lg font-bold tracking-widest text-brand-primary uppercase block leading-none">
                Mradhul
              </span>
              <span className="font-sans text-[10px] tracking-widest text-brand-gold font-semibold uppercase">
                Fashion
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-400 font-light mt-2 leading-relaxed">
            Experience premium Jaipur couture, handcrafted ethnic wear, and royal heritage designs. Elevating your wardrobe with pure luxury, artisan craftsmanship, and sophisticated traditional Rajasthani silhouettes.
          </p>
          
          {/* Social Media Hooks */}
          <div className="flex items-center gap-3 mt-2">
            <a href="#" className="p-2 bg-white/5 hover:bg-brand-primary hover:text-white rounded-full transition-all duration-300" aria-label="Visit Facebook">
              <Facebook size={16} />
            </a>
            <a href="#" className="p-2 bg-white/5 hover:bg-brand-primary hover:text-white rounded-full transition-all duration-300" aria-label="Visit Instagram">
              <Instagram size={16} />
            </a>
            <a href="#" className="p-2 bg-white/5 hover:bg-brand-primary hover:text-white rounded-full transition-all duration-300" aria-label="Visit Twitter">
              <Twitter size={16} />
            </a>
          </div>
        </div>

        {/* Catalog Categories */}
        <div className="flex flex-col gap-4">
          <h4 className="font-serif font-semibold text-white tracking-widest uppercase text-sm border-b border-white/5 pb-2">
            Collections
          </h4>
          <div className="flex flex-col gap-2.5 text-sm text-gray-400">
            <Link href="/products?category=Handcrafted%20Sarees" className="hover:text-brand-primary transition-colors">Handcrafted Sarees</Link>
            <Link href="/products?category=Designer%20Lehengas" className="hover:text-brand-primary transition-colors">Designer Lehengas</Link>
            <Link href="/products?category=Royal%20Anarkalis" className="hover:text-brand-primary transition-colors">Royal Anarkalis</Link>
            <Link href="/products?category=Jaipur%20Fusion%20Wear" className="hover:text-brand-primary transition-colors">Jaipur Fusion Wear</Link>
            <Link href="/products?category=Bridal%20%26%20Festive" className="hover:text-brand-primary transition-colors">Bridal & Festive</Link>
            <Link href="/products?category=Artisan%20Jackets%20%26%20Dupattas" className="hover:text-brand-primary transition-colors">Artisan Jackets & Dupattas</Link>
          </div>
        </div>

        {/* Customer Assistance */}
        <div className="flex flex-col gap-4">
          <h4 className="font-serif font-semibold text-white tracking-widest uppercase text-sm border-b border-white/5 pb-2">
            Assistance
          </h4>
          <div className="flex flex-col gap-2.5 text-sm text-gray-400">
            <Link href="/profile" className="hover:text-brand-primary transition-colors">Track Orders</Link>
            <Link href="/profile" className="hover:text-brand-primary transition-colors">Shipping & Returns</Link>
            <Link href="/cart" className="hover:text-brand-primary transition-colors">My Cart</Link>
            <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
          </div>
        </div>

        {/* Contact/Newsletter */}
        <div className="flex flex-col gap-4">
          <h4 className="font-serif font-semibold text-white tracking-widest uppercase text-sm border-b border-white/5 pb-2">
            Get Updates
          </h4>
          <p className="text-sm text-gray-400 font-light leading-relaxed">
            Subscribe to receive styling guides, flash sale reminders, and launch announcements.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 mt-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter email address"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-primary flex-grow"
            />
            <button className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase py-2 px-4 rounded-lg tracking-wider transition-colors duration-300">
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-white/5 max-w-7xl mx-auto py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-white/5 text-brand-gold rounded-full">
            <ShieldCheck size={20} />
          </div>
          <span className="font-semibold text-white">100% Authentic Products</span>
          <p className="font-light text-[11px]">Sourced directly from certified boutique weaver workshops.</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-white/5 text-brand-gold rounded-full">
            <RotateCcw size={20} />
          </div>
          <span className="font-semibold text-white">15-Day Free Returns</span>
          <p className="font-light text-[11px]">Hassle-free pick-up from your home address.</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-white/5 text-brand-gold rounded-full">
            <Truck size={20} />
          </div>
          <span className="font-semibold text-white">Free Express Delivery</span>
          <p className="font-light text-[11px]">Free delivery above ₹999 + COD option everywhere.</p>
        </div>
      </div>

      {/* Copyright Notice */}
      <div className="border-t border-white/5 max-w-7xl mx-auto pt-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© 2026 Mradhul Fashion. All Rights Reserved. Crafted with pure luxury.</span>
        <div className="flex items-center gap-4 text-[10px] tracking-wider uppercase font-semibold text-brand-gold">
          <span>Razorpay SECURE</span>
          <span>•</span>
          <span>COD AVAILABLE</span>
        </div>
      </div>
    </footer>
  );
}
