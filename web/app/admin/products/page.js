'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context';
import { RefreshCcw, Plus, Edit3, Trash2, ArrowLeft, X } from 'lucide-react';

import { API_BASE } from '../../config';

const fallbackProducts = [
  { _id: 'p1', name: 'Royale Banarasi Silk Saree', price: 4999, discountPrice: 2999, category: 'Ethnic Wear', stock: 25, rating: 4.8 },
  { _id: 'p2', name: 'Designer Anarkali Suit Set', price: 3499, discountPrice: 1999, category: 'Ethnic Wear', stock: 15, rating: 4.5 }
];

const categoriesList = ['Men', 'Women', 'Ethnic Wear', 'Western Wear', 'Kids Wear'];

export default function AdminProductsPage() {
  const router = useRouter();
  const { user } = useApp();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Editor form parameters
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Ethnic Wear');
  const [formStock, setFormStock] = useState('');
  const [formSizes, setFormSizes] = useState(['S', 'M', 'L', 'XL']);
  const [formImages, setFormImages] = useState(['/logo.png']);
  const [formTrending, setFormTrending] = useState(false);
  const [formFlashSale, setFormFlashSale] = useState(false);

  const fetchCatalog = async () => {
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
      console.warn('API connection failed. Using fallback catalog list.');
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [user]);

  const handleOpenNewEditor = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setFormDiscountPrice('');
    setFormCategory('Ethnic Wear');
    setFormStock('');
    setFormSizes(['S', 'M', 'L', 'XL']);
    setFormImages(['/logo.png']);
    setFormTrending(false);
    setFormFlashSale(false);
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
    setEditorOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice || !formStock) {
      setErrorMsg('Please fill in required fields (Name, Price, Stock).');
      return;
    }
    setErrorMsg('');

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
      isFlashSale: formFlashSale
    };

    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `${API_BASE}/products/${editingProduct._id}` : `${API_BASE}/products`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditorOpen(false);
        fetchCatalog();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Operation failed.');
      }
    } catch (err) {
      console.warn('Running offline mock CRUD update.');
      if (editingProduct) {
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? { ...p, ...payload } : p));
      } else {
        setProducts(prev => [...prev, { _id: `p_mock_${Date.now()}`, ...payload }]);
      }
      setEditorOpen(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to remove this garment from catalog?')) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchCatalog();
      }
    } catch (err) {
      console.warn('Running offline mock CRUD deletion.');
      setProducts(prev => prev.filter(p => p._id !== id));
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
      {loading ? (
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
