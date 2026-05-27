'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { useRouter } from 'next/navigation';
import { 
  Box, ClipboardList, Plus, Trash2, Edit3, X, Save, Image as ImageIcon, 
  RefreshCcw, DollarSign, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle
} from 'lucide-react';
import { API_BASE } from '../config';

const categoriesList = [
  'Handcrafted Sarees',
  'Designer Lehengas',
  'Royal Anarkalis',
  'Jaipur Fusion Wear',
  'Bridal & Festive',
  'Artisan Jackets & Dupattas',
  'Menswear',
  'Kidswear'
];

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const genderOptions = ['Women', 'Men', 'Kids', 'Unisex'];

export default function SellerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useApp();

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders' | 'analytics'
  
  // Data lists
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Product editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formImages, setFormImages] = useState([]);
  const [formColors, setFormColors] = useState('');
  const [stockPerSize, setStockPerSize] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    discountPrice: '',
    category: 'Handcrafted Sarees',
    subcategory: '',
    brand: 'Mradhul Jaipur',
    gender: 'Women',
    fabricMaterial: '',
    careInstructions: '',
    sku: '',
    tags: '',
    isTrending: false,
    isFlashSale: false,
    deliveryInfo: 'Ships within 24-48 hours.',
    returnPolicy: '7-day hassle-free returns.'
  });

  // Order detail state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [descriptionUpdate, setDescriptionUpdate] = useState('');

  const fetchSellerData = async () => {
    if (authLoading) return;
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      router.push('/profile');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const token = localStorage.getItem('mf_auth_token');

    try {
      // 1. Fetch seller's isolated products
      const prodRes = await fetch(`${API_BASE}/products/seller/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData || []);
      }

      // 2. Fetch seller's isolated orders
      const orderRes = await fetch(`${API_BASE}/orders/seller/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData || []);
      }
    } catch (err) {
      setErrorMsg('Failed to synchronize store data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchSellerData();
    }
  }, [user, authLoading]);

  // Handle open editor for new product
  const handleOpenNewEditor = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      shortDescription: '',
      description: '',
      price: '',
      discountPrice: '',
      category: 'Handcrafted Sarees',
      subcategory: '',
      brand: 'Mradhul Jaipur',
      gender: 'Women',
      fabricMaterial: '',
      careInstructions: '',
      sku: '',
      tags: '',
      isTrending: false,
      isFlashSale: false,
      deliveryInfo: 'Ships within 24-48 hours.',
      returnPolicy: '7-day hassle-free returns.'
    });
    setFormImages([]);
    setFormColors('');
    setStockPerSize({ 'S': 5, 'M': 5, 'L': 5 });
    setEditorOpen(true);
  };

  // Handle open editor for editing existing product
  const handleOpenEditEditor = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      price: prod.price || '',
      discountPrice: prod.discountPrice || '',
      category: prod.category || 'Handcrafted Sarees',
      subcategory: prod.subcategory || '',
      brand: prod.brand || 'Mradhul Jaipur',
      gender: prod.gender || 'Women',
      fabricMaterial: prod.fabricMaterial || '',
      careInstructions: prod.careInstructions || '',
      sku: prod.sku || '',
      tags: (prod.tags || []).join(', '),
      isTrending: prod.isTrending || false,
      isFlashSale: prod.isFlashSale || false,
      deliveryInfo: prod.deliveryInfo || '',
      returnPolicy: prod.returnPolicy || ''
    });
    setFormImages(prod.images || []);
    setFormColors((prod.colors || []).join(', '));
    setStockPerSize(prod.stockPerSize || {});
    setEditorOpen(true);
  };

  // Stock editor helpers
  const handleStockChange = (size, qty) => {
    setStockPerSize(prev => ({
      ...prev,
      [size]: parseInt(qty) || 0
    }));
  };

  const addSizeToStock = (size) => {
    if (stockPerSize[size] === undefined) {
      setStockPerSize(prev => ({ ...prev, [size]: 0 }));
    }
  };

  // Image Upload helper
  const handleImageUploads = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('mf_auth_token');
      const uploadedUrls = [];

      for (const file of files) {
        const base64Str = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
        });

        const res = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Str })
        });

        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url);
        } else {
          throw new Error('Image upload failed');
        }
      }

      setFormImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      setErrorMsg(err.message || 'Image upload failed. Cloudinary timed out.');
    } finally {
      setUploading(false);
    }
  };

  // Submit Product Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      setErrorMsg('Product title and price are required.');
      return;
    }
    setErrorMsg('');

    const token = localStorage.getItem('mf_auth_token');
    
    // Sum stock levels
    let totalStock = 0;
    const activeSizes = [];
    Object.entries(stockPerSize).forEach(([size, qty]) => {
      if (qty > 0) {
        totalStock += qty;
        activeSizes.push(size);
      }
    });

    const payload = {
      ...formData,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      colors: formColors ? formColors.split(',').map(c => c.trim()).filter(Boolean) : [],
      images: formImages.length ? formImages : ['/logo.png'],
      stockPerSize,
      stock: totalStock,
      sizes: activeSizes.length > 0 ? activeSizes : ['Free Size']
    };

    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `${API_BASE}/products/${editingProduct._id}` : `${API_BASE}/products`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditorOpen(false);
        fetchSellerData();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Saving product failed.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    const token = localStorage.getItem('mf_auth_token');
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSellerData();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to delete product.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend.');
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    if (!statusUpdate) return;

    const token = localStorage.getItem('mf_auth_token');
    try {
      const res = await fetch(`${API_BASE}/orders/${selectedOrder._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: statusUpdate,
          description: descriptionUpdate || `Order state updated to: ${statusUpdate}`
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedOrder(updated);
        setDescriptionUpdate('');
        fetchSellerData();
      }
    } catch (err) {
      console.error('Failed to update status.');
    }
  };

  // Analytics helper counts
  const totalSalesVal = orders.reduce((sum, ord) => ord.isPaid ? sum + ord.totalPrice : sum, 0);
  const lowStockAlerts = products.filter(p => p.stock < 5);

  return (
    <div className="flex flex-col gap-8">
      {/* Tab Selector Nav */}
      <div className="flex border-b border-brand-gold/15 shrink-0 bg-white rounded-2xl p-1 shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'products'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-[#2B1D20]/60 hover:text-brand-primary hover:bg-brand-cream'
          }`}
        >
          Catalog
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-[#2B1D20]/60 hover:text-brand-primary hover:bg-brand-cream'
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-[#2B1D20]/60 hover:text-brand-primary hover:bg-brand-cream'
          }`}
        >
          Analytics
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-600 text-sm">
          {errorMsg}
        </div>
      )}

      {/* --- TAB 1: PRODUCTS CATALOG --- */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-brand-primary">Merchant Catalog</h3>
              <p className="text-xs text-gray-500 mt-1">Manage your storefront items, stock quantities, and pricing.</p>
            </div>
            <button
              onClick={handleOpenNewEditor}
              className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full flex items-center gap-2 shadow-md transition-all"
            >
              <Plus size={16} /> Add Apparel
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-brand-gold/10 overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                <RefreshCcw className="animate-spin text-brand-primary" size={24} />
                <p className="text-xs font-serif tracking-widest uppercase">Fetching Catalog...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-brand-cream rounded-full border border-brand-gold/15 flex items-center justify-center text-brand-gold mb-4">
                  <Box size={28} />
                </div>
                <h4 className="font-serif text-lg font-semibold mb-2">No Products Uploaded</h4>
                <p className="text-xs text-gray-500 mb-6 max-w-sm font-light leading-relaxed">
                  Your store is currently empty. Upload your first handcrafted Jaipur apparel to display it to customers.
                </p>
                <button
                  onClick={handleOpenNewEditor}
                  className="bg-brand-primary text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full"
                >
                  Upload First Product
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-brand-cream text-[#2B1D20] font-serif border-b border-brand-gold/10">
                      <th className="py-4 px-6 font-semibold">Product info</th>
                      <th className="py-4 px-6 font-semibold">Category</th>
                      <th className="py-4 px-6 font-semibold">Stock status</th>
                      <th className="py-4 px-6 font-semibold">Price details</th>
                      <th className="py-4 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((prod) => (
                      <tr key={prod._id} className="hover:bg-brand-cream/10 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-11 rounded-lg bg-gray-50 border border-brand-gold/10 overflow-hidden shrink-0">
                              {prod.images && prod.images[0] ? (
                                <img src={prod.images[0]} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="h-full w-full p-2 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-serif font-semibold text-brand-primary text-sm line-clamp-1">{prod.name}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{prod.sku || 'No SKU'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 bg-brand-cream border border-brand-gold/10 text-brand-primary text-[10px] uppercase font-bold tracking-wider rounded-md">
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-semibold text-xs ${prod.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {prod.stock} items remaining
                          </span>
                          {Object.keys(prod.stockPerSize || {}).length > 0 && (
                            <p className="text-[10px] text-gray-500 mt-1 font-light">
                              {Object.entries(prod.stockPerSize || {})
                                .filter(([_, qty]) => qty > 0)
                                .map(([s, q]) => `${s}: ${q}`).join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 font-medium text-xs">
                          {prod.discountPrice ? (
                            <div>
                              <span className="font-bold text-brand-primary text-sm">₹{prod.discountPrice}</span>
                              <span className="text-[10px] text-gray-400 line-through ml-2">₹{prod.price}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-brand-primary text-sm">₹{prod.price}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleOpenEditEditor(prod)}
                              className="p-2 text-brand-primary hover:text-brand-primaryDark bg-white hover:bg-brand-cream border border-brand-gold/20 hover:border-brand-primary rounded-full transition-all shadow-sm"
                              title="Edit product"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod._id)}
                              className="p-2 text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-red-100 hover:border-red-300 rounded-full transition-all shadow-sm"
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: STORE ORDERS --- */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-brand-primary">Merchant Orders</h3>
            <p className="text-xs text-gray-500 mt-1">Fulfill incoming store orders, track payment statuses, and schedule shipments.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Orders list */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-brand-gold/10 overflow-hidden shadow-sm">
              {loading ? (
                <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCcw className="animate-spin text-brand-primary" size={24} />
                  <p className="text-xs font-serif tracking-widest uppercase">Fetching Orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="h-16 w-16 bg-brand-cream rounded-full border border-brand-gold/15 flex items-center justify-center text-brand-gold mb-4">
                    <ClipboardList size={28} />
                  </div>
                  <h4 className="font-serif text-lg font-semibold mb-2">No Orders Placed Yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm font-light leading-relaxed">
                    Once customers checkout items from your catalog, they will display here immediately.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-brand-cream text-[#2B1D20] font-serif border-b border-brand-gold/10">
                        <th className="py-4 px-6 font-semibold">Order ID / Date</th>
                        <th className="py-4 px-6 font-semibold">Customer</th>
                        <th className="py-4 px-6 font-semibold">Payout</th>
                        <th className="py-4 px-6 font-semibold">Status</th>
                        <th className="py-4 px-6 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((ord) => (
                        <tr key={ord._id} className="hover:bg-brand-cream/10 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-brand-primary text-xs font-mono line-clamp-1">#{ord._id}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ord.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-gray-800">{ord.shippingAddress?.name || ord.user?.name || 'Customer'}</p>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{ord.shippingAddress?.city || 'No City'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-brand-primary">₹{ord.totalPrice}</span>
                            <span className={`block text-[9px] uppercase font-bold tracking-wider mt-0.5 ${ord.isPaid ? 'text-green-600' : 'text-amber-500'}`}>
                              {ord.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border ${
                              ord.status === 'Delivered' 
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : ord.status === 'Cancelled'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-end">
                              <button
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setStatusUpdate(ord.status);
                                }}
                                className="px-3 py-1.5 bg-brand-cream border border-brand-gold/20 hover:border-brand-primary text-brand-primary rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                              >
                                Fulfill <ArrowRight size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Order Details Onboarding / Status update console */}
            <div className="lg:col-span-1">
              {selectedOrder ? (
                <div className="bg-white rounded-3xl border border-brand-gold/15 p-6 shadow-md space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-primary" />
                  
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="font-serif text-sm font-semibold text-brand-primary">Order Fulfiller</h4>
                    <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase block">SHIP TO ADDRESS</span>
                      <p className="text-xs font-bold text-gray-800 mt-1">{selectedOrder.shippingAddress?.name}</p>
                      <p className="text-xs text-gray-600 leading-normal font-light mt-0.5">{selectedOrder.shippingAddress?.streetAddress}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}</p>
                      <p className="text-xs text-gray-600 font-light mt-0.5">Phone: {selectedOrder.shippingAddress?.phone}</p>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase block mb-2">STORE APPAREL ITEMS</span>
                      <div className="space-y-3">
                        {selectedOrder.orderItems.map((item, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="h-10 w-8 rounded border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                              <img src={item.image} className="h-full w-full object-cover" alt="" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-serif font-semibold text-brand-primary line-clamp-1">{item.name}</p>
                              <p className="text-[10px] text-gray-500 font-light">Size: {item.size} • Qty: {item.qty} • ₹{item.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleUpdateOrderStatus} className="border-t border-gray-100 pt-4 space-y-4">
                      <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase block mb-1">UPDATE FULFILLMENT STATUS</span>
                      
                      <div>
                        <select
                          value={statusUpdate}
                          onChange={(e) => setStatusUpdate(e.target.value)}
                          className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-brand-primary text-brand-primary"
                        >
                          <option value="Pending">Pending Approval</option>
                          <option value="Processing">Processing / Packing</option>
                          <option value="Shipped">Shipped / Dispatched</option>
                          <option value="Out For Delivery">Out For Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-500 font-semibold mb-1">Milestone Description</label>
                        <input
                          type="text"
                          value={descriptionUpdate}
                          onChange={(e) => setDescriptionUpdate(e.target.value)}
                          placeholder="e.g. Package dispatched via Bluedart. Tracking ID: BD12345"
                          className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered'}
                        className="w-full py-2.5 bg-brand-primary disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow"
                      >
                        Commit Milestone
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="bg-brand-cream border border-dashed border-brand-gold/25 rounded-3xl p-8 text-center text-gray-500 text-xs font-light leading-relaxed">
                  Select a merchant order from the table to review customer details, ship addresses, and update fulfillment milestones.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: STORE ANALYTICS --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-brand-primary">Merchant Statistics</h3>
            <p className="text-xs text-gray-500 mt-1">Review live financial statistics and operational alerts for your artisan store.</p>
          </div>

          {/* Cards metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-brand-gold/15 p-6 shadow-sm flex items-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-green-500" />
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <DollarSign size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Payouts</span>
                <span className="font-serif text-3xl font-bold text-brand-primary mt-1 block">₹{totalSalesVal}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-brand-gold/15 p-6 shadow-sm flex items-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-brand-primary" />
              <div className="h-12 w-12 rounded-full bg-brand-cream flex items-center justify-center text-brand-primary">
                <ClipboardList size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Orders</span>
                <span className="font-serif text-3xl font-bold text-brand-primary mt-1 block">{orders.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-brand-gold/15 p-6 shadow-sm flex items-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-brand-gold" />
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-brand-gold">
                <Box size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Active Catalog</span>
                <span className="font-serif text-3xl font-bold text-brand-primary mt-1 block">{products.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Low inventory alerts */}
            <div className="bg-white rounded-3xl border border-brand-gold/15 p-6 shadow-sm">
              <h4 className="font-serif text-md font-semibold text-brand-primary border-b border-gray-100 pb-3 flex items-center gap-2">
                <AlertTriangle className="text-brand-gold shrink-0" size={18} /> Low Stock Alerts
              </h4>
              <div className="mt-4 space-y-4">
                {lowStockAlerts.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs font-light flex flex-col items-center gap-2">
                    <CheckCircle className="text-green-500" size={24} />
                    <span>All stock levels are perfectly healthy.</span>
                  </div>
                ) : (
                  lowStockAlerts.map(prod => (
                    <div key={prod._id} className="flex items-center justify-between gap-4 p-3 bg-brand-cream/30 border border-brand-gold/10 rounded-xl">
                      <div className="min-w-0">
                        <p className="font-serif font-semibold text-brand-primary text-xs line-clamp-1">{prod.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">SKU: {prod.sku || 'No SKU'}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-50 border border-red-200 rounded-full font-bold text-[9px] uppercase tracking-wide text-red-600">
                        {prod.stock} Left
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Seller checklist details */}
            <div className="bg-white rounded-3xl border border-brand-gold/15 p-6 shadow-sm">
              <h4 className="font-serif text-md font-semibold text-brand-primary border-b border-gray-100 pb-3 flex items-center gap-2">
                <ShieldCheck className="text-green-600 shrink-0" size={18} /> Marketplace Checklist
              </h4>
              <div className="mt-4 space-y-3.5 text-xs text-gray-700 font-light leading-relaxed">
                <p>🚀 <span className="font-semibold text-brand-primary">Ship Fast:</span> Fulfill orders within 24-48 hours to secure positive maharaja customer reviews.</p>
                <p>📦 <span className="font-semibold text-brand-primary">Size Precision:</span> Verify stock-per-size maps are kept fully updated to prevent out-of-stock cancel events.</p>
                <p>🎨 <span className="font-semibold text-brand-primary">Handblock Integrity:</span> Ensure accurate fabric materials are listed so returns remain at absolute minimums.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DRAWER SLIDE-OUT: PRODUCT EDITOR DIALOG --- */}
      {editorOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setEditorOpen(false)}>
          <div 
            className="w-full max-w-2xl h-full bg-[#FAF7F2] flex flex-col shadow-2xl animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-brand-gold/15 bg-white flex items-center justify-between shrink-0">
              <h2 className="font-serif text-xl font-bold text-brand-primary">{editingProduct ? 'Edit Store Apparel' : 'Add Store Apparel'}</h2>
              <button onClick={() => setEditorOpen(false)} className="p-2 hover:bg-brand-cream rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <form id="product-form" onSubmit={handleFormSubmit} className="space-y-8">
                
                {/* Section: Basic Info */}
                <div className="bg-white p-5 rounded-2xl border border-brand-gold/10 space-y-4 shadow-sm">
                  <h3 className="font-serif text-sm font-bold text-brand-primary border-b border-gray-100 pb-2">Basic Information</h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Product Title *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Sanganeri Indigo Handblock Kurta Set"
                      className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Short Card Description</label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                      placeholder="e.g. Handcrafted wooden block designs on pure organic Chanderi silk."
                      className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Full Story Description *</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Elaborate on the craftsmanship. Detail Sanganer village origin, dori ties, or silver zardozi hem lines..."
                      className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800 resize-y"
                      required
                    />
                  </div>
                </div>

                {/* Section: Organization */}
                <div className="bg-white p-5 rounded-2xl border border-brand-gold/10 space-y-4 shadow-sm">
                  <h3 className="font-serif text-sm font-bold text-brand-primary border-b border-gray-100 pb-2">Organization</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-brand-primary font-semibold"
                      >
                        {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Subcategory</label>
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                        placeholder="e.g. Palazzo Set, Anarkali Saree"
                        className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Brand</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Gender Selection</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                      >
                        {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Tags / Collection Badges (comma separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="e.g. Gota Patti, Bagru, Festive, Silk"
                      className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                    />
                  </div>
                </div>

                {/* Section: Pricing & Inventory */}
                <div className="bg-white p-5 rounded-2xl border border-brand-gold/10 space-y-4 shadow-sm">
                  <h3 className="font-serif text-sm font-bold text-brand-primary border-b border-gray-100 pb-2">Pricing & Inventory</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Original Retail Price (₹) *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="Original Price"
                        className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Marketplace Discounted Price (₹)</label>
                      <input
                        type="number"
                        value={formData.discountPrice}
                        onChange={(e) => setFormData({...formData, discountPrice: e.target.value})}
                        placeholder="Offer price"
                        className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Fulfillment Stock Per Size</label>
                    <div className="flex flex-wrap gap-2.5 mb-3">
                      {sizeOptions.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => addSizeToStock(sz)}
                          disabled={stockPerSize[sz] !== undefined}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                            stockPerSize[sz] !== undefined 
                              ? 'bg-gray-100 text-gray-400 border-transparent' 
                              : 'bg-white text-[#2B1D20] border-brand-gold/30 hover:border-brand-primary hover:bg-brand-cream'
                          }`}
                        >
                          + {sz}
                        </button>
                      ))}
                    </div>
                    
                    {Object.keys(stockPerSize).length > 0 && (
                      <div className="bg-[#FAF7F2] p-4 rounded-xl border border-brand-gold/10 space-y-3 shadow-inner">
                        {Object.keys(stockPerSize).map(size => (
                          <div key={size} className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-brand-primary w-12">{size}</span>
                            <input
                              type="number"
                              min="0"
                              value={stockPerSize[size]}
                              onChange={(e) => handleStockChange(size, e.target.value)}
                              className="w-24 bg-white border border-brand-gold/15 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-primary text-center"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newStock = {...stockPerSize};
                                delete newStock[size];
                                setStockPerSize(newStock);
                              }}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">SKU (Stock Keeping Reference)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      placeholder="e.g. AP-KURTA-001"
                      className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                    />
                  </div>
                </div>

                {/* Section: Media & Specifications */}
                <div className="bg-white p-5 rounded-2xl border border-brand-gold/10 space-y-4 shadow-sm">
                  <h3 className="font-serif text-sm font-bold text-brand-primary border-b border-gray-100 pb-2">Media & Specifications</h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">Couture Imagery (Multiple allowed)</label>
                    <div className="flex flex-wrap gap-3">
                      {formImages.map((img, idx) => (
                        <div key={idx} className="relative h-24 w-20 rounded-lg border border-brand-gold/10 overflow-hidden group shadow-sm">
                          <img src={img} className="h-full w-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                              className="bg-red-500 text-white p-1.5 rounded-full"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <label className="h-24 w-20 rounded-lg border border-dashed border-brand-gold/30 hover:border-brand-primary flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-brand-primary transition-all bg-gray-50 hover:bg-brand-cream">
                        {uploading ? <RefreshCcw size={20} className="animate-spin text-brand-primary" /> : <Plus size={20} className="text-brand-gold" />}
                        <span className="text-[9px] mt-1 font-bold uppercase tracking-wider">Upload</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUploads}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Craft Colors (comma separated)</label>
                    <input
                      type="text"
                      value={formColors}
                      onChange={(e) => setFormColors(e.target.value)}
                      placeholder="e.g. Royal Indigo, Sandstone Ivory"
                      className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Fabric Composition</label>
                    <input
                      type="text"
                      value={formData.fabricMaterial}
                      onChange={(e) => setFormData({...formData, fabricMaterial: e.target.value})}
                      placeholder="e.g. 100% Sanganeri Organic Cotton"
                      className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Care Instructions</label>
                    <input
                      type="text"
                      value={formData.careInstructions}
                      onChange={(e) => setFormData({...formData, careInstructions: e.target.value})}
                      placeholder="e.g. Dry clean only. Wash separately in cold water."
                      className="w-full bg-gray-50 border border-brand-gold/15 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-gray-800"
                    />
                  </div>
                </div>

                <div className="h-12" />
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-brand-gold/15 bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setEditorOpen(false)}
                className="px-6 py-3 border border-brand-gold/30 hover:border-brand-primary text-[#2B1D20]/60 hover:text-brand-primary text-xs font-bold uppercase tracking-widest rounded-full transition-colors"
              >
                Discard
              </button>
              <button 
                form="product-form"
                type="submit"
                disabled={uploading}
                className="px-8 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-md flex items-center gap-2 transition-colors disabled:bg-gray-300 disabled:text-gray-400"
              >
                <Save size={14} />
                {editingProduct ? 'Save Changes' : 'Create Apparel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
