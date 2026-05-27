'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import Link from 'next/link';
import { ShoppingBag, Box, ClipboardList, LogOut, Loader2, Store, Clock } from 'lucide-react';

export default function SellerLayout({ children }) {
  const router = useRouter();
  const { user, loading, logout } = useApp();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/profile');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-brand-primary h-10 w-10 mx-auto mb-3" />
          <p className="text-sm font-serif tracking-widest text-[#2B1D20]/60 uppercase">Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Enforce role guard: only sellers and admins
  if (user.role !== 'seller' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-brand-gold/15 shadow-xl text-center">
          <Store className="h-16 w-16 text-brand-gold mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-semibold text-brand-primary mb-3">Artisan Partnership Portal</h2>
          <p className="text-xs md:text-sm text-gray-600 font-light mb-6 leading-relaxed">
            Welcome to the Mradhul Fashion marketplace. Become a certified local seller to upload handblock sets, georgettes, and raw silk lehengas directly to our premium catalog.
          </p>
          <Link
            href="/profile"
            className="w-full py-3 bg-brand-primary text-white rounded-full font-bold text-xs uppercase tracking-widest block shadow-md hover:bg-brand-primaryDark transition-colors"
          >
            Become a Seller
          </Link>
        </div>
      </div>
    );
  }

  // Pending Onboarding screen
  if (user.role === 'seller' && user.sellerStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-12 border border-brand-gold/20 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-gold to-brand-primary" />
          
          <div className="h-20 w-20 rounded-full bg-brand-cream border border-brand-gold/20 flex items-center justify-center mx-auto mb-6 text-brand-gold">
            <Clock size={36} className="animate-pulse" />
          </div>

          <span className="text-[10px] font-bold tracking-[0.25em] text-brand-gold uppercase block mb-2">SHUBH AAGAMAN</span>
          <h2 className="font-serif text-3xl font-semibold text-brand-primary mb-4">Onboarding Verification</h2>
          
          <div className="bg-[#FAF7F2] rounded-2xl p-6 border border-brand-gold/10 text-left mb-8">
            <h4 className="font-serif text-sm font-semibold text-brand-primary mb-2">Store Profile Details:</h4>
            <div className="text-xs space-y-2 text-gray-700">
              <p><span className="font-semibold">Registered Store:</span> {user.sellerInfo?.storeName || 'Mradhul Boutique'}</p>
              <p><span className="font-semibold">Contact Phone:</span> {user.sellerInfo?.phone || user.email}</p>
              <p><span className="font-semibold">Verification Status:</span> <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase text-[9px] tracking-wide ml-1">{user.sellerStatus || 'pending'}</span></p>
            </div>
          </div>

          <p className="text-xs md:text-sm text-gray-600 font-light mb-8 leading-relaxed">
            Our super administrators are currently auditing your artisan craft registry and GSTIN details. Approval typically requires 12 to 24 hours. You will receive an automated email and SMS notification upon activation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-3 border border-brand-gold/30 hover:border-brand-primary text-brand-primary rounded-full font-bold text-xs uppercase tracking-widest transition-all"
            >
              Return Home
            </button>
            <button
              onClick={logout}
              className="flex-1 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Approved Seller Panel Shell
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1617] flex">
      {/* 1. Elegant Gold-Maroon Sidebar Navigation */}
      <aside className="w-64 bg-brand-primary text-white flex flex-col shrink-0 border-r border-brand-gold/20 shadow-xl hidden md:flex">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-cream border border-brand-gold/30 rounded-full flex items-center justify-center text-brand-primary shadow-inner shrink-0">
            <Store size={18} />
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm tracking-widest text-brand-cream uppercase">{user.sellerInfo?.storeName || 'ARTISAN SHOP'}</h1>
            <span className="text-[9px] text-brand-gold font-semibold tracking-widest uppercase">Verified Seller</span>
          </div>
        </div>

        {/* Menu Navigation Links */}
        <nav className="flex-grow p-4 space-y-2 mt-4">
          <Link
            href="/seller"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-wider hover:bg-white/10 rounded-xl transition-all text-brand-cream"
          >
            <Box size={18} className="text-brand-gold" />
            <span>Store Products</span>
          </Link>
          {/* Note: In Next.js, seller page integrates all segments internally. */}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-wider text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut size={18} className="text-brand-gold" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with mobile support */}
        <header className="h-20 bg-white border-b border-brand-gold/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <Store className="text-brand-primary h-6 w-6" />
            <h1 className="font-serif font-bold text-md text-brand-primary uppercase tracking-wider">{user.sellerInfo?.storeName || 'Artisan Boutique'}</h1>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] font-bold tracking-[0.25em] text-brand-gold uppercase block mb-0.5">DASHBOARD WORKSPACE</span>
            <h2 className="font-serif text-lg font-semibold text-brand-primary">Merchant Console</h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-bold text-brand-primary hover:text-brand-primaryDark border border-brand-primary/20 hover:border-brand-primary rounded-full px-4 py-2 uppercase tracking-wider transition-all"
            >
              Customer View
            </Link>
            <button
              onClick={logout}
              className="p-2.5 text-gray-500 hover:text-brand-primary bg-gray-50 hover:bg-brand-cream border border-brand-gold/10 rounded-full transition-all md:hidden"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Workspace */}
        <main className="flex-grow p-6 md:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
