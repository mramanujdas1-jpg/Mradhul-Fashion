'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../context';
import { User, LogIn, Mail, Lock, ShieldAlert, Package, MapPin, RefreshCcw, CheckCircle2, ChevronDown, ChevronUp, Phone, Check } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, sendOTP, isMock } from '../firebase';

import { API_BASE } from '../config';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const { user, logout } = useApp();

  // Navigation tabs for logged in users
  const [profileTab, setProfileTab] = useState('orders');

  // Auth form states
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Phone login states
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Orders list and expand states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Cancel / Return States
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [returningOrderId, setReturningOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load orders if user is authenticated
  const fetchMyOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      setErrorMsg('Unable to load your orders right now. Please refresh in a moment.');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.ok) {
        setSuccessMsg('Order cancelled successfully.');
        setCancelReason('');
        setCancellingOrderId(null);
        fetchMyOrders();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to cancel order.');
      }
    } catch (err) {
      setErrorMsg('Unable to cancel this order right now. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnOrder = async (orderId) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({ reason: returnReason, comment: returnComment })
      });
      if (res.ok) {
        setSuccessMsg('Return request submitted successfully.');
        setReturnReason('');
        setReturnComment('');
        setReturningOrderId(null);
        fetchMyOrders();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to request return.');
      }
    } catch (err) {
      setErrorMsg('Unable to submit this return request right now. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups to print the invoice.');
      return;
    }

    const itemsRows = order.orderItems.map(item => `
      <tr style="border-bottom: 1px solid #ECEAE6;">
        <td style="padding: 12px 8px; font-weight: 500;">${item.name}</td>
        <td style="padding: 12px 8px; color: #6C757D;">${item.size}</td>
        <td style="padding: 12px 8px; text-align: center;">${item.qty}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600;">₹${item.price}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600;">₹${item.price * item.qty}</td>
      </tr>
    `).join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order._id}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2B1D20; margin: 0; padding: 40px; background-color: #ffffff; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #701122; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #701122; letter-spacing: 2px; text-transform: uppercase; font-family: Georgia, serif; }
          .logo-sub { font-size: 10px; color: #C5A059; letter-spacing: 4px; display: block; margin-top: 4px; }
          .invoice-title { font-size: 20px; text-align: right; font-weight: bold; color: #C5A059; text-transform: uppercase; letter-spacing: 1px; }
          .details { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 13px; line-height: 1.6; }
          .address-title { font-weight: bold; text-transform: uppercase; color: #701122; font-size: 11px; margin-bottom: 8px; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 13px; }
          th { background-color: #FAF7F2; color: #701122; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; padding: 12px 8px; border-bottom: 2px solid #C5A059; }
          .summary { display: flex; justify-content: flex-end; }
          .summary-table { width: 300px; font-size: 13px; }
          .summary-table tr td { padding: 6px 8px; }
          .summary-table tr.total { border-top: 1px solid #701122; font-weight: bold; font-size: 16px; color: #701122; }
          .footer { text-align: center; border-top: 1px solid #ECEAE6; padding-top: 20px; margin-top: 60px; font-size: 11px; color: #8E8E93; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Mradhul Fashion<span class="logo-sub">Jaipur Luxury Ethnic</span></div>
          </div>
          <div>
            <div class="invoice-title">Tax Invoice / Receipt</div>
            <div style="font-size: 12px; margin-top: 5px; text-align: right; color: #6C757D;">
              Invoice ID: <span style="font-family: monospace; font-weight: bold;">${order._id}</span><br/>
              Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        <div class="details">
          <div>
            <div class="address-title">Billed By</div>
            <strong>Mradhul Boutique Private Limited</strong><br/>
            Johri Bazar, Old City Sector 4<br/>
            Jaipur, Rajasthan - 302003<br/>
            GSTIN: 08AAHCM9876Q1Z3
          </div>
          <div>
            <div class="address-title">Shipped To</div>
            <strong>${order.shippingAddress.name}</strong><br/>
            ${order.shippingAddress.streetAddress}<br/>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br/>
            Phone: ${order.shippingAddress.phone}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Product Description</th>
              <th style="text-align: left; width: 80px;">Size</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: right; width: 100px;">Price</th>
              <th style="text-align: right; width: 100px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary">
          <table class="summary-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${order.itemsPrice || order.totalPrice}</td>
            </tr>
            <tr>
              <td>Shipping & Delivery</td>
              <td style="text-align: right;">₹${order.shippingPrice || 0}</td>
            </tr>
            <tr>
              <td>Taxes (GST 12%)</td>
              <td style="text-align: right;">₹${order.taxPrice || 0}</td>
            </tr>
            <tr class="total">
              <td style="padding-top: 12px;">Grand Total</td>
              <td style="text-align: right; padding-top: 12px;">₹${order.totalPrice}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 40px; font-size: 11px; color: #8E8E93;">
          <strong>Payment Mode:</strong> ${order.paymentMethod} (${order.isPaid ? 'PAID' : 'PENDING PAYMENT'})<br/>
          <strong>Paid At:</strong> ${order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : 'N/A'}
        </div>

        <div class="footer">
          Thank you for choosing Mradhul Fashion. Handcrafted in Jaipur. For support, email care@mradhulfashion.com.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();
    }
  }, [user]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(authEmail, authPassword);
      } else {
        await signUpWithEmail(authEmail, authPassword, authName);
      }
      if (redirect === 'checkout') {
        router.push('/checkout');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      if (redirect === 'checkout') {
        router.push('/checkout');
      }
    } catch (err) {
      setAuthError(err.message || 'Google authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (!otpSent) {
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        const result = await sendOTP(formattedPhone, 'recaptcha-container');
        setConfirmationResult(result);
        setOtpSent(true);
      } else {
        await confirmationResult.confirm(otp);
        if (redirect === 'checkout') {
          router.push('/checkout');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Phone OTP validation failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Stepper helper
  const renderTrackingStepper = (steps, currentStatus) => {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Out For Delivery', 'Delivered'];
    const currentIndex = statuses.indexOf(currentStatus);

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-6 border-t border-black/5 dark:border-white/5 mt-4 w-full">
        {statuses.map((status, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={status} className="flex flex-row sm:flex-col items-center gap-3 sm:text-center flex-grow relative w-full sm:w-auto">
              {/* connector line */}
              {idx < statuses.length - 1 && (
                <div className={`hidden sm:block absolute top-[14px] left-[50%] right-[-50%] h-[2px] z-0 ${
                  idx < currentIndex ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-white/10'
                }`} />
              )}
              
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs z-10 border-2 ${
                isDone 
                  ? 'bg-brand-primary border-brand-primary text-white' 
                  : 'bg-white dark:bg-brand-charcoal border-gray-300 dark:border-white/10 text-gray-400'
              }`}>
                {isDone ? '✓' : idx + 1}
              </div>
              <div className="flex flex-col sm:items-center">
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  isCurrent ? 'text-brand-primary' : isDone ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'
                }`}>
                  {status}
                </span>
                {/* Find detail log in steps */}
                {steps.find(s => s.status === status) && (
                  <span className="text-[10px] text-gray-400 font-light mt-0.5 max-w-[8rem] truncate sm:whitespace-normal">
                    {new Date(steps.find(s => s.status === status).timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 1. Render login screen if unauthenticated
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 font-sans">
        <div className="glass-panel p-8 rounded-3xl border border-brand-primary/10 flex flex-col gap-6 shadow-md">
          <div className="text-center">
            <span className="font-serif text-3xl font-bold tracking-widest text-brand-primary uppercase">
              {isPhoneLogin ? 'OTP Login' : isLogin ? 'Sign In' : 'Create Account'}
            </span>
            <p className="text-xs text-gray-500 font-light mt-1">
              {isPhoneLogin 
                ? 'Login securely using your mobile number and OTP' 
                : isLogin 
                  ? 'Access your Mradhul Fashion profile & orders' 
                  : 'Join our premium luxury couture platform'}
            </p>
          </div>

          {/* Tab Selector between Email and Phone OTP Auth */}
          {!otpSent && (
            <div className="flex border-b border-black/5 dark:border-white/5 pb-2 text-xs font-semibold uppercase tracking-wider text-center">
              <button
                type="button"
                onClick={() => { setIsPhoneLogin(false); setAuthError(''); }}
                className={`w-1/2 pb-2 ${!isPhoneLogin ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-400'}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => { setIsPhoneLogin(true); setAuthError(''); }}
                className={`w-1/2 pb-2 ${isPhoneLogin ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-400'}`}
              >
                Mobile Number
              </button>
            </div>
          )}

          <div className="flex flex-col w-full gap-6 relative z-10">
            {isPhoneLogin ? (
              <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
                {!otpSent ? (
                  <div className="relative flex items-center">
                    <Phone size={16} className="absolute left-3 text-brand-primary" />
                    <input
                      type="tel"
                      placeholder="Mobile Number (e.g. 9876543210)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
                      <Check size={12} /> OTP code has been sent to your mobile.
                    </p>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-3 text-brand-primary" />
                      <input
                        type="text"
                        placeholder="6-digit OTP Code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                  </div>
                )}

                {authError && <p className="text-xs text-brand-primary font-semibold">{authError}</p>}
                
                <div id="recaptcha-container"></div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm btn-premium w-full mt-2"
                >
                  {authLoading ? <RefreshCcw size={14} className="animate-spin" /> : !otpSent ? 'Send OTP' : 'Verify & Sign In'}
                </button>
                
                {otpSent && (
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="text-xs text-brand-primary hover:underline font-semibold self-center"
                  >
                    Change Mobile Number
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                {!isLogin && (
                  <div className="relative flex items-center">
                    <User size={16} className="absolute left-3 text-brand-primary" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                )}

                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3 text-brand-primary" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3 text-brand-primary" />
                  <input
                    type="password"
                    placeholder="Account Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-black/10 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                {authError && <p className="text-xs text-brand-primary font-semibold">{authError}</p>}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm btn-premium w-full mt-2"
                >
                  {authLoading ? <RefreshCcw size={14} className="animate-spin" /> : isLogin ? 'Sign In' : 'Create Profile'}
                </button>
              </form>
            )}

            {/* Social Logins - 100% Unconditionally Rendered */}
            <div className="flex flex-col gap-4 pt-6 border-t border-black/10 dark:border-white/10 w-full relative z-20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF7F2] dark:bg-[#1E1617] px-4 rounded-full border border-black/10 dark:border-white/10">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest whitespace-nowrap">OR CONTINUE WITH GOOGLE</span>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 py-3 bg-brand-primary text-white rounded-xl w-full text-sm font-bold uppercase tracking-widest hover:bg-brand-primaryDark transition-all shadow-md z-30"
              >
                <LogIn size={18} /> Google Sign-In
              </button>
            </div>

            {/* Toggle form button */}
            {!isPhoneLogin && !otpSent && (
              <div className="text-center text-xs text-gray-500 font-light mt-2">
                {isLogin ? (
                  <span>Don't have an account?{' '}
                    <button onClick={() => setIsLogin(false)} className="text-brand-primary font-bold hover:underline ml-1">
                      Sign Up
                    </button>
                  </span>
                ) : (
                  <span>Already registered?{' '}
                    <button onClick={() => setIsLogin(true)} className="text-brand-primary font-bold hover:underline ml-1">
                      Login
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Render authenticated profile dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 font-sans">
      
      {/* Account Info summary bar */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-primary/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/25 flex items-center justify-center font-bold text-xl uppercase">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">{user.name}</h2>
            <p className="text-xs text-gray-500 font-light">{user.email} • Role: <strong className="text-brand-gold uppercase">{user.role}</strong></p>
          </div>
        </div>

        <div className="flex gap-3">
          {user.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="bg-brand-gold hover:bg-brand-goldLight text-white text-xs font-bold uppercase tracking-wider py-2 px-6 rounded-xl flex items-center gap-1 shadow-sm"
            >
              <ShieldAlert size={14} /> Admin Dash
            </button>
          )}
          <button
            onClick={logout}
            className="border border-brand-primary text-brand-primary hover:bg-brand-primary/5 text-xs font-bold uppercase tracking-wider py-2 px-6 rounded-xl transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation panel */}
        <div className="md:col-span-1 flex flex-col gap-2 border-r border-black/5 dark:border-white/5 pr-6">
          <button
            onClick={() => setProfileTab('orders')}
            className={`text-left text-sm py-2 px-4 rounded-xl flex items-center gap-2 font-medium ${
              profileTab === 'orders' ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Package size={16} /> My Orders
          </button>
          <button
            onClick={() => setProfileTab('addresses')}
            className={`text-left text-sm py-2 px-4 rounded-xl flex items-center gap-2 font-medium ${
              profileTab === 'addresses' ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <MapPin size={16} /> Shipping Addresses
          </button>
        </div>

        {/* Tab content view */}
        <div className="md:col-span-3">
          
          {/* Orders History list */}
          {profileTab === 'orders' && (
            <div className="flex flex-col gap-6">
              <h3 className="font-serif text-xl font-bold mb-2">Order History</h3>
              {successMsg && <p className="text-xs font-semibold text-green-600 bg-green-50 p-3 rounded-xl border border-green-200">{successMsg}</p>}
              {errorMsg && <p className="text-xs font-semibold text-brand-primary bg-red-50 p-3 rounded-xl border border-brand-primary/10">{errorMsg}</p>}

              {ordersLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
                  <RefreshCcw className="animate-spin text-brand-primary" size={20} /> Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm font-light text-gray-500 italic py-6">You haven't placed any orders yet. Start exploring our luxury catalog!</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order._id;
                    return (
                      <div
                        key={order._id}
                        className="bg-white dark:bg-brand-charcoal border border-brand-primary/5 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">Order ID</p>
                            <p className="font-mono text-xs font-bold text-brand-primary">{order._id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">Date</p>
                            <p className="text-xs font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                          <div className="text-sm">
                            <p className="font-light text-gray-500">Items: <strong className="text-gray-800 dark:text-gray-200">{order.orderItems.length}</strong></p>
                            <p className="font-light text-gray-500 mt-1">Total: <strong className="text-brand-primary font-serif font-bold">₹{order.totalPrice}</strong></p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                              order.status === 'Delivered' 
                                ? 'bg-green-500/10 text-green-600' 
                                : 'bg-brand-gold/10 text-brand-gold'
                            }`}>
                              {order.status}
                            </span>

                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                              aria-label="Toggle order tracker details"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded tracker step stepper */}
                        {isExpanded && (
                          <div className="border-t border-black/5 dark:border-white/5 pt-4 flex flex-col gap-4 animate-fade-in">
                            <h4 className="font-semibold text-xs text-brand-gold uppercase tracking-wider">Garment Shipment Tracking</h4>
                            
                            {/* items thumbnail lists */}
                            <div className="flex flex-col gap-2 mt-2">
                              {order.orderItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-xs">
                                  <Image src={item.image} alt={item.name} width={32} height={40} className="h-10 w-8 object-cover rounded" />
                                  <div className="flex-grow">
                                    <span className="font-medium truncate max-w-[12rem] block">{item.name}</span>
                                    <span className="text-[10px] text-gray-400">Qty: {item.qty} | Size: {item.size}</span>
                                  </div>
                                  <span className="font-bold">₹{item.price * item.qty}</span>
                                </div>
                              ))}
                            </div>

                            {/* Stepper progress bar */}
                            {renderTrackingStepper(order.trackingSteps, order.status)}

                            <div className="flex items-center justify-between text-xs mt-2 border-t border-black/5 dark:border-white/5 pt-3">
                              <span className="text-gray-500 font-light">Estimated Delivery:</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">
                                {new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 border-t border-black/5 dark:border-white/5 pt-4 mt-2">
                              <button
                                onClick={() => handlePrintInvoice(order)}
                                className="border border-brand-primary text-brand-primary hover:bg-brand-primary/5 text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-xl transition-all"
                              >
                                Print Invoice
                              </button>

                              {['Pending', 'Processing'].includes(order.status) && (
                                <button
                                  onClick={() => setCancellingOrderId(order._id)}
                                  className="bg-brand-primary hover:bg-[#B3143F] text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-xl transition-all"
                                >
                                  Cancel Order
                                </button>
                              )}

                              {order.status === 'Delivered' && (
                                <button
                                  onClick={() => setReturningOrderId(order._id)}
                                  className="bg-brand-gold hover:bg-[#B59142] text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-xl transition-all"
                                >
                                  Return Request
                                </button>
                              )}
                            </div>

                            {cancellingOrderId === order._id && (
                              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-brand-primary/20 flex flex-col gap-3 mt-3">
                                <span className="text-xs font-bold text-gray-800">Reason for Cancellation</span>
                                <input
                                  type="text"
                                  placeholder="e.g. Changed my mind, found another size..."
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  className="w-full bg-white border border-brand-gold/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCancelOrder(order._id)}
                                    className="bg-brand-primary text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg"
                                    disabled={actionLoading}
                                  >
                                    Confirm Cancel
                                  </button>
                                  <button
                                    onClick={() => setCancellingOrderId(null)}
                                    className="bg-gray-200 text-gray-700 text-[10px] font-bold uppercase px-4 py-2 rounded-lg"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}

                            {returningOrderId === order._id && (
                              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-brand-gold/20 flex flex-col gap-3 mt-3">
                                <span className="text-xs font-bold text-gray-800">Return Request Details</span>
                                <select
                                  value={returnReason}
                                  onChange={(e) => setReturnReason(e.target.value)}
                                  className="w-full bg-white border border-brand-gold/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-gray-700"
                                >
                                  <option value="">Select a reason</option>
                                  <option value="Incorrect Size">Incorrect Size</option>
                                  <option value="Fabric Quality issues">Fabric Quality issues</option>
                                  <option value="Different from pictures">Different from pictures</option>
                                  <option value="Damaged item received">Damaged item received</option>
                                </select>
                                <textarea
                                  placeholder="Additional comments (optional)..."
                                  value={returnComment}
                                  onChange={(e) => setReturnComment(e.target.value)}
                                  className="w-full bg-white border border-brand-gold/10 rounded-xl px-3 py-2 text-xs focus:outline-none h-16 resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReturnOrder(order._id)}
                                    className="bg-brand-gold text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg"
                                    disabled={actionLoading || !returnReason}
                                  >
                                    Submit Request
                                  </button>
                                  <button
                                    onClick={() => setReturningOrderId(null)}
                                    className="bg-gray-200 text-gray-700 text-[10px] font-bold uppercase px-4 py-2 rounded-lg"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Shipping Addresses panel */}
          {profileTab === 'addresses' && (
            <div className="flex flex-col gap-6">
              <h3 className="font-serif text-xl font-bold mb-2">Shipping Destinations</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.addresses?.map((add) => (
                  <div key={add._id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{add.name}</span>
                      {add.isDefault && (
                        <span className="bg-brand-gold/10 text-brand-gold text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-brand-gold/15">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-light leading-relaxed">{add.streetAddress}</p>
                    <p className="text-xs text-gray-500 font-light leading-relaxed">{add.city}, {add.state} - {add.postalCode}</p>
                    <p className="text-xs text-gray-400 font-semibold mt-2">{add.phone}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setProfileTab('orders')}
                className="text-xs font-bold text-brand-primary hover:underline self-start border border-brand-primary/20 rounded-lg px-4 py-2 mt-2"
              >
                Go to checkout or cart to add shipping destinations
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <RefreshCcw className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm font-light text-gray-400 font-sans">Loading profile page...</p>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
