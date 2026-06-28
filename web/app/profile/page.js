'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../context';
import { User, LogIn, Mail, Lock, ShieldAlert, Package, MapPin, RefreshCcw, CheckCircle2, ChevronDown, ChevronUp, Phone, Check, Store } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, sendOTP, getAuthErrorMessage } from '../firebase';

import { API_BASE } from '../config';

const formatDate = (value, options) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', options);
};

const estimateDeliveryDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'To be confirmed';
  date.setDate(date.getDate() + 5);
  return formatDate(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const { user, logout, loading, authSyncError, syncFirebaseUser } = useApp();

  // Navigation tabs for logged in users
  const [profileTab, setProfileTab] = useState('orders');

  // Auth form states
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
        body: JSON.stringify({ reason: returnReason, description: returnComment })
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
              Order Date: ${formatDate(order.createdAt)}
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
          <strong>Paid At:</strong> ${formatDate(order.paidAt)}
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

  const handlePrintPremiumInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups to print the invoice.');
      return;
    }

    const invoiceNumber = `MF-${String(order._id).slice(-8).toUpperCase()}`;
    const sellerName = order.seller?.sellerInfo?.storeName || order.seller?.name || 'Mradhul Fashion Seller';
    const customerName = user?.name || order.shippingAddress?.name || 'Customer';
    const customerEmail = user?.email || 'N/A';
    const address = order.shippingAddress;
    const itemsRows = order.orderItems.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${item.name}</strong><br/><span>Product ID: ${item.product || 'N/A'}</span></td>
        <td>${item.size || 'N/A'}</td>
        <td>${item.qty}</td>
        <td>Rs. ${item.price}</td>
        <td>Rs. ${item.price * item.qty}</td>
      </tr>
    `).join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoiceNumber}</title>
        <meta charset="utf-8" />
        <style>
          body { margin: 0; padding: 34px; color: #2B1D20; font-family: Arial, Helvetica, sans-serif; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #701122; padding-bottom: 20px; }
          .brand { display: flex; align-items: center; gap: 12px; }
          .brand img { width: 54px; height: 54px; border-radius: 50%; border: 1px solid #EAD6B0; object-fit: contain; }
          .brand-title { color: #701122; font-family: Georgia, serif; font-size: 25px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
          .brand-sub { color: #C5A059; display: block; font-size: 9px; letter-spacing: 3px; margin-top: 4px; }
          .invoice-title { color: #C5A059; font-size: 20px; font-weight: bold; letter-spacing: 1px; text-align: right; text-transform: uppercase; }
          .muted { color: #6C757D; font-size: 12px; line-height: 1.6; }
          .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 24px 0; }
          .meta div, .panel { border: 1px solid #ECEAE6; border-radius: 10px; padding: 11px; }
          .meta strong, .panel-title { color: #701122; display: block; font-size: 10px; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
          .addresses { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
          .panel { font-size: 12px; line-height: 1.7; }
          table { border-collapse: collapse; font-size: 12px; margin-top: 8px; width: 100%; }
          th { background: #FAF7F2; border-bottom: 2px solid #C5A059; color: #701122; font-size: 10px; letter-spacing: 1px; padding: 11px 8px; text-align: left; text-transform: uppercase; }
          td { border-bottom: 1px solid #ECEAE6; padding: 12px 8px; vertical-align: top; }
          td:nth-child(1), td:nth-child(4) { text-align: center; }
          td:nth-child(5), td:nth-child(6), th:nth-child(5), th:nth-child(6) { text-align: right; }
          td span { color: #8E8E93; font-size: 10px; }
          .summary { display: flex; justify-content: flex-end; margin-top: 24px; }
          .summary table { width: 310px; }
          .summary td { border: 0; padding: 7px 8px; }
          .grand td { border-top: 1px solid #701122; color: #701122; font-size: 16px; font-weight: bold; padding-top: 12px; }
          .footer { border-top: 1px solid #ECEAE6; color: #8E8E93; font-size: 11px; margin-top: 44px; padding-top: 18px; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <img src="${window.location.origin}/logo.png" alt="Mradhul Fashion" />
            <div class="brand-title">Mradhul Fashion<span class="brand-sub">Jaipur Luxury Ethnic</span></div>
          </div>
          <div>
            <div class="invoice-title">Tax Invoice / Receipt</div>
            <div class="muted">Invoice No: <strong>${invoiceNumber}</strong><br/>Date: ${formatDate(order.paidAt || order.createdAt)}</div>
          </div>
        </div>
        <div class="meta">
          <div><strong>Order ID</strong>${order._id}</div>
          <div><strong>Customer</strong>${customerName}</div>
          <div><strong>Payment</strong>${order.paymentMethod} / ${order.isPaid ? 'Paid' : 'Pending'}</div>
          <div><strong>GST</strong>CGST / SGST placeholders</div>
        </div>
        <div class="addresses">
          <div class="panel"><span class="panel-title">Company</span><strong>Mradhul Fashion</strong><br/>Johri Bazar, Old City Sector 4<br/>Jaipur, Rajasthan - 302003<br/>GSTIN: To be updated</div>
          <div class="panel"><span class="panel-title">Billing Address</span><strong>${customerName}</strong><br/>${customerEmail}<br/>${address.streetAddress}<br/>${address.city}, ${address.state} - ${address.postalCode}</div>
          <div class="panel"><span class="panel-title">Seller / Shipping Address</span><strong>${sellerName}</strong><br/>Ship to: ${address.name}<br/>${address.streetAddress}<br/>${address.city}, ${address.state} - ${address.postalCode}<br/>Phone: ${address.phone}</div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div class="summary">
          <table>
            <tr><td>Subtotal</td><td>Rs. ${order.itemsPrice || order.totalPrice}</td></tr>
            <tr><td>Shipping</td><td>Rs. ${order.shippingPrice || 0}</td></tr>
            <tr><td>Taxes / GST</td><td>Rs. ${order.taxPrice || 0}</td></tr>
            <tr class="grand"><td>Grand Total</td><td>Rs. ${order.totalPrice}</td></tr>
          </table>
        </div>
        <div class="muted" style="margin-top: 32px;">
          Payment Method: ${order.paymentMethod}<br/>
          Order Date: ${formatDate(order.createdAt)}<br/>
          Paid At: ${formatDate(order.paidAt)}<br/>
          Generated On: ${formatDate(new Date())}
        </div>
        <div class="footer">Thank you for choosing Mradhul Fashion. For support, email support@mradhulfashion.com.</div>
        <script>window.onload = function() { window.print(); };</script>
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
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      // signInWithRedirect returns undefined (redirects the page), so only handle popup results
      if (result) {
        await syncFirebaseUser(result.user);
        if (redirect === 'checkout') {
          router.push('/checkout');
        }
      }
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
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
                    {formatDate(steps.find(s => s.status === status).timestamp)}
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
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 font-sans">
        <div className="h-80 rounded-2xl border border-gray-200 dark:border-[#222] bg-white dark:bg-[#0A0A0A] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 font-sans">
        <div className="bg-white dark:bg-[#0A0A0A] p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 dark:border-[#222] flex flex-col gap-6 relative">
          <div className="text-center">
            <span className="font-sans text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isPhoneLogin ? 'Login with Mobile' : isLogin ? 'Welcome back' : 'Create an account'}
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              {isPhoneLogin 
                ? 'Enter your phone number to receive a secure OTP' 
                : isLogin 
                  ? 'Sign in to access your luxury couture profile' 
                  : 'Join Mradhul Fashion to track your orders'}
            </p>
          </div>

          {/* Tab Selector between Email and Phone OTP Auth */}
          {!otpSent && (
            <div className="flex border-b border-gray-200 dark:border-[#222] text-sm font-medium text-center">
              <button
                type="button"
                onClick={() => { setIsPhoneLogin(false); setAuthError(''); }}
                className={`w-1/2 pb-3 transition-colors ${!isPhoneLogin ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => { setIsPhoneLogin(true); setAuthError(''); }}
                className={`w-1/2 pb-3 transition-colors ${isPhoneLogin ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                Phone
              </button>
            </div>
          )}

          <div className="flex flex-col w-full gap-5 relative z-10">
            {isPhoneLogin ? (
              <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
                {!otpSent ? (
                  <div className="relative flex items-center">
                    <Phone size={18} className="absolute left-3.5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Mobile Number (e.g. 9876543210)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-transparent border border-gray-300 dark:border-[#333] rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg p-3">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
                        <Check size={14} /> OTP code has been sent to your mobile
                      </p>
                    </div>
                    <div className="relative flex items-center">
                      <Lock size={18} className="absolute left-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="6-digit OTP Code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-transparent border border-gray-300 dark:border-[#333] rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                )}

                {(authError || authSyncError) && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{authError || authSyncError}</p>
                )}
                
                <div id="recaptcha-container"></div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black text-sm font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all w-full mt-1 disabled:opacity-70"
                >
                  {authLoading ? <RefreshCcw size={16} className="animate-spin" /> : !otpSent ? 'Send secure OTP' : 'Verify & Sign in'}
                </button>
                
                {otpSent && (
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="text-xs text-gray-500 hover:text-black dark:hover:text-white font-medium self-center mt-1 transition-colors"
                  >
                    Change mobile number
                  </button>
                )}
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                {!isLogin && (
                  <div className="relative flex items-center">
                    <User size={18} className="absolute left-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-transparent border border-gray-300 dark:border-[#333] rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                )}

                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-transparent border border-gray-300 dark:border-[#333] rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="relative flex items-center">
                  <Lock size={18} className="absolute left-3.5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-transparent border border-gray-300 dark:border-[#333] rounded-xl text-sm focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {(authError || authSyncError) && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{authError || authSyncError}</p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black text-sm font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all w-full mt-1 disabled:opacity-70"
                >
                  {authLoading ? <RefreshCcw size={16} className="animate-spin" /> : isLogin ? 'Continue with Email' : 'Create account'}
                </button>
              </form>
            )}

            {/* Social Logins - 100% Unconditionally Rendered */}
            <div className="flex flex-col gap-5 pt-5 relative z-20">
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-gray-200 dark:border-[#333]"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 dark:text-gray-500">OR CONTINUE WITH</span>
                <div className="flex-grow border-t border-gray-200 dark:border-[#333]"></div>
              </div>
              
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleGoogleLogin}
                disabled={googleLoading || authLoading}
                className="flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-[#121212] text-gray-700 dark:text-gray-200 rounded-xl w-full text-sm font-medium border border-gray-300 dark:border-[#333] shadow-sm hover:shadow-lg hover:border-gray-400 dark:hover:border-[#555] active:scale-[0.99] transition-all duration-200 z-30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm"
              >
                {googleLoading ? (
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-20" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
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
            {(user.name || user.email || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold">{user.name || 'Mradhul Customer'}</h2>
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
          {user.role === 'customer' && (
            <button
              onClick={() => setProfileTab('becomeseller')}
              className={`text-left text-sm py-2 px-4 rounded-xl flex items-center gap-2 font-medium ${
                profileTab === 'becomeseller' ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Store size={16} /> Become a Seller
            </button>
          )}
        </div>

        {/* Tab content view */}
        <div className="md:col-span-3">
          
          {/* Become a Seller Onboarding Form */}
          {profileTab === 'becomeseller' && (
            <div className="bg-white dark:bg-brand-charcoal p-6 md:p-8 rounded-2xl border border-brand-primary/10 shadow-sm space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-brand-primary dark:text-white mb-1">Artisan Merchant Onboarding</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  Join the Mradhul Fashion royal collective. Showcase and ship your handcrafted sarees, designer lehengas, and ethnic-modern collections directly to nationwide patrons.
                </p>
              </div>

              {successMsg && <p className="text-xs font-semibold text-green-600 bg-green-50 p-3 rounded-xl border border-green-200">{successMsg}</p>}
              {errorMsg && <p className="text-xs font-semibold text-brand-primary bg-red-50 p-3 rounded-xl border border-brand-primary/10">{errorMsg}</p>}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setActionLoading(true);
                setErrorMsg('');
                setSuccessMsg('');
                
                const storeName = e.target.storeName.value;
                const storeDescription = e.target.storeDescription.value;
                const phone = e.target.phone.value;
                const gstin = e.target.gstin.value;
                const address = e.target.address.value;

                try {
                  const res = await fetch(`${API_BASE}/auth/register-seller`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
                    },
                    body: JSON.stringify({ storeName, storeDescription, phone, gstin, address })
                  });

                  if (res.ok) {
                    setSuccessMsg('Seller application submitted successfully! Onboarding status has been updated to pending.');
                    const currentFirebaseUser = require('firebase/auth').getAuth().currentUser;
                    if (currentFirebaseUser) {
                      await syncFirebaseUser(currentFirebaseUser);
                    }
                  } else {
                    const data = await res.json();
                    setErrorMsg(data.message || 'Onboarding registration failed.');
                  }
                } catch (err) {
                  setErrorMsg('Failed to process registration.');
                } finally {
                  setActionLoading(false);
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Store / Boutique Name *</label>
                    <input type="text" name="storeName" required className="w-full bg-gray-50 dark:bg-brand-charcoal/20 border border-brand-gold/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800 dark:text-white" placeholder="e.g. Jaipur Heritage Handlooms" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Merchant Contact Phone *</label>
                    <input type="tel" name="phone" required className="w-full bg-gray-50 dark:bg-brand-charcoal/20 border border-brand-gold/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800 dark:text-white" placeholder="e.g. +91 9876543210" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Boutique Story Description</label>
                  <textarea name="storeDescription" rows={3} className="w-full bg-gray-50 dark:bg-brand-charcoal/20 border border-brand-gold/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800 dark:text-white" placeholder="Introduce your boutique's history, local karigars, or regional focus..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">GSTIN Number (15-Digit) *</label>
                    <input type="text" name="gstin" required className="w-full bg-gray-50 dark:bg-brand-charcoal/20 border border-brand-gold/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800 dark:text-white font-mono" placeholder="e.g. 08AAAAA0000A1Z2" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Store Warehouse Address *</label>
                    <input type="text" name="address" required className="w-full bg-gray-50 dark:bg-brand-charcoal/20 border border-brand-gold/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800 dark:text-white" placeholder="e.g. Johri Bazar, Old City, Jaipur" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-brand-primary disabled:bg-gray-200 text-white rounded-full font-bold text-xs uppercase tracking-widest block shadow hover:bg-brand-primaryDark transition-colors"
                >
                  {actionLoading ? 'Submitting Application...' : 'Register Boutique'}
                </button>
              </form>
            </div>
          )}

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
                            <p className="text-xs font-bold">{formatDate(order.createdAt)}</p>
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
                            {renderTrackingStepper(order.trackingSteps || [], order.status)}

                            <div className="flex items-center justify-between text-xs mt-2 border-t border-black/5 dark:border-white/5 pt-3">
                              <span className="text-gray-500 font-light">Estimated Delivery:</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">
                                {estimateDeliveryDate(order.createdAt)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 border-t border-black/5 dark:border-white/5 pt-4 mt-2">
                              <button
                                onClick={() => handlePrintPremiumInvoice(order)}
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

                            {order.returnRequest && (
                              <div className="bg-brand-gold/10 p-4 rounded-xl border border-brand-gold/20 text-xs mt-3">
                                <div className="font-bold text-brand-primary uppercase tracking-wider mb-2">
                                  Return Status: {order.returnRequest.status || 'Requested'}
                                </div>
                                <p className="text-gray-700">
                                  <span className="font-semibold">Reason:</span> {order.returnRequest.reason || 'N/A'}
                                </p>
                                {order.returnRequest.description && (
                                  <p className="text-gray-600 mt-1">
                                    <span className="font-semibold">Description:</span> {order.returnRequest.description}
                                  </p>
                                )}
                                {order.returnRequest.requestedAt && (
                                  <p className="text-gray-500 mt-1">
                                    Requested on {formatDate(order.returnRequest.requestedAt)}
                                  </p>
                                )}
                              </div>
                            )}

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
