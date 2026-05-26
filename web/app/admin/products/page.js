'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context';
import { RefreshCcw, Plus, Edit3, Trash2, ArrowLeft, X, Image as ImageIcon, Save, Tag } from 'lucide-react';

import { API_BASE } from '../../config';

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

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useApp();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  // Editor form parameters
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

  const [formImages, setFormImages] = useState([]);
  const [formColors, setFormColors] = useState('');
  
  // Stock per size: { 'S': 10, 'M': 5 }
  const [stockPerSize, setStockPerSize] = useState({});

  const fetchCatalog = async () => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/profile');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products?pageSize=100`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      setErrorMsg('Unable to load the live catalog.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchCatalog();
    }
  }, [user, authLoading]);

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
    setStockPerSize({ 'S': 0, 'M': 0, 'L': 0 });
    setEditorOpen(true);
  };

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

  const handleStockChange = (size, qty) => {
    setStockPerSize(prev => ({
      ...prev,
      [size]: parseInt(qty) || 0
    }));
  };

  const addSizeToStock = (size) => {
    if (!stockPerSize[size]) {
      setStockPerSize(prev => ({ ...prev, [size]: 0 }));
    }
  };

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
      setErrorMsg(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      setErrorMsg('Please fill in required fields (Name, Price).');
      return;
    }
    setErrorMsg('');

    const token = localStorage.getItem('mf_auth_token');
    
    // Calculate total stock from stockPerSize
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
      sizes: activeSizes.length > 0 ? activeSizes : ['Free Size'] // Default fallback
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
        fetchCatalog();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Operation failed');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    const token = localStorage.getItem('mf_auth_token');
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCatalog();
      }
    } catch (err) {
      setErrorMsg('Network error.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your catalog, inventory, and variants.</p>
        </div>
        <button
          onClick={handleOpenNewEditor}
          className="bg-brand-primary hover:bg-brand-primaryDark text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Product List */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden shadow-sm">
        {loading || authLoading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
            <RefreshCcw className="animate-spin mb-3" size={24} />
            <p>Loading catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-gray-100 dark:bg-[#2A2A2A] rounded-full flex items-center justify-center text-gray-400 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="font-serif text-xl font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-500 mb-6 max-w-sm">Your catalog is currently empty. Start adding premium apparel to your store.</p>
            <button
              onClick={handleOpenNewEditor}
              className="bg-brand-primary text-white px-5 py-2 rounded-lg font-medium"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-[#333]">
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Inventory</th>
                  <th className="py-3 px-4 font-medium">Price</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-gray-50 dark:hover:bg-[#2A2A2A]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-10 rounded bg-gray-100 dark:bg-[#333] overflow-hidden shrink-0 border border-gray-200 dark:border-[#444]">
                          {prod.images && prod.images[0] ? (
                            <img src={prod.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-full w-full p-2 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{prod.name}</p>
                          <p className="text-xs text-gray-500">{prod.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300 rounded-md text-xs">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`${prod.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'} font-medium`}>
                        {prod.stock} in stock
                      </span>
                      {Object.keys(prod.stockPerSize || {}).length > 0 && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {Object.entries(prod.stockPerSize || {})
                            .filter(([_, qty]) => qty > 0)
                            .map(([s, q]) => `${s}:${q}`).join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {prod.discountPrice ? (
                        <div>
                          <span className="font-medium">₹{prod.discountPrice}</span>
                          <span className="text-xs text-gray-400 line-through ml-1.5">₹{prod.price}</span>
                        </div>
                      ) : (
                        <span className="font-medium">₹{prod.price}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditEditor(prod)}
                          className="p-1.5 text-gray-500 hover:text-brand-primary bg-white dark:bg-[#1E1E1E] hover:bg-gray-100 dark:hover:bg-[#333] rounded shadow-sm border border-gray-200 dark:border-[#333]"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod._id)}
                          className="p-1.5 text-red-500 hover:text-red-600 bg-white dark:bg-[#1E1E1E] hover:bg-red-50 dark:hover:bg-red-900/20 rounded shadow-sm border border-gray-200 dark:border-[#333]"
                        >
                          <Trash2 size={16} />
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

      {/* Editor Slide-out */}
      {editorOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setEditorOpen(false)}>
          <div 
            className="w-full max-w-2xl h-full bg-gray-50 dark:bg-[#121212] flex flex-col shadow-2xl animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-[#333] bg-white dark:bg-[#1E1E1E] flex items-center justify-between shrink-0">
              <h2 className="font-serif text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setEditorOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-600 text-sm">
                  {errorMsg}
                </div>
              )}

              <form id="product-form" onSubmit={handleFormSubmit} className="space-y-8">
                
                {/* Section: Basic Info */}
                <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-xl border border-gray-200 dark:border-[#333] space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#333] pb-2">Basic Information</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Product Title *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Short Description (for cards)</label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Full Description *</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary resize-y"
                      required
                    />
                  </div>
                </div>

                {/* Section: Organization */}
                <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-xl border border-gray-200 dark:border-[#333] space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#333] pb-2">Organization</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                      >
                        {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Subcategory</label>
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Brand</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                      >
                        {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="e.g. Wedding, Summer, Block Print"
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Section: Pricing & Inventory */}
                <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-xl border border-gray-200 dark:border-[#333] space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#333] pb-2">Pricing & Inventory</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Original Price (₹) *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Sale Price (₹)</label>
                      <input
                        type="number"
                        value={formData.discountPrice}
                        onChange={(e) => setFormData({...formData, discountPrice: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Stock Per Size</label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {sizeOptions.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => addSizeToStock(sz)}
                          disabled={stockPerSize[sz] !== undefined}
                          className={`px-3 py-1 text-xs rounded border ${
                            stockPerSize[sz] !== undefined 
                              ? 'bg-gray-100 text-gray-400 border-transparent dark:bg-[#333] dark:text-gray-500' 
                              : 'bg-white text-gray-700 border-gray-300 hover:border-brand-primary dark:bg-[#121212] dark:border-[#444] dark:text-gray-300'
                          }`}
                        >
                          + {sz}
                        </button>
                      ))}
                    </div>
                    
                    {Object.keys(stockPerSize).length > 0 && (
                      <div className="bg-gray-50 dark:bg-[#121212] p-3 rounded-lg border border-gray-200 dark:border-[#333] space-y-2">
                        {Object.keys(stockPerSize).map(size => (
                          <div key={size} className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium w-16">{size}</span>
                            <input
                              type="number"
                              min="0"
                              value={stockPerSize[size]}
                              onChange={(e) => handleStockChange(size, e.target.value)}
                              className="w-24 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#444] rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-primary"
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
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Section: Media & Variants */}
                <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-xl border border-gray-200 dark:border-[#333] space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#333] pb-2">Media & Variants</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Product Images</label>
                    <div className="flex flex-wrap gap-3">
                      {formImages.map((img, idx) => (
                        <div key={idx} className="relative h-24 w-20 rounded-lg border border-gray-200 dark:border-[#333] overflow-hidden group">
                          <img src={img} className="h-full w-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                              className="bg-red-500 text-white p-1.5 rounded-full"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <label className="h-24 w-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-[#444] hover:border-brand-primary dark:hover:border-brand-primary flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-brand-primary transition-colors bg-gray-50 dark:bg-[#121212]">
                        {uploading ? <RefreshCcw size={20} className="animate-spin" /> : <Plus size={20} />}
                        <span className="text-[10px] mt-1 font-medium uppercase">Upload</span>
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
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Available Colors (comma separated)</label>
                    <input
                      type="text"
                      value={formColors}
                      onChange={(e) => setFormColors(e.target.value)}
                      placeholder="e.g. Crimson Red, Navy Blue"
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Fabric/Material</label>
                    <input
                      type="text"
                      value={formData.fabricMaterial}
                      onChange={(e) => setFormData({...formData, fabricMaterial: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Care Instructions</label>
                    <input
                      type="text"
                      value={formData.careInstructions}
                      onChange={(e) => setFormData({...formData, careInstructions: e.target.value})}
                      placeholder="e.g. Dry clean only"
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Section: Merchandising */}
                <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-xl border border-gray-200 dark:border-[#333] space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#333] pb-2">Merchandising</h3>
                  
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#333] rounded-lg cursor-pointer bg-gray-50 dark:bg-[#121212]">
                      <input
                        type="checkbox"
                        checked={formData.isTrending}
                        onChange={(e) => setFormData({...formData, isTrending: e.target.checked})}
                        className="accent-brand-primary h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium">Mark as Trending</p>
                        <p className="text-xs text-gray-500">Product will appear in "Editor's Picks & Trending" section.</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#333] rounded-lg cursor-pointer bg-gray-50 dark:bg-[#121212]">
                      <input
                        type="checkbox"
                        checked={formData.isFlashSale}
                        onChange={(e) => setFormData({...formData, isFlashSale: e.target.checked})}
                        className="accent-brand-primary h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium">Flash Sale</p>
                        <p className="text-xs text-gray-500">Product will appear in "Artisan Flash Sale" section.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Bottom Padding */}
                <div className="h-12"></div>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-[#333] bg-white dark:bg-[#1E1E1E] flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setEditorOpen(false)}
                className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#333] rounded-lg transition-colors"
              >
                Discard
              </button>
              <button 
                form="product-form"
                type="submit"
                className="px-6 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
              >
                <Save size={16} />
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
