'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tag, Settings, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../context';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/users', icon: Users },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && (!user || user.role !== 'admin')) {
      router.push('/profile');
    }
  }, [user, loading, mounted, router]);

  if (!mounted || loading || !user || user.role !== 'admin') {
    return null; // Return nothing while redirecting or loading
  }

  const handleLogout = async () => {
    await logout();
    router.push('/profile');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#121212] overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1E1E1E] border-r border-gray-200 dark:border-[#333] transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-[#333] shrink-0">
          <Link href="/admin" className="font-serif text-xl font-bold tracking-wider text-brand-primary">
            MF ADMIN
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Core</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-primary/10 text-brand-primary font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-brand-primary' : ''} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-[#333] shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold">
              {(user.name || user.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium line-clamp-1">{user.name || user.email}</span>
              <span className="text-xs text-gray-500">Admin</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#333] bg-white dark:bg-[#1E1E1E] lg:hidden shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <span className="font-serif font-bold text-brand-primary">MF ADMIN</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50 dark:bg-[#121212]">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
