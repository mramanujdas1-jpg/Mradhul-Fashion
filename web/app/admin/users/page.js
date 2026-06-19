'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { useRouter } from 'next/navigation';
import { Users, RefreshCcw, Trash } from 'lucide-react';
import { API_BASE } from '../../config';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useApp();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/profile');
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        setErrorMsg('Failed to load users.');
      }
    } catch {
      setErrorMsg('Unable to connect to API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') fetchUsers();
  }, [user, authLoading]);

  if (authLoading || !user || user.role !== 'admin') return null;

  return (
    <div className="p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold flex items-center gap-2">
          <Users size={24} /> All Customers
        </h1>
        <button onClick={fetchUsers} className="flex items-center gap-2 text-sm text-brand-primary hover:underline">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCcw className="animate-spin text-brand-primary" size={32} />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-[#2A2A2A]">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-500">Role</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#333]">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-brand-primary/10 text-brand-primary' :
                      u.role === 'seller' ? 'bg-brand-gold/10 text-brand-gold' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
