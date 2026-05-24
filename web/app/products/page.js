'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '../../components/ProductCard';
import Skeleton from '../../components/Skeleton';
import { Filter, SlidersHorizontal, RefreshCcw, X } from 'lucide-react';

import { API_BASE } from '../config';

const categoriesList = [
  'Handcrafted Sarees',
  'Designer Lehengas',
  'Royal Anarkalis',
  'Jaipur Fusion Wear',
  'Bridal & Festive',
  'Artisan Jackets & Dupattas'
];

const subcategoriesList = [
  'Gota Patti Sarees',
  'Banarasi Silk',
  'Bridal Lehenga',
  'Silk Anarkali',
  'Palazzo Sets',
  'Dupattas'
];

const brandsList = [
  'Mradhul Jaipur',
  'Heritage Jaipur'
];

const sizesList = [
  'Free Size',
  'S',
  'M',
  'L',
  'XL'
];

const colorsList = [
  { name: 'Crimson Red', value: '#E01A4F' },
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Burgundy', value: '#800020' },
  { name: 'Dark Green', value: '#006400' },
  { name: 'Indigo', value: '#4B0082' },
  { name: 'Off-White', value: '#E6D7C3' },
  { name: 'Steel Blue', value: '#4682B4' },
  { name: 'Mustard Orange', value: '#FFA500' },
  { name: 'Maroon', value: '#701122' }
];

const fabricsList = [
  'Silk',
  'Georgette',
  'Cotton',
  'Velvet',
  'Organza'
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
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedFabrics, setSelectedFabrics] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Helper toggle
  const toggleArrayFilter = (arr, setArr, val) => {
    if (arr.includes(val)) {
      setArr(arr.filter(item => item !== val));
    } else {
      setArr([...arr, val]);
    }
  };

  // Load API
  const fetchProducts = async () => {
    setLoading(true);
    let query = `?keyword=${encodeURIComponent(keyword)}&page=1&pageSize=45`;
    if (selectedCategory) query += `&category=${encodeURIComponent(selectedCategory)}`;
    if (trendingParam) query += `&trending=true`;
    if (flashSaleParam) query += `&flashSale=true`;
    if (minPrice) query += `&minPrice=${minPrice}`;
    if (maxPrice) query += `&maxPrice=${maxPrice}`;
    if (selectedRating) query += `&rating=${selectedRating}`;

    if (selectedSubcategories.length) query += `&subcategory=${selectedSubcategories.map(encodeURIComponent).join(',')}`;
    if (selectedBrands.length) query += `&brand=${selectedBrands.map(encodeURIComponent).join(',')}`;
    if (selectedSizes.length) query += `&sizes=${selectedSizes.map(encodeURIComponent).join(',')}`;
    if (selectedColors.length) query += `&colors=${selectedColors.map(encodeURIComponent).join(',')}`;
    if (selectedFabrics.length) query += `&fabric=${selectedFabrics.map(encodeURIComponent).join(',')}`;
    if (sortOption) query += `&sort=${sortOption}`;

    try {
      setLoadError('');
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
        } else if (sortOption === 'best-sellers') {
          loadedProducts.sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0));
        } else if (sortOption === 'newest') {
          loadedProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        setProducts(loadedProducts);
      }
    } catch (err) {
      setProducts([]);
      setLoadError('Unable to load live products. Please refresh or try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [keyword, selectedCategory, selectedSubcategories, selectedBrands, selectedSizes, selectedColors, selectedFabrics, trendingParam, flashSaleParam, minPrice, maxPrice, selectedRating, sortOption]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategories([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedFabrics([]);
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
            <option value="newest">Sort By: New Arrivals</option>
            <option value="best-sellers">Sort By: Best Sellers</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Workspace content grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left filter sidebars - Desktop only */}
        <aside className="hidden md:flex flex-col gap-6 border-r border-black/5 dark:border-white/5 pr-6 max-h-[1200px] overflow-y-auto">
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
            <div className="flex flex-col gap-1 mt-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors ${
                  !selectedCategory ? 'bg-brand-primary/15 text-brand-primary font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                All Categories
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors ${
                    selectedCategory === cat ? 'bg-brand-primary/15 text-brand-primary font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategories (Multi-select) */}
          <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Subcategory</span>
            <div className="flex flex-col gap-1 mt-1">
              {subcategoriesList.map((subcat) => {
                const isSelected = selectedSubcategories.includes(subcat);
                return (
                  <label key={subcat} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleArrayFilter(selectedSubcategories, setSelectedSubcategories, subcat)}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span>{subcat}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Brands (Multi-select) */}
          <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Brand</span>
            <div className="flex flex-col gap-1 mt-1">
              {brandsList.map((brand) => {
                const isSelected = selectedBrands.includes(brand);
                return (
                  <label key={brand} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleArrayFilter(selectedBrands, setSelectedBrands, brand)}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span>{brand}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Fabrics (Multi-select) */}
          <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Fabric</span>
            <div className="flex flex-col gap-1 mt-1">
              {fabricsList.map((fabric) => {
                const isSelected = selectedFabrics.includes(fabric);
                return (
                  <label key={fabric} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleArrayFilter(selectedFabrics, setSelectedFabrics, fabric)}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <span>{fabric}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sizes (Multi-select) */}
          <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Sizes</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {sizesList.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleArrayFilter(selectedSizes, setSelectedSizes, size)}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all uppercase ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-black/10 dark:border-white/10 text-gray-500 hover:border-brand-primary/50'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors (Multi-select) */}
          <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Colors</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {colorsList.map((col) => {
                const isSelected = selectedColors.includes(col.value);
                return (
                  <button
                    key={col.value}
                    onClick={() => toggleArrayFilter(selectedColors, setSelectedColors, col.value)}
                    style={{ backgroundColor: col.value }}
                    className={`h-7 w-7 rounded-full border-2 hover:scale-115 transition-all shadow-sm relative flex items-center justify-center`}
                    title={col.name}
                  >
                    {isSelected && (
                      <span className="text-[10px] text-white drop-shadow-md">✓</span>
                    )}
                  </button>
                );
              })}
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
                className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-brand-primary"
              />
              <span className="text-xs text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Ratings filter levels */}
          <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Minimum Rating</span>
            <div className="flex flex-col gap-1 mt-1">
              {[4, 3, 2].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedRating(num)}
                  className={`text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors ${
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3 p-4 bg-white dark:bg-brand-charcoal rounded-2xl border border-black/5 animate-pulse">
                  <div className="aspect-[3/4] w-full bg-gray-200 dark:bg-white/5 rounded-xl" />
                  <div className="h-3 w-1/4 bg-gray-200 dark:bg-white/5 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-white/5 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <span className="text-brand-gold text-4xl">☹</span>
              <h3 className="font-serif font-semibold text-xl mt-4">{loadError ? 'Catalog Unavailable' : 'No Products Found'}</h3>
              <p className="text-sm text-gray-500 font-light mt-1">{loadError || 'Try resetting filters or adjusting search keyword terms.'}</p>
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
                    onClick={() => { setSelectedCategory(''); }}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      !selectedCategory ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 dark:border-white/10'
                    }`}
                  >
                    All Apparels
                  </button>
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); }}
                      className={`text-xs px-3 py-1.5 rounded-full border ${
                        selectedCategory === cat ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 dark:border-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories (Multi-select) */}
              <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-xs font-bold uppercase text-gray-400">Subcategories</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {subcategoriesList.map((subcat) => {
                    const isSelected = selectedSubcategories.includes(subcat);
                    return (
                      <button
                        key={subcat}
                        onClick={() => toggleArrayFilter(selectedSubcategories, setSelectedSubcategories, subcat)}
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                          isSelected ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 dark:border-white/10'
                        }`}
                      >
                        {subcat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brands (Multi-select) */}
              <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-xs font-bold uppercase text-gray-400">Brands</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {brandsList.map((brand) => {
                    const isSelected = selectedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        onClick={() => toggleArrayFilter(selectedBrands, setSelectedBrands, brand)}
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                          isSelected ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 dark:border-white/10'
                        }`}
                      >
                        {brand}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fabrics (Multi-select) */}
              <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-xs font-bold uppercase text-gray-400">Fabrics</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {fabricsList.map((fabric) => {
                    const isSelected = selectedFabrics.includes(fabric);
                    return (
                      <button
                        key={fabric}
                        onClick={() => toggleArrayFilter(selectedFabrics, setSelectedFabrics, fabric)}
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                          isSelected ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 dark:border-white/10'
                        }`}
                      >
                        {fabric}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizes (Multi-select) */}
              <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-xs font-bold uppercase text-gray-400">Sizes</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {sizesList.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => toggleArrayFilter(selectedSizes, setSelectedSizes, size)}
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                          isSelected ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-300 dark:border-white/10'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors (Multi-select) */}
              <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-xs font-bold uppercase text-gray-400">Colors</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {colorsList.map((col) => {
                    const isSelected = selectedColors.includes(col.value);
                    return (
                      <button
                        key={col.value}
                        onClick={() => toggleArrayFilter(selectedColors, setSelectedColors, col.value)}
                        style={{ backgroundColor: col.value }}
                        className={`h-7 w-7 rounded-full border-2 hover:scale-115 transition-all shadow-sm relative flex items-center justify-center`}
                        title={col.name}
                      >
                        {isSelected && (
                          <span className="text-[10px] text-white drop-shadow-md">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price parameters */}
              <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
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
              <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                <span className="text-xs font-bold uppercase text-gray-400">Ratings</span>
                <div className="flex flex-col gap-2">
                  {[4, 3, 2].map((num) => (
                    <button
                      key={num}
                      onClick={() => { setSelectedRating(num); }}
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
