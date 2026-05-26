'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context';
import Link from 'next/link';
import { RefreshCcw, ArrowLeft, ChevronDown, ChevronUp, Clock, Truck, ClipboardCheck } from 'lucide-react';

import { API_BASE } from '../../config';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Status updating states
  const [targetStatus, setTargetStatus] = useState('Processing');
  const [statusDesc, setStatusDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAllOrders = async () => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/profile');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      setErrorMsg('Unable to load live orders. Check API availability and admin authentication.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchAllOrders();
    }
  }, [user, authLoading]);

  const handleUpdateStatus = async (orderId) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({
          status: targetStatus,
          description: statusDesc || `Garment shipment updated to: ${targetStatus}`
        })
      });

      if (res.ok) {
        setStatusDesc('');
        fetchAllOrders();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      setErrorMsg('Unable to update this order right now.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 font-sans">
      
      {/* Head navbar */}
      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-8">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold">Transaction Operations</h1>
            <p className="text-xs text-gray-500 font-light mt-0.5">Admin tools to verify customer payment completion, ship packages, and add tracking steps.</p>
          </div>
        </div>
      </div>

      {/* Orders grids */}
      {authLoading || loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-12">
          <RefreshCcw className="animate-spin text-brand-primary" size={20} /> Querying order databases...
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm font-light text-gray-500 italic py-6 text-center">No customer transactions found in records.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order._id;
            return (
              <div
                key={order._id}
                className="bg-white dark:bg-brand-charcoal border border-brand-primary/5 rounded-2xl p-6 shadow-sm flex flex-col gap-4"
              >
                {/* Header row summaries */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Order Reference</span>
                    <strong className="font-mono text-brand-primary font-bold">{order._id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Customer Details</span>
                    <span className="font-medium">{order.user?.name} ({order.user?.email})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">Grand Total</span>
                    <strong className="text-brand-primary">₹{order.totalPrice} ({order.paymentMethod})</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      order.status === 'Delivered' ? 'bg-green-500/10 text-green-600' : 'bg-brand-gold/10 text-brand-gold'
                    }`}>
                      {order.status}
                    </span>
                    <button
                      onClick={() => {
                        setExpandedOrderId(isExpanded ? null : order._id);
                        setTargetStatus(order.status === 'Pending' ? 'Processing' : order.status);
                      }}
                      className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                      aria-label="Toggle Order Info Drawer"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded details editor drawer */}
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 animate-fade-in text-xs">
                    {/* Left: item list & delivery destination address */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="font-semibold text-brand-gold uppercase tracking-wider mb-2">Delivery Destination</h4>
                        <p className="font-medium">{order.shippingAddress.name} ({order.shippingAddress.phone})</p>
                        <p className="text-gray-500 font-light mt-0.5 leading-relaxed">{order.shippingAddress.streetAddress}</p>
                        <p className="text-gray-500 font-light leading-relaxed">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-brand-gold uppercase tracking-wider mb-2">Package Items</h4>
                        <div className="flex flex-col gap-2">
                          {order.orderItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-2">
                              <img src={item.image} alt={item.name} className="h-10 w-8 object-cover rounded" />
                              <div className="flex-grow">
                                <span className="font-medium block truncate max-w-[12rem]">{item.name}</span>
                                <span className="text-[10px] text-gray-400 font-light">Qty: {item.qty} | Size: {item.size}</span>
                              </div>
                              <span className="font-bold">₹{item.price * item.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: progress status updater */}
                    <div className="glass-panel p-5 rounded-xl border border-brand-primary/10 flex flex-col gap-4">
                      <h4 className="font-serif font-bold text-sm text-brand-primary">Update Shipment Status</h4>
                      
                      {errorMsg && <p className="text-xs text-brand-primary font-semibold">{errorMsg}</p>}

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Select Target Milestone</label>
                        <select
                          value={targetStatus}
                          onChange={(e) => setTargetStatus(e.target.value)}
                          className="bg-transparent border border-black/10 dark:border-white/10 p-2 rounded-lg focus:outline-none"
                        >
                          <option value="Processing">Processing (Verify / packing)</option>
                          <option value="Shipped">Shipped (Dispatched to carrier)</option>
                          <option value="Out For Delivery">Out For Delivery (Arrived at local hub)</option>
                          <option value="Delivered">Delivered (Handed to customer)</option>
                          <option value="Cancelled">Cancelled (Returned/Declined)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Tracking Step Detail Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Package dispatched via Bluedart tracking number BD9281729."
                          value={statusDesc}
                          onChange={(e) => setStatusDesc(e.target.value)}
                          className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-lg focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={() => handleUpdateStatus(order._id)}
                        disabled={actionLoading}
                        className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg shadow-sm transition-all"
                      >
                        Push Tracking Step
                      </button>

                      {/* Current log history */}
                      <div className="border-t border-black/5 dark:border-white/5 pt-3 mt-1">
                        <span className="font-semibold text-[10px] uppercase text-gray-400">Tracking Log History</span>
                        <div className="flex flex-col gap-2 mt-2 max-h-32 overflow-y-auto pr-1">
                          {order.trackingSteps.map((step, sidx) => (
                            <div key={sidx} className="flex gap-2.5 items-start text-[10px] border-b border-black/5 dark:border-white/5 pb-1">
                              <span className="font-bold text-brand-primary min-w-[5rem] uppercase">{step.status}</span>
                              <div className="flex-grow">
                                <p className="font-light text-gray-600 dark:text-gray-300">{step.description}</p>
                                <span className="text-[8px] text-gray-400 font-light block mt-0.5">{step.timestamp ? new Date(step.timestamp).toLocaleString() : 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
