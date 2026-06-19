'use client';

import React from 'react';
import { useApp } from '../../context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/profile');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== 'admin') return null;

  return (
    <div className="p-6 font-sans">
      <h1 className="font-serif text-2xl font-semibold flex items-center gap-2 mb-6">
        <Settings size={24} /> Platform Settings
      </h1>
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333] p-8 text-center text-gray-400">
        <Settings size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-sm">Advanced platform settings are managed from the Admin Dashboard main page.</p>
        <button
          onClick={() => router.push('/admin')}
          className="mt-4 bg-brand-primary text-white text-xs font-bold uppercase tracking-wider py-2 px-6 rounded-full hover:bg-brand-primaryDark transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
