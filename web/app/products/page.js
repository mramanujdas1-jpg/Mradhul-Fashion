'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '../../components/ProductCard';
import { Filter, SlidersHorizontal, RefreshCcw, X } from 'lucide-react';

import { API_BASE } from '../config';

const fallbackProducts = [
  {
    _id: 'p1',
    name: 'Royale Jaipur Gota Patti Saree',
    description: 'A breathtaking royal georgette saree, hand-embellished by Jaipur heritage artisans. Features detailed gota-patti embroidery borders, traditional hand-block floral motifs, and delicate hand-stitched gold sequins.',
    price: 18999,
    discountPrice: 14999,
    category: 'Handcrafted Sarees',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    sizes: ['Free Size'],
    stock: 12,
    rating: 4.9,
    numReviews: 24,
    isTrending: true,
    isFlashSale: false
  },
  {
    _id: 'p2',
    name: 'Heritage Leheriya Silk Anarkali',
    description: 'This royal tie-dye Leheriya Anarkali suit set is crafted from pure hand-loomed Banarasi silk. Embellished with fine mirror embroidery and gold zardozi work along the neck and flare.',
    price: 14499,
    discountPrice: 11999,
    category: 'Royal Anarkalis',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 15,
    rating: 4.8,
    numReviews: 16,
    isTrending: true,
    isFlashSale: false
  },
  {
    _id: 'p3',
    name: 'Shahi Zardozi Bridal Lehenga',
    description: 'A masterpiece of royal bridal couture. Tailored in pure mulberry raw silk with heavy zardozi, hand-woven gold dori, and real semi-precious bead embellishments. The flare is detailed with traditional palace arch motifs.',
    price: 49999,
    discountPrice: 42999,
    category: 'Bridal & Festive',
    images: ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=800'],
    sizes: ['S', 'M', 'L'],
    stock: 5,
    rating: 5.0,
    numReviews: 10,
    isTrending: true,
    isFlashSale: false
  },
  {
    _id: 'p4',
    name: 'Sanganeri Print Peplum & Palazzo Set',
    description: 'A contemporary fusion coordinate set featuring a Sanganeri block printed peplum top with hand-embellished dabka outlines, paired with lightweight floating georgette palazzo pants.',
    price: 8999,
    discountPrice: 6999,
    category: 'Jaipur Fusion Wear',
    images: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 18,
    rating: 4.5,
    numReviews: 14,
    isTrending: false,
    isFlashSale: true
  },
  {
    _id: 'p5',
    name: 'Shekhawati Hand-Embroidered Velvet Jacket',
    description: 'A luxurious velvet jacket intricately detailed with traditional Shekhawati hand-embroidery. Embellished with fine dabka threadwork, mirror details, and brass buttons.',
    price: 12999,
    discountPrice: 9999,
    category: 'Artisan Jackets & Dupattas',
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 8,
    rating: 4.9,
    numReviews: 9,
    isTrending: true,
    isFlashSale: false
  }
];

const categoriesList = [
  'Handcrafted Sarees',
  'Designer Lehengas',
  'Royal Anarkalis',
  'Jaipur Fusion Wear',
  'Bridal & Festive',
  'Artisan Jackets & Dupattas'
];

function ProductsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search Param States
  const keyword = searchParams.get('keyword') || '';
  const categoryParam = searchParams.get('category') || '';
  const trendingParam = searchParams.get('trending') || '';
  const flashSaleParam = searchParams.get('flashSale') || '';

  // Filter States
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Load API
  const fetchProducts = async () => {
    setLoading(true);
    let query = `?keyword=${encodeURIComponent(keyword)}&page=1&pageSize=40`;
    if (selectedCategory) query += `&category=${encodeURIComponent(selectedCategory)}`;
    if (trendingParam) query += `&trending=true`;
    if (flashSaleParam) query += `&flashSale=true`;
    if (minPrice) query += `&minPrice=${minPrice}`;
    if (maxPrice) query += `&maxPrice=${maxPrice}`;
    if (selectedRating) query += `&rating=${selectedRating}`;

    try {
      const res = await fetch(`${API_BASE}/products${query}`);
      if (res.ok) {
        const data = await res.json();
        let loadedProducts = data.products || [];

        // Apply sorting on client side for precision
        if (sortOption === 'price-low') {
          loadedProducts.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        } else if (sortOption === 'price-high') {
          loadedProducts.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        } else if (sortOption === 'rating') {
          loadedProducts.sort((a, b) => b.rating - a.rating);
        }

        setProducts(loadedProducts);
      }
    } catch (err) {
      console.warn('API connection failed. Running offline client filters.');
      // Offline fallback sorting/filters
      let filtered = fallbackProducts.filter(p => {
        if (selectedCategory && p.category !== selectedCategory) return false;
        if (keyword && !p.name.toLowerCase().includes(keyword.toLowerCase())) return false;
        if (trendingParam && !p.isTrending) return false;
        if (flashSaleParam && !p.isFlashSale) return false;
        
        const finalPrice = p.discountPrice || p.price;
        if (minPrice && finalPrice < Number(minPrice)) return false;
        if (maxPrice && finalPrice > Number(maxPrice)) return false;
        if (selectedRating && p.rating < Number(selectedRating)) return false;
        return true;
      });

      if (sortOption === 'price-low') {
        filtered.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
      } else if (sortOption === 'price-high') {
        filtered.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
      } else if (sortOption === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      }
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [keyword, selectedCategory, trendingParam, flashSaleParam, minPrice, maxPrice, selectedRating, sortOption]);

  const clearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedRating('');
    setSortOption('newest');
    router.push('/products');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 flex flex-col gap-6 font-sans">
      {/* Title / Head */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-wider">
            {trendingParam ? 'Trending Collections' : flashSaleParam ? 'Flash Clearance' : 'Boutique Apparel'}
          </h1>
          {keyword && (
            <p className="text-xs text-gray-500 font-light mt-1">Showing search results for "{keyword}" ({products.length} items)</p>
          )}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="md:hidden flex items-center gap-1.5 border border-brand-primary/20 dark:border-white/10 px-4 py-2 rounded-xl text-sm font-semibold text-brand-primary"
          >
            <Filter size={16} /> Filters
          </button>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none text-gray-700 dark:text-gray-200"
          >
            <option value="newest">Sort By: Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Workspace content grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left filter sidebars - Desktop only */}
        <aside className="hidden md:flex flex-col gap-6 border-r border-black/5 dark:border-white/5 pr-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-brand-gold" /> Filter Settings
            </h3>
            <button onClick={clearFilters} className="text-xs font-bold text-brand-primary hover:underline">
              Clear All
            </button>
          </div>

          {/* Categories select list */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Categories</span>
            <div className="flex flex-col gap-1.5 mt-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`text-left text-sm py-1 px-2.5 rounded-lg transition-colors ${
                  !selectedCategory ? 'bg-brand-primary/15 text-brand-primary font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                All Categories
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left text-sm py-1 px-2.5 rounded-lg transition-colors ${
                    selectedCategory === cat ? 'bg-brand-primary/15 text-brand-primary font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Prices filter ranges */}
          <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Price Range (₹)</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg py-1 px-2 text-xs focus:outline-none focus:border-brand-primary"
              />
              <span className="text-xs text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg py-1 px-2 text-xs focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Ratings filter levels */}
          <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Minimum Rating</span>
            <div className="flex flex-col gap-1.5 mt-1">
              {[4, 3, 2].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedRating(num)}
                  className={`text-left text-sm py-1 px-2.5 rounded-lg transition-colors ${
                    Number(selectedRating) === num ? 'bg-brand-primary/15 text-brand-primary font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {num}★ & above
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right product listing grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <RefreshCcw className="animate-spin text-brand-primary" size={32} />
              <p className="text-sm font-light text-gray-400">Paging products catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <span className="text-brand-gold text-4xl">☹</span>
              <h3 className="font-serif font-semibold text-xl mt-4">No Products Found</h3>
              <p className="text-sm text-gray-500 font-light mt-1">Try resetting filters or adjusting search keyword terms.</p>
              <button
                onClick={clearFilters}
                className="mt-6 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase px-6 py-2.5 rounded-full inline-block"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Slide - Filters */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setFilterDrawerOpen(false)}>
          <div className="w-80 h-full bg-white dark:bg-brand-charcoal p-6 flex flex-col gap-6 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
              <h3 className="font-serif font-bold text-lg">Filter Preferences</h3>
              <button onClick={() => setFilterDrawerOpen(false)} aria-label="Close Filter Menu">
                <X size={20} />
              </button>
            </div>

            {/* Content parameters */}
            <div className="flex-grow overflow-y-auto flex flex-col gap-6">
              {/* Category selections */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase text-gray-400">Categories</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <button
                    onClick={() => { setSelectedCategory(''); setFilterDrawerOpen(false); }}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      !selectedCategory ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 dark:border-white/10'
                    }`}
                  >
                    All Apparels
                  </button>
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setFilterDrawerOpen(false); }}
                      className={`text-xs px-3 py-1.5 rounded-full border ${
                        selectedCategory === cat ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 dark:border-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price parameters */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase text-gray-400">Price Thresholds</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Star reviews */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase text-gray-400">Ratings</span>
                <div className="flex flex-col gap-2">
                  {[4, 3, 2].map((num) => (
                    <button
                      key={num}
                      onClick={() => { setSelectedRating(num); setFilterDrawerOpen(false); }}
                      className={`text-left text-sm py-1.5 px-3 rounded-lg border ${
                        Number(selectedRating) === num ? 'bg-brand-primary/10 text-brand-primary font-semibold border-brand-primary/20' : 'border-transparent'
                      }`}
                    >
                      {num}★ & above
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear and Apply bar */}
            <div className="flex items-center gap-4 mt-auto border-t border-black/5 dark:border-white/5 pt-4">
              <button onClick={() => { clearFilters(); setFilterDrawerOpen(false); }} className="w-full text-center text-sm py-2 bg-gray-100 dark:bg-white/5 rounded-lg">
                Reset
              </button>
              <button onClick={() => setFilterDrawerOpen(false)} className="w-full text-center text-sm py-2 bg-brand-primary text-white rounded-lg">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsList() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <RefreshCcw className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm font-light text-gray-400 font-sans">Loading products list component...</p>
      </div>
    }>
      <ProductsListContent />
    </Suspense>
  );
}
