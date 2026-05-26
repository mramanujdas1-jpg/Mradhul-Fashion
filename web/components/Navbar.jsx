'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '../app/context';
import { ShoppingBag, Heart, User, Sun, Moon, Search, Menu, X, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, cart, wishlist, theme, toggleTheme, logout, setCartOpen } = useApp();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?keyword=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    setProfileDropdownOpen(false);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const wishlistCount = wishlist.length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 shadow-sm">
      {/* Heritage Announcement Ribbon */}
      <div className="bg-brand-primary text-brand-beige text-[10px] tracking-[0.25em] font-semibold py-2 px-4 text-center uppercase flex justify-center items-center gap-2 border-b border-brand-gold/20">
        <span>🌸 Made in Jaipur</span>
        <span className="opacity-40">•</span>
        <span>Handcrafted with Love</span>
        <span className="opacity-40">•</span>
        <span className="hidden sm:inline">Free Shipping Over ₹1499</span>
      </div>
      <nav className="h-20 glass-panel transition-all duration-300 flex items-center px-4 md:px-12 justify-between">
        {/* Brand logo & mobile menu trigger */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="md:hidden p-2 text-brand-primary"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Mradhul Fashion Logo"
              width={48}
              height={48}
              priority
              className="h-12 w-12 object-contain rounded-full border border-brand-gold/30"
            />
            <div className="hidden sm:block">
              <span className="font-serif text-lg font-bold tracking-widest text-brand-primary dark:text-white uppercase block leading-none">
                Mradhul
              </span>
              <span className="font-sans text-[9px] tracking-[0.28em] text-brand-gold font-semibold uppercase flex items-center gap-1.5 mt-0.5">
                <span>FASHION</span>
                <span className="opacity-50 text-[7px]">• JAIPUR</span>
              </span>
            </div>
          </Link>
        </div>

      {/* Main Navigation Links */}
      <div className="hidden md:flex items-center gap-8 font-semibold tracking-wider text-sm uppercase">
        <Link href="/products" className="hover:text-brand-primary transition-colors">
          Shop All
        </Link>
        <Link href="/products?trending=true" className="hover:text-brand-primary transition-colors">
          Trending
        </Link>
        <Link href="/products?flashSale=true" className="hover:text-brand-primary transition-colors">
          Flash Sale
        </Link>
        {user?.role === 'admin' && (
          <Link href="/admin" className="flex items-center gap-1 text-brand-gold hover:text-brand-primary transition-colors">
            <ShieldAlert size={16} /> Admin Panel
          </Link>
        )}
      </div>

      {/* Actions (Search, Theme, Wishlist, Cart, Profile) */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Live Search Form */}
        <form onSubmit={handleSearch} className="relative hidden sm:flex items-center">
          <input
            type="text"
            placeholder="Search premium collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-1.5 rounded-full border border-brand-primary/20 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary w-48 lg:w-64 transition-all duration-300"
          />
          <button type="submit" className="absolute right-3 text-brand-primary" aria-label="Search">
            <Search size={18} />
          </button>
        </form>

        {/* Mobile search toggle */}
        <button 
          onClick={() => setSearchOpen(!searchOpen)} 
          className="sm:hidden p-2 text-brand-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
          aria-label="Toggle search input"
        >
          <Search size={20} />
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          className="p-2 text-brand-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          aria-label="Toggle dark/light mode"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Wishlist */}
        <Link href="/products" className="relative p-2 text-brand-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <Heart size={20} className={wishlistCount > 0 ? "fill-brand-primary" : ""} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-gold text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart */}
        <button onClick={() => setCartOpen(true)} className="relative p-2 text-brand-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        {/* Account Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
            className="p-2 text-brand-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center gap-1"
            aria-label="User profile menu"
          >
            <User size={20} />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 glass-panel shadow-lg rounded-xl overflow-hidden py-2 border border-brand-primary/10 transition-all duration-200">
              {user ? (
                <>
                  <div className="px-4 py-2 border-b border-black/5 dark:border-white/5">
                    <p className="text-xs text-brand-gold font-semibold uppercase">Logged In As</p>
                    <p className="font-bold text-sm truncate">{user.name}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-brand-primary/10 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                    My Profile
                  </Link>
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-brand-primary/10 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                    Track Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-brand-primary/10 transition-colors text-brand-gold font-bold" onClick={() => setProfileDropdownOpen(false)}>
                      Admin Settings
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-brand-primary hover:bg-brand-primary/10 transition-colors font-semibold border-t border-black/5 dark:border-white/5 mt-1">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-brand-primary/10 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-brand-primary/10 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                    Create Account
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar dropdown overlay */}
      {searchOpen && (
        <div className="absolute top-20 left-0 right-0 p-4 glass-panel border-b border-brand-primary/10 flex sm:hidden">
          <form onSubmit={handleSearch} className="relative w-full flex items-center">
            <input
              type="text"
              placeholder="Search premium collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full border border-brand-primary/20 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <button type="submit" className="absolute right-3 text-brand-primary" aria-label="Search submit">
              <Search size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 top-20 bg-black/40 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="w-64 h-full glass-panel shadow-2xl p-6 flex flex-col gap-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <span className="font-serif text-lg font-bold border-b border-brand-primary/10 pb-2 uppercase text-brand-primary tracking-widest">
              Navigation
            </span>
            <Link href="/products" className="text-base hover:text-brand-primary transition-colors font-semibold" onClick={() => setMenuOpen(false)}>
              Shop All
            </Link>
            <Link href="/products?trending=true" className="text-base hover:text-brand-primary transition-colors font-semibold" onClick={() => setMenuOpen(false)}>
              Trending Styles
            </Link>
            <Link href="/products?flashSale=true" className="text-base hover:text-brand-primary transition-colors font-semibold" onClick={() => setMenuOpen(false)}>
              Flash Sale
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-base text-brand-gold hover:text-brand-primary transition-colors font-bold flex items-center gap-1 border-t border-brand-primary/10 pt-2" onClick={() => setMenuOpen(false)}>
                <ShieldAlert size={16} /> Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
    </header>
  );
}
