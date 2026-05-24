'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import Link from 'next/link';
import { 
  ShieldCheck, ShieldAlert, Users, PackageOpen, ClipboardList, Wallet, RefreshCcw, 
  UserPlus, Trash, Image as ImageIcon, LayoutGrid, Settings, Plus, Eye, EyeOff, Save,
  Ticket
} from 'lucide-react';

import { API_BASE } from '../config';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [coupons, setCoupons] = useState([]);

  // Coupon Creation Form States
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState('');

  // Banner Creation Form States
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerActive, setNewBannerActive] = useState(true);

  // Category Creation Form States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');

  // Homepage toggles settings State
  const [sectionSettings, setSectionSettings] = useState({
    showHero: true,
    showCategories: true,
    showStory: true,
    showBridalCards: true,
    showFlashSale: true,
    showTrending: true,
    showThreePillars: true,
    showCustomerLove: true,
    showInstagram: true,
    showPromo: true
  });

  const checkAdminAndFetch = async () => {
    if (!user || user.role !== 'admin') {
      router.push('/profile');
      return;
    }

    try {
      // Fetch Analytics
      const res = await fetch(`${API_BASE}/admin/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }

      // Fetch Users
      const usersRes = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }

      // Fetch Banners (Public route, doesn't strictly need auth but list all)
      const bannersRes = await fetch(`${API_BASE}/banners`);
      if (bannersRes.ok) {
        const bannersData = await bannersRes.json();
        setBanners(bannersData);
      }

      // Fetch Categories
      const categoriesRes = await fetch(`${API_BASE}/categories`);
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      // Fetch Coupons
      const couponsRes = await fetch(`${API_BASE}/coupons`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (couponsRes.ok) {
        const couponsData = await couponsRes.json();
        setCoupons(couponsData);
      }

    } catch (err) {
      setErrorMsg('Unable to load admin data. Check API availability and your admin session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAndFetch();
    
    // Load Homepage Settings from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mradhul_homepage_sections');
      if (stored) {
        try {
          setSectionSettings(JSON.parse(stored));
        } catch (e) {
          console.warn('Failed parsing sections settings.');
        }
      }
    }
  }, [user]);

  // Auth/User updates
  const handleToggleRole = async (targetUserId, currentRole) => {
    setActionLoading(true);
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    try {
      const res = await fetch(`${API_BASE}/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        checkAdminAndFetch();
        setSuccessMsg('User role updated successfully.');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to update role.');
      }
    } catch (err) {
      setErrorMsg('Unable to update this user role right now.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (targetUserId) => {
    if (!confirm('Are you sure you want to remove this user account?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (res.ok) {
        checkAdminAndFetch();
        setSuccessMsg('User deleted successfully.');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to delete user.');
      }
    } catch (err) {
      setErrorMsg('Unable to delete this user right now.');
    } finally {
      setActionLoading(false);
    }
  };

  // Coupon CRUD Operations
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponDiscount || !newCouponExpiry) {
      setErrorMsg('All fields are required to create a coupon.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({
          code: newCouponCode.toUpperCase(),
          discountPercentage: Number(newCouponDiscount),
          expiryDate: newCouponExpiry
        })
      });
      if (res.ok) {
        const created = await res.json();
        setCoupons([...coupons, created]);
        setSuccessMsg(`Coupon ${newCouponCode.toUpperCase()} created successfully!`);
        setNewCouponCode('');
        setNewCouponDiscount('');
        setNewCouponExpiry('');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to create coupon.');
      }
    } catch (err) {
      setErrorMsg('Unable to create this coupon right now.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (res.ok) {
        setCoupons(coupons.filter(c => c._id !== couponId));
        setSuccessMsg('Coupon removed successfully.');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to delete coupon.');
      }
    } catch (err) {
      setErrorMsg('Unable to delete this coupon right now.');
    } finally {
      setActionLoading(false);
    }
  };

  // Banner CRUD Operations
  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImage) {
      setErrorMsg('Banner title and image path are required.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    const newBanner = { title: newBannerTitle, image: newBannerImage, link: newBannerLink || '/', isActive: newBannerActive };

    try {
      const res = await fetch(`${API_BASE}/banners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify(newBanner)
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(prev => [...prev, data]);
        setSuccessMsg('Banner created successfully.');
        setNewBannerTitle('');
        setNewBannerImage('');
        setNewBannerLink('');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to create banner.');
      }
    } catch (err) {
      setErrorMsg('Unable to create this banner right now.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBannerActive = async (bannerId, isActive) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/banners/${bannerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      if (res.ok) {
        checkAdminAndFetch();
        setSuccessMsg('Banner status updated.');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to update banner status.');
      }
    } catch (err) {
      setErrorMsg('Unable to update this banner right now.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (res.ok) {
        setBanners(prev => prev.filter(b => b._id !== bannerId));
        setSuccessMsg('Banner deleted successfully.');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to delete banner.');
      }
    } catch (err) {
      setErrorMsg('Unable to delete this banner right now.');
    } finally {
      setActionLoading(false);
    }
  };

  // Category (Collection) CRUD Operations
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName || !newCategoryImage) {
      setErrorMsg('Category name and image URL are required.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    const newCategory = { name: newCategoryName, image: newCategoryImage };

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(prev => [...prev, data]);
        setSuccessMsg('Collection category created successfully.');
        setNewCategoryName('');
        setNewCategoryImage('');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to create category.');
      }
    } catch (err) {
      setErrorMsg('Unable to create this collection right now.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm('Are you sure you want to delete this collection category?')) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/categories/${catId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c._id !== catId));
        setSuccessMsg('Category deleted successfully.');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to delete category.');
      }
    } catch (err) {
      setErrorMsg('Unable to delete this collection right now.');
    } finally {
      setActionLoading(false);
    }
  };

  // Section Toggles LocalStorage Save
  const handleToggleSection = (sectionKey) => {
    setSectionSettings(prev => {
      const updated = { ...prev, [sectionKey]: !prev[sectionKey] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mradhul_homepage_sections', JSON.stringify(updated));
      }
      return updated;
    });
    setSuccessMsg('Homepage section configuration updated live.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 bg-[#FAF7F2] min-h-screen">
        <RefreshCcw className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm text-gray-500 font-light font-sans">Retrieving administration files...</p>
      </div>
    );
  }

  const maxSalesVal = analytics?.salesByDate?.reduce((max, item) => Math.max(max, item.sales), 1) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 font-sans min-h-screen">
      
      {/* Admin Head options */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-gold/20 pb-6 mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#2B1D20] flex items-center gap-2">
            <ShieldCheck size={32} className="text-brand-primary" /> Royale Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500 font-light mt-1">Transform, update and customize your Jaipur fashion heritage storefront.</p>
        </div>

        {/* Action routing shortcuts */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/admin/products" className="bg-brand-primary text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full hover:bg-brand-primaryDark transition-colors text-center shadow-md">
            Manage Products
          </Link>
          <Link href="/admin/orders" className="border-2 border-brand-primary text-brand-primary text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-brand-primary/5 transition-colors text-center">
            Manage Orders
          </Link>
        </div>
      </div>

      {/* Global Notification Banners */}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm font-semibold rounded-2xl border border-green-200">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-brand-primary text-sm font-semibold rounded-2xl border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Dashboard Sub Navigation Tabs */}
      <div className="flex items-center border-b border-gray-200 mb-8 overflow-x-auto pb-1 gap-6">
        <button
          onClick={() => { setActiveTab('dashboard'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'dashboard' ? 'text-brand-primary border-brand-primary' : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          <Users size={16} /> Analytics & Users
        </button>

        <button
          onClick={() => { setActiveTab('banners'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'banners' ? 'text-brand-primary border-brand-primary' : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          <ImageIcon size={16} /> Banners Slider
        </button>

        <button
          onClick={() => { setActiveTab('collections'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'collections' ? 'text-brand-primary border-brand-primary' : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          <LayoutGrid size={16} /> Collections
        </button>

        <button
          onClick={() => { setActiveTab('homepage'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'homepage' ? 'text-brand-primary border-brand-primary' : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          <Settings size={16} /> Homepage Controls
        </button>

        <button
          onClick={() => { setActiveTab('coupons'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'coupons' ? 'text-brand-primary border-brand-primary' : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          <Ticket size={16} /> Promo Coupons
        </button>
      </div>

      {/* TAB 1: ANALYTICS & USER MANAGER */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-8 animate-slide-up">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-brand-primary/10 text-brand-primary rounded-2xl">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Revenue</p>
                <h3 className="font-serif text-2xl font-bold text-brand-primary">₹{analytics?.summary?.totalSales?.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-brand-primary/10 text-brand-primary rounded-2xl">
                <ClipboardList size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Orders Count</p>
                <h3 className="font-serif text-2xl font-bold text-brand-primary">{analytics?.summary?.totalOrders}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-brand-primary/10 text-brand-primary rounded-2xl">
                <PackageOpen size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Products Catalog</p>
                <h3 className="font-serif text-2xl font-bold text-brand-primary">{analytics?.summary?.totalProducts}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-brand-primary/10 text-brand-primary rounded-2xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Customers Listed</p>
                <h3 className="font-serif text-2xl font-bold text-brand-primary">{analytics?.summary?.totalUsers}</h3>
              </div>
            </div>
          </div>

          {/* Charts details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm">
              <h4 className="font-serif text-lg font-bold mb-6 text-[#2B1D20]">Sales Trend (Aggregated Revenue)</h4>
              <div className="flex items-end justify-between h-48 gap-4 pt-4 border-b border-black/5 pb-2">
                {analytics?.salesByDate?.map((item) => {
                  const heightPct = Math.round((item.sales / maxSalesVal) * 100);
                  return (
                    <div key={item.date} className="flex flex-col items-center gap-2 flex-grow">
                      <div className="text-[9px] font-bold text-brand-primary">₹{item.sales}</div>
                      <div
                        className="w-full bg-brand-primary hover:bg-brand-primaryDark rounded-t-md transition-all duration-300 shadow-sm"
                        style={{ height: `${Math.max(10, heightPct * 1.2)}px` }}
                      />
                      <div className="text-[9px] text-gray-400 truncate max-w-[4rem]">{item.date.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-serif text-lg font-bold mb-4 text-[#2B1D20]">Order Status Metrics</h4>
                <div className="flex flex-col gap-3">
                  {Object.entries(analytics?.orderStatusCount || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-light">{status}</span>
                      <span className="bg-brand-primary/10 text-brand-primary font-bold px-2.5 py-0.5 rounded-full">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-light leading-normal border-t border-black/5 pt-3 mt-4">
                Orders progress triggers database hooks modifying inventory levels automatically.
              </p>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-red-200 shadow-sm flex flex-col gap-4">
              <h4 className="font-serif text-lg font-bold text-red-700 flex items-center gap-2">
                <ShieldAlert size={20} /> Low Stock Alerts
              </h4>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                {analytics?.alerts?.lowStockProducts?.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Inventory levels are healthy.</p>
                ) : (
                  analytics?.alerts?.lowStockProducts?.map(p => (
                    <div key={p._id} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-red-100">
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md">Stock: {p.stock}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-brand-gold/20 shadow-sm flex flex-col gap-4">
              <h4 className="font-serif text-lg font-bold text-brand-primary flex items-center gap-2">
                <PackageOpen size={20} /> Action Required: Pending Orders
              </h4>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                {analytics?.alerts?.pendingOrders?.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No pending orders.</p>
                ) : (
                  analytics?.alerts?.pendingOrders?.map(o => (
                    <div key={o._id} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-brand-gold/10">
                      <span className="font-mono text-gray-600">ID: {o._id.substring(o._id.length - 6)}</span>
                      <span className="font-semibold text-brand-primary">₹{o.totalPrice}</span>
                      <Link href="/admin/orders" className="text-brand-gold font-bold hover:underline">Process &rarr;</Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* User Account Registry Table */}
          <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm">
            <h4 className="font-serif text-lg font-bold mb-4 text-[#2B1D20]">Registered Accounts Manager</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">User Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role Access</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr._id} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-800">{usr.name}</td>
                      <td className="py-3.5 px-4 text-gray-500">{usr.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          usr.role === 'admin' ? 'bg-brand-gold/15 text-brand-gold' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleToggleRole(usr._id, usr.role)}
                          disabled={actionLoading || usr.email === user?.email}
                          className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 bg-brand-primary/5 px-2.5 py-1.5 rounded-lg border border-brand-primary/10 disabled:opacity-40"
                        >
                          <UserPlus size={12} /> Toggle Role
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usr._id)}
                          disabled={actionLoading || usr.role === 'admin'}
                          className="text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors disabled:opacity-40"
                          aria-label="Remove User account"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BANNERS SLIDER MANAGEMENT */}
      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Create Banner Form */}
          <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm h-fit">
            <h4 className="font-serif text-lg font-bold mb-4 text-[#2B1D20] flex items-center gap-2 border-b border-brand-gold/10 pb-2">
              <Plus size={18} className="text-brand-primary" /> Create Heritage Banner
            </h4>
            <form onSubmit={handleCreateBanner} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase">Banner Title</label>
                <input
                  type="text"
                  placeholder="e.g. Royale Jaipur Gota Patti Saree"
                  value={newBannerTitle}
                  onChange={(e) => setNewBannerTitle(e.target.value)}
                  className="border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary bg-[#FAF7F2]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase">Image URL / Path</label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={newBannerImage}
                  onChange={(e) => setNewBannerImage(e.target.value)}
                  className="border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary bg-[#FAF7F2]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase">Target Link Redirect</label>
                <input
                  type="text"
                  placeholder="e.g. /products?category=Handcrafted%20Sarees"
                  value={newBannerLink}
                  onChange={(e) => setNewBannerLink(e.target.value)}
                  className="border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary bg-[#FAF7F2]"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={newBannerActive}
                  onChange={(e) => setNewBannerActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="bannerActive" className="text-xs text-gray-700 font-medium">Publish Active Immediately</label>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="mt-4 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
              >
                <Save size={14} /> Add Slider Banner
              </button>
            </form>
          </div>

          {/* Banner Lists */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm">
            <h4 className="font-serif text-lg font-bold mb-6 text-[#2B1D20] border-b border-brand-gold/10 pb-2">
              Active Slider Banners ({banners.length})
            </h4>
            
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
              {banners.length === 0 ? (
                <p className="text-sm font-light text-gray-400 italic">No banners currently stored in the system database.</p>
              ) : (
                banners.map((b) => (
                  <div key={b._id} className="border border-brand-gold/10 rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row bg-[#FAF7F2]">
                    <div className="h-28 w-full sm:w-44 overflow-hidden relative flex-shrink-0 bg-gray-100">
                      <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <h5 className="font-serif text-sm font-bold text-gray-800">{b.title}</h5>
                        <p className="text-[10px] text-gray-500 font-light truncate mt-1">Link: {b.link}</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-brand-gold/10 pt-2 mt-2">
                        <button
                          onClick={() => handleToggleBannerActive(b._id, b.isActive)}
                          disabled={actionLoading}
                          className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 rounded-md border ${
                            b.isActive 
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {b.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          {b.isActive ? 'Active' : 'Hidden'}
                        </button>

                        <button
                          onClick={() => handleDeleteBanner(b._id)}
                          disabled={actionLoading}
                          className="text-[10px] font-bold text-brand-primary hover:text-brand-primaryDark border border-brand-primary/10 rounded-md px-2.5 py-1 hover:bg-brand-primary/5 flex items-center gap-1"
                        >
                          <Trash size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COLLECTION MANAGEMENT */}
      {activeTab === 'collections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Create Category Form */}
          <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm h-fit">
            <h4 className="font-serif text-lg font-bold mb-4 text-[#2B1D20] flex items-center gap-2 border-b border-brand-gold/10 pb-2">
              <Plus size={18} className="text-brand-primary" /> Create Collection
            </h4>
            <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase">Collection Name</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Anarkalis"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary bg-[#FAF7F2]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-bold uppercase">Collection Image URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={newCategoryImage}
                  onChange={(e) => setNewCategoryImage(e.target.value)}
                  className="border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-brand-primary bg-[#FAF7F2]"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="mt-4 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
              >
                <Save size={14} /> Add Collection
              </button>
            </form>
          </div>

          {/* Collection Lists */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm">
            <h4 className="font-serif text-lg font-bold mb-6 text-[#2B1D20] border-b border-brand-gold/10 pb-2">
              Current Categories ({categories.length})
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {categories.length === 0 ? (
                <p className="text-sm font-light text-gray-400 italic">No categories currently stored in database.</p>
              ) : (
                categories.map((c) => (
                  <div key={c._id || c.name} className="border border-brand-gold/10 rounded-2xl overflow-hidden shadow-sm flex items-center p-3 gap-4 bg-[#FAF7F2]">
                    <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-white border border-brand-gold/20 p-1">
                      <img src={c.image} alt={c.name} className="h-full w-full object-cover rounded-full" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h5 className="font-serif text-sm font-bold text-gray-800 truncate">{c.name}</h5>
                      <button
                        onClick={() => handleDeleteCategory(c._id)}
                        disabled={actionLoading}
                        className="text-[10px] font-bold text-brand-primary hover:text-brand-primaryDark flex items-center gap-1 mt-1 disabled:opacity-40"
                      >
                        <Trash size={12} /> Remove Category
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HOMEPAGE SECTION TOGGLES */}
      {activeTab === 'homepage' && (
        <div className="bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm animate-slide-up">
          <div className="border-b border-brand-gold/10 pb-4 mb-6">
            <h4 className="font-serif text-lg font-bold text-[#2B1D20] flex items-center gap-2">
              <Settings size={20} className="text-brand-primary" /> Homepage Section Customization Controls
            </h4>
            <p className="text-xs text-gray-500 font-light mt-1">Check or uncheck controls to display/hide sections dynamically on the website homepage.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Section 1: Hero Banner */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">1. Hero Slider Banner</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Top-page slider showing royal banners.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showHero}
                onChange={() => handleToggleSection('showHero')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 2: Curated Heritage Categories */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">2. Collection Bubbles</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Round navigation links for categories.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showCategories}
                onChange={() => handleToggleSection('showCategories')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 3: Heritage Story */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">3. Heritage Storytelling</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Artisans support and Jaipur legacy content.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showStory}
                onChange={() => handleToggleSection('showStory')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 4: Collection Editorial Banners */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">4. Editorial Cards (Bridal/Festive)</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Large dual columns visual collection links.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showBridalCards}
                onChange={() => handleToggleSection('showBridalCards')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 5: Flash Sale Countdown */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">5. Artisan Flash Sale</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Limited period sale countdown timer bar.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showFlashSale}
                onChange={() => handleToggleSection('showFlashSale')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 6: Trending Products */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">6. Editor's Picks (Trending)</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Grid displaying popular ethnic items.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showTrending}
                onChange={() => handleToggleSection('showTrending')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 7: Three Pillars */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">7. Three Pillars of Artistry</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Details on block print, Bandhej, gota patti.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showThreePillars}
                onChange={() => handleToggleSection('showThreePillars')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 8: Customer Love */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">8. Customer Testimonials</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Quotes detailing quality and styling scores.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showCustomerLove}
                onChange={() => handleToggleSection('showCustomerLove')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 9: Instagram Fashion Show */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">9. Instagram Social Grid</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Photos styled near heritage structures.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showInstagram}
                onChange={() => handleToggleSection('showInstagram')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

            {/* Section 10: Promo callout */}
            <div className="border border-brand-gold/10 p-4 rounded-2xl flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <h5 className="text-xs font-bold text-gray-800">10. Royal Welcome Code Banner</h5>
                <p className="text-[10px] text-gray-500 mt-0.5">Promo banner displaying WELCOMELUXE discount.</p>
              </div>
              <input
                type="checkbox"
                checked={sectionSettings.showPromo}
                onChange={() => handleToggleSection('showPromo')}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
            </div>

          </div>

          <div className="mt-8 border-t border-brand-gold/20 pt-4 flex justify-end">
            <div className="flex items-center gap-2 text-xs text-brand-primary font-bold">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
              All section settings apply in real-time on the homepage client layout.
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COUPON SYSTEM MANAGER */}
      {activeTab === 'coupons' && (
        <div className="flex flex-col gap-8 animate-slide-up">
          {/* Top Panel: Form & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Coupon Card */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm flex flex-col gap-4">
              <div className="border-b border-brand-gold/10 pb-3 mb-2">
                <h4 className="font-serif text-base font-bold text-[#2B1D20] flex items-center gap-2">
                  <Plus size={18} className="text-brand-primary" /> Create New Coupon
                </h4>
                <p className="text-[10px] text-gray-500 font-light mt-0.5">Add a promotional discount code for customers.</p>
              </div>

              <form onSubmit={handleCreateCoupon} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., JAIPUR20"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#FAF7F2] border border-brand-gold/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-700 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Discount (%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    placeholder="e.g., 20"
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-brand-gold/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newCouponExpiry}
                    onChange={(e) => setNewCouponExpiry(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-brand-gold/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="mt-2 w-full bg-brand-primary hover:bg-[#B3143F] text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <RefreshCcw className="animate-spin" size={14} /> : <Plus size={14} />} Create Coupon
                </button>
              </form>
            </div>

            {/* List Coupons Table Card */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-brand-gold/15 shadow-sm flex flex-col gap-4">
              <div className="border-b border-brand-gold/10 pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-base font-bold text-[#2B1D20] flex items-center gap-2">
                    <Ticket size={18} className="text-brand-primary" /> Active System Coupons
                  </h4>
                  <p className="text-[10px] text-gray-500 font-light mt-0.5">Manage existing discount offers and validity terms.</p>
                </div>
                <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full uppercase">
                  {coupons.length} Code{coupons.length !== 1 && 's'}
                </span>
              </div>

              {coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Ticket className="text-brand-gold/40 animate-pulse" size={36} />
                  <p className="text-xs text-gray-400 italic mt-3">No promotional coupons are currently configured.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-brand-gold/10 text-gray-400 uppercase text-[9px] tracking-wider">
                        <th className="pb-3 font-semibold">Code</th>
                        <th className="pb-3 font-semibold">Discount</th>
                        <th className="pb-3 font-semibold">Expiry Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {coupons.map((coupon) => {
                        const isExpired = new Date(coupon.expiryDate) < new Date();
                        return (
                          <tr key={coupon._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3 font-mono font-bold text-gray-800 tracking-wider text-xs uppercase">{coupon.code}</td>
                            <td className="py-3 font-semibold text-brand-primary text-xs">{coupon.discountPercentage}% Off</td>
                            <td className="py-3 text-gray-500 text-xs">
                              {new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="py-3 text-xs">
                              {isExpired ? (
                                <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">Expired</span>
                              ) : (
                                <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                disabled={actionLoading}
                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors inline-block"
                                title="Delete Coupon"
                              >
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
