'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context';
import { RefreshCcw, Plus, Edit3, Trash2, ArrowLeft, X } from 'lucide-react';

import { API_BASE } from '../../config';

const categoriesList = [
  'Handcrafted Sarees',
  'Designer Lehengas',
  'Royal Anarkalis',
  'Jaipur Fusion Wear',
  'Bridal & Festive',
  'Artisan Jackets & Dupattas'
];

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
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Handcrafted Sarees');
  const [formStock, setFormStock] = useState('');
  const [formSizes, setFormSizes] = useState(['S', 'M', 'L', 'XL']);
  const [formImages, setFormImages] = useState(['/logo.png']);
  const [formTrending, setFormTrending] = useState(false);
  const [formFlashSale, setFormFlashSale] = useState(false);
  const [formBrand, setFormBrand] = useState('Mradhul Jaipur');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formColors, setFormColors] = useState('');
  const [formFabric, setFormFabric] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDelivery, setFormDelivery] = useState('');
  const [formReturn, setFormReturn] = useState('');

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
      setErrorMsg('Unable to load the live catalog. Check API availability and admin authentication.');
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
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setFormDiscountPrice('');
    setFormCategory('Handcrafted Sarees');
    setFormStock('');
    setFormSizes(['S', 'M', 'L', 'XL']);
    setFormImages(['/logo.png']);
    setFormTrending(false);
    setFormFlashSale(false);
    setFormBrand('Mradhul Jaipur');
    setFormSubcategory('');
    setFormColors('');
    setFormFabric('');
    setFormSku('');
    setFormDelivery('');
    setFormReturn('');
    setEditorOpen(true);
  };

  const handleOpenEditEditor = (prod) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormDesc(prod.description || '');
    setFormPrice(prod.price);
    setFormDiscountPrice(prod.discountPrice || '');
    setFormCategory(prod.category);
    setFormStock(prod.stock);
    setFormSizes(prod.sizes || ['S', 'M', 'L', 'XL']);
    setFormImages(prod.images || ['/logo.png']);
    setFormTrending(prod.isTrending || false);
    setFormFlashSale(prod.isFlashSale || false);
    setFormBrand(prod.brand || 'Mradhul Jaipur');
    setFormSubcategory(prod.subcategory || '');
    setFormColors((prod.colors || []).join(', '));
    setFormFabric(prod.fabricMaterial || '');
    setFormSku(prod.sku || '');
    setFormDelivery(prod.deliveryInfo || '');
    setFormReturn(prod.returnPolicy || '');
    setEditorOpen(true);
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
          const data = await res.json();
          throw new Error(data.message || 'Image upload failed');
        }
      }

      setFormImages(prev => {
        const base = prev.filter(img => img !== '/logo.png');
        return [...base, ...uploadedUrls];
      });
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload one or more images.');
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice || !formStock) {
      setErrorMsg('Please fill in required fields (Name, Price, Stock).');
      return;
    }
    setErrorMsg('');

    const token = localStorage.getItem('mf_auth_token');
    if (!token) {
      setErrorMsg('Authentication token missing. Please log out and log back in.');
      return;
    }

    const payload = {
      name: formName,
      description: formDesc,
      price: Number(formPrice),
      discountPrice: formDiscountPrice ? Number(formDiscountPrice) : 0,
      category: formCategory,
      stock: Number(formStock),
      sizes: formSizes,
      images: formImages,
      isTrending: formTrending,
      isFlashSale: formFlashSale,
      brand: formBrand,
      subcategory: formSubcategory,
      colors: formColors ? formColors.split(',').map(c => c.trim()) : [],
      fabricMaterial: formFabric,
      sku: formSku || undefined,
      deliveryInfo: formDelivery,
      returnPolicy: formReturn
    };

    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `${API_BASE}/products/${editingProduct._id}` : `${API_BASE}/products`;

    console.log(`[Admin] ${method} ${url}`, { tokenPresent: !!token, payload: payload.name });

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
        console.log(`[Admin] Product ${method === 'POST' ? 'created' : 'updated'} successfully`);
        setEditorOpen(false);
        fetchCatalog();
      } else {
        const data = await res.json();
        console.error(`[Admin] Product ${method} failed:`, res.status, data);
        setErrorMsg(data.message || `Operation failed (${res.status}). ${res.status === 401 ? 'Your session may have expired — please log out and log back in.' : res.status === 403 ? 'You do not have admin permissions.' : 'Please try again.'}`);
      }
    } catch (err) {
      console.error('[Admin] Product save network error:', err);
      setErrorMsg('Network error: Unable to reach the server. Check your internet connection and try again.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to remove this garment from catalog?')) return;
    const token = localStorage.getItem('mf_auth_token');
    console.log(`[Admin] DELETE ${API_BASE}/products/${id}`, { tokenPresent: !!token });
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        console.log('[Admin] Product deleted successfully');
        fetchCatalog();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('[Admin] Product delete failed:', res.status, data);
        setErrorMsg(data.message || `Delete failed (${res.status}). ${res.status === 401 ? 'Session expired — please re-login.' : res.status === 403 ? 'Admin access required.' : 'Please try again.'}`);
      }
    } catch (err) {
      console.error('[Admin] Product delete network error:', err);
      setErrorMsg('Network error: Unable to reach the server. Check your internet connection.');
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
            <h1 className="font-serif text-3xl font-bold">Catalog Management</h1>
            <p className="text-xs text-gray-500 font-light mt-0.5">CRUD interfaces to publish, edit or remove boutique clothing items.</p>
          </div>
        </div>

        <button
          onClick={handleOpenNewEditor}
          className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm"
        >
          <Plus size={16} /> New Product
        </button>
      </div>

      {/* Catalog listing */}
      {authLoading || loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-12">
          <RefreshCcw className="animate-spin text-brand-primary" size={20} /> Querying database catalog...
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-brand-primary/10 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Garment Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock Levels</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod._id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-semibold">{prod.name}</td>
                  <td className="py-3.5 px-4 text-brand-gold font-medium">{prod.category}</td>
                  <td className="py-3.5 px-4">{prod.stock} items</td>
                  <td className="py-3.5 px-4">
                    {prod.discountPrice ? (
                      <span className="font-bold text-brand-primary">₹{prod.discountPrice} <span className="text-gray-400 line-through text-[10px]">₹{prod.price}</span></span>
                    ) : (
                      <span className="font-bold">₹{prod.price}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleOpenEditEditor(prod)}
                      className="p-1.5 hover:text-brand-primary hover:bg-brand-primary/5 rounded transition-all"
                      aria-label="Edit Product"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod._id)}
                      className="p-1.5 hover:text-brand-primary hover:bg-brand-primary/5 rounded transition-all text-gray-400"
                      aria-label="Remove Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor drawer overlay */}
      {editorOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setEditorOpen(false)}>
          <div className="w-96 h-full bg-white dark:bg-brand-charcoal p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
              <h3 className="font-serif font-bold text-lg">{editingProduct ? 'Edit Garment File' : 'Publish New Apparel'}</h3>
              <button onClick={() => setEditorOpen(false)} aria-label="Close form">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 text-xs">
              {errorMsg && (
                <p className="text-xs text-brand-primary font-semibold bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/15">
                  {errorMsg}
                </p>
              )}

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase font-bold">Garment Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Royale Silk Lehenga"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                  required
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase font-bold">Category Group</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                >
                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase font-bold">Description Details</label>
                <textarea
                  rows={3}
                  placeholder="Provide fabric thread count, weave style, embroidery type..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-3 rounded-xl focus:outline-none resize-none"
                />
              </div>

              {/* Product Images Uploader */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase font-bold">Product Images</label>
                <div className="flex flex-col gap-2 p-3 border border-black/10 dark:border-white/10 rounded-xl bg-transparent">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUploads}
                    className="hidden"
                    id="admin-product-images-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="admin-product-images-upload"
                    className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-center py-2.5 rounded-xl cursor-pointer hover:bg-brand-primary/15 transition-all text-[11px] font-bold uppercase tracking-wider block"
                  >
                    {uploading ? 'Uploading to Cloudinary...' : 'Upload Image Files'}
                  </label>
                  
                  {formImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative h-12 w-12 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden bg-gray-50 flex-shrink-0 group">
                          <img src={imgUrl} className="h-full w-full object-cover" alt="Apparel thumbnail" />
                          <button
                            type="button"
                            onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-brand-primary text-white rounded-bl-lg p-1 opacity-90 hover:opacity-100 transition-opacity"
                            aria-label="Remove Image"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase font-bold">Original Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase font-bold">Discount Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 3500"
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase font-bold">Inventory Quantity *</label>
                <input
                  type="number"
                  placeholder="Available units in warehouse"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                  required
                />
              </div>

              {/* Brand & Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase font-bold">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mradhul Jaipur"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase font-bold">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Gota Patti"
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Colors & Fabric */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase font-bold">Colors (Hex / Names)</label>
                  <input
                    type="text"
                    placeholder="e.g. #E01A4F, #D4AF37"
                    value={formColors}
                    onChange={(e) => setFormColors(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 uppercase font-bold">Fabric Material</label>
                  <input
                    type="text"
                    placeholder="e.g. Pure Georgette"
                    value={formFabric}
                    onChange={(e) => setFormFabric(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* SKU Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase font-bold">SKU Code</label>
                <input
                  type="text"
                  placeholder="e.g. MF-SAREE-GP-001"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                />
              </div>

              {/* Delivery & Return Info */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase font-bold">Delivery Info</label>
                <input
                  type="text"
                  placeholder="e.g. Ships within 24-48 hours."
                  value={formDelivery}
                  onChange={(e) => setFormDelivery(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 uppercase font-bold">Return Policy</label>
                <input
                  type="text"
                  placeholder="e.g. 7-day hassle-free returns."
                  value={formReturn}
                  onChange={(e) => setFormReturn(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-2.5 rounded-xl focus:outline-none"
                />
              </div>

              {/* Tags checkboxes */}
              <div className="flex items-center gap-6 mt-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formTrending}
                    onChange={(e) => setFormTrending(e.target.checked)}
                    className="accent-brand-primary h-4 w-4"
                  />
                  <span>Trending Label</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={formFlashSale}
                    onChange={(e) => setFormFlashSale(e.target.checked)}
                    className="accent-brand-primary h-4 w-4"
                  />
                  <span>Flash Sale Label</span>
                </label>
              </div>

              {/* Action submits */}
              <div className="flex items-center gap-4 mt-4 border-t border-black/5 dark:border-white/5 pt-4">
                <button type="button" onClick={() => setEditorOpen(false)} className="w-full text-center py-3 bg-gray-100 dark:bg-white/5 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="w-full text-center py-3 bg-brand-primary text-white rounded-xl font-bold uppercase tracking-wider shadow-md">
                  {editingProduct ? 'Save Changes' : 'Publish Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
