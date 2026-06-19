'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { useRouter } from 'next/navigation';
import { Tag, RefreshCcw, Trash, Plus } from 'lucide-react';
import { API_BASE } from '../../config';

export default function AdminCouponsPage() {
  const { user, loading: authLoading } = useApp();
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/profile');
    }
  }, [user, authLoading, router]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (res.ok) setCoupons(await res.json());
    } catch {
      setErrorMsg('Unable to load coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') fetchCoupons();
  }, [user, authLoading]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({ code: newCode.toUpperCase(), discountPercentage: Number(newDiscount), expiryDate: newExpiry })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Coupon ${data.code} created.`);
        setNewCode(''); setNewDiscount(''); setNewExpiry('');
        fetchCoupons();
      } else {
        setErrorMsg(data.message || 'Failed to create coupon.');
      }
    } catch {
      setErrorMsg('API error.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await fetch(`${API_BASE}/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      fetchCoupons();
    } catch {
      setErrorMsg('Delete failed.');
    }
  };

  if (authLoading || !user || user.role !== 'admin') return null;

  return (
    <div className="p-6 font-sans">
      <h1 className="font-serif text-2xl font-semibold flex items-center gap-2 mb-6">
        <Tag size={24} /> Coupon Management
      </h1>

      {/* Create Coupon */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333] p-6 mb-6">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-4">Create New Coupon</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Code</label>
            <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="SAVE20" required
              className="border border-gray-300 dark:border-[#444] rounded-lg px-3 py-2 text-sm bg-transparent uppercase font-bold w-36 focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Discount %</label>
            <input value={newDiscount} onChange={e => setNewDiscount(e.target.value)} type="number" min="1" max="100" placeholder="20" required
              className="border border-gray-300 dark:border-[#444] rounded-lg px-3 py-2 text-sm bg-transparent w-28 focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Expiry Date</label>
            <input value={newExpiry} onChange={e => setNewExpiry(e.target.value)} type="date" required
              className="border border-gray-300 dark:border-[#444] rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-primary" />
          </div>
          <button type="submit" disabled={creating}
            className="bg-brand-primary text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-brand-primaryDark transition-colors disabled:opacity-60">
            <Plus size={14} /> {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
        {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-xs mt-2">{successMsg}</p>}
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex justify-center py-10"><RefreshCcw className="animate-spin text-brand-primary" size={28} /></div>
      ) : (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-[#2A2A2A]">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Code</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Discount</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Expires</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#333]">
              {coupons.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-[#2A2A2A]">
                  <td className="px-4 py-3 font-bold font-mono">{c.code}</td>
                  <td className="px-4 py-3 text-brand-gold font-semibold">{c.discountPercentage}% OFF</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.expiryDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:text-red-700 transition-colors">
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No coupons found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
