'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { useRouter } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import { Star, Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, RefreshCcw, Send, X, CheckCircle2, ChevronRight, MapPin, Tag } from 'lucide-react';

import { API_BASE } from '../../config';

export default function ProductDetails({ params }) {
  const unwrappedParams = React.use(params);
  const productIdOrSlug = unwrappedParams.id;
  
  const router = useRouter();
  const { user, addToCart, wishlist, toggleWishlist } = useApp();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selectors
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null); // 'loading', 'valid', 'invalid'

  // Zoom state
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [showCartSuccess, setShowCartSuccess] = useState(false);

  const isWishlisted = product && wishlist.some((item) => item._id === product._id);

  // Load details
  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // First try to fetch by slug
      let res = await fetch(`${API_BASE}/products/slug/${productIdOrSlug}`);
      if (!res.ok) {
        // Fallback to fetch by ID if slug fails
        res = await fetch(`${API_BASE}/products/${productIdOrSlug}`);
      }

      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
        setReviews(data.reviews || []);
        
        if (data.product.images && data.product.images.length > 0) {
          setSelectedImage(data.product.images[0]);
        }
        
        if (data.product.sizes && data.product.sizes.length > 0) {
          // Select first available size
          const availableSize = data.product.sizes.find(s => data.product.stockPerSize && data.product.stockPerSize[s] > 0);
          setSelectedSize(availableSize || data.product.sizes[0]);
        }
        
        if (data.product.colors && data.product.colors.length > 0) {
          setSelectedColor(data.product.colors[0]);
        }
 
        // Fetch related products
        const recRes = await fetch(`${API_BASE}/products?category=${encodeURIComponent(data.product.category)}`);
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecommended(recData.products.filter((p) => p._id !== data.product._id));
        }
      } else {
        setProduct(null);
      }
    } catch (err) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productIdOrSlug]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    
    // Check stock for selected size
    const availableStock = product.stockPerSize ? (product.stockPerSize[selectedSize] || 0) : product.stock;
    if (availableStock < quantity) {
      alert(`Only ${availableStock} items left for size ${selectedSize}`);
      return;
    }

    addToCart(product, selectedSize, quantity);
    setShowCartSuccess(true);
    setTimeout(() => {
      setShowCartSuccess(false);
    }, 3500);
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setPincodeStatus('invalid');
      return;
    }
    setPincodeStatus('loading');
    setTimeout(() => {
      // Mock validation
      if (['000000', '111111'].includes(pincode)) {
        setPincodeStatus('invalid');
      } else {
        setPincodeStatus('valid');
      }
    }, 800);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCcw className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm text-gray-500">Unveiling garment files...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-40">
        <h2 className="font-serif text-2xl text-gray-900 dark:text-white">Product Not Found</h2>
        <p className="text-gray-500 mt-2">The item you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => router.push('/products')} className="mt-6 bg-brand-primary text-white px-8 py-3 rounded-md text-sm font-semibold uppercase tracking-wider transition-colors hover:bg-brand-primaryDark">
          Return To Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 font-sans text-gray-900 dark:text-gray-100">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-6">
        <Link href="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight size={12} />
        <Link href={`/products?category=${product.category}`} className="hover:text-brand-primary">{product.category}</Link>
        <ChevronRight size={12} />
        <span className="text-gray-800 dark:text-gray-300 truncate">{product.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left Side: Sticky Image Gallery Desktop */}
        <div className="lg:w-3/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:sticky lg:top-24">
            {product.images.map((img, idx) => (
              <div key={idx} className="aspect-[3/4] rounded-sm overflow-hidden bg-gray-100 relative group cursor-zoom-in">
                <img src={img} alt={`${product.name} - view ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="lg:w-2/5 flex flex-col gap-6">
          <div className="pb-4 border-b border-gray-200 dark:border-[#333]">
            <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-2">{product.brand || 'Mradhul Jaipur'}</h1>
            <p className="text-lg text-gray-500 font-light mb-4">{product.name}</p>
            
            {product.rating > 0 && (
              <div className="flex items-center gap-2 inline-flex border border-gray-200 dark:border-[#333] rounded-sm px-2 py-1 text-xs font-bold mb-4 hover:border-gray-300 transition-colors cursor-pointer">
                <span>{product.rating.toFixed(1)}</span>
                <Star size={12} className="fill-brand-gold text-brand-gold" />
                <span className="text-gray-300 mx-1">|</span>
                <span className="text-gray-500">{product.numReviews} Ratings</span>
              </div>
            )}

            <div className="flex items-end gap-3 mt-2">
              <span className="text-2xl font-bold">₹{product.discountPrice || product.price}</span>
              {product.discountPrice > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">MRP ₹{product.price}</span>
                  <span className="text-brand-gold font-bold text-sm tracking-wider">({product.discountPercent}% OFF)</span>
                </>
              )}
            </div>
            <p className="text-xs text-green-600 font-semibold mt-1">inclusive of all taxes</p>
          </div>

          {/* Sizing */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">Select Size</span>
                <button className="text-xs font-bold text-brand-primary hover:underline uppercase tracking-wider">Size Chart</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => {
                  const stock = product.stockPerSize ? (product.stockPerSize[size] || 0) : product.stock;
                  const isOutOfStock = stock <= 0;
                  const isSelected = selectedSize === size;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      className={`h-12 w-12 rounded-full border flex items-center justify-center text-sm font-medium transition-all
                        ${isOutOfStock ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed opacity-50 relative overflow-hidden' : 
                          isSelected ? 'border-brand-primary text-brand-primary font-bold shadow-md ring-1 ring-brand-primary' : 
                          'border-gray-300 text-gray-700 hover:border-brand-primary dark:border-[#555] dark:text-gray-300'}
                      `}
                    >
                      {size}
                      {isOutOfStock && <div className="absolute w-[120%] h-[1px] bg-gray-300 rotate-45"></div>}
                    </button>
                  );
                })}
              </div>
              {selectedSize && (product.stockPerSize?.[selectedSize] <= 5 && product.stockPerSize?.[selectedSize] > 0) && (
                <p className="text-xs font-semibold text-red-500 animate-pulse">Only {product.stockPerSize[selectedSize]} left in stock for {selectedSize}</p>
              )}
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 dark:border-[#333] pt-4">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">Color Options</span>
              <div className="flex items-center gap-3">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-10 w-10 rounded-full border border-gray-300 p-0.5 transition-all ${selectedColor === color ? 'ring-2 ring-brand-primary border-transparent' : ''}`}
                  >
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: color }}></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Bag Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-brand-primary hover:bg-brand-primaryDark text-white h-14 rounded-md font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <ShoppingBag size={18} /> Add to Bag
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className="h-14 px-6 border border-gray-300 dark:border-[#444] rounded-md flex items-center justify-center hover:border-gray-900 dark:hover:border-white transition-colors group"
            >
              <Heart size={20} className={`${isWishlisted ? 'fill-brand-primary text-brand-primary' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
            </button>
          </div>

          {/* Delivery Pincode */}
          <div className="border border-gray-200 dark:border-[#333] rounded-sm p-4 mt-4 bg-gray-50 dark:bg-[#1A1A1A]">
            <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-wider">
              <Truck size={18} /> Delivery Options
            </div>
            <form onSubmit={handleCheckPincode} className="flex items-center border border-gray-300 dark:border-[#444] rounded bg-white dark:bg-[#121212] overflow-hidden">
              <input
                type="text"
                placeholder="Enter Pincode"
                maxLength={6}
                value={pincode}
                onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-4 py-2 text-sm focus:outline-none bg-transparent"
              />
              <button type="submit" className="px-4 text-xs font-bold text-brand-primary uppercase">
                Check
              </button>
            </form>
            {pincodeStatus === 'loading' && <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><RefreshCcw size={12} className="animate-spin" /> Verifying...</p>}
            {pincodeStatus === 'valid' && (
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                <p className="flex items-center gap-1.5 text-green-600 font-medium"><CheckCircle2 size={14} /> Available for delivery at {pincode}</p>
                <p className="flex items-center gap-1.5"><Truck size={14} className="text-gray-400" /> Get it by {new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString()}</p>
                <p className="flex items-center gap-1.5"><RotateCcw size={14} className="text-gray-400" /> 7 days return & exchange available</p>
                <p className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-gray-400" /> Pay on delivery available</p>
              </div>
            )}
            {pincodeStatus === 'invalid' && <p className="text-xs text-red-500 mt-2 font-medium">Sorry, we do not deliver to this pincode.</p>}
          </div>

          {/* Product Details Section */}
          <div className="border-t border-gray-200 dark:border-[#333] pt-6 mt-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Tag size={18} /> Product Details</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light">{product.description}</p>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              {product.fabricMaterial && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Material</span>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{product.fabricMaterial}</p>
                </div>
              )}
              {product.careInstructions && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Care Instructions</span>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{product.careInstructions}</p>
                </div>
              )}
              {product.gender && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Gender</span>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{product.gender}</p>
                </div>
              )}
              {product.sku && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">SKU</span>
                  <p className="font-medium text-gray-800 dark:text-gray-200 font-mono">{product.sku}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommended Slider carousel */}
      {recommended.length > 0 && (
        <section className="mt-24 border-t border-gray-200 dark:border-[#333] pt-12">
          <h3 className="font-serif text-2xl font-semibold tracking-wider mb-8">Similar Styles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recommended.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Cart Addition Success Popup */}
      {showCartSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-[#1E1E1E] p-4 rounded-lg shadow-2xl max-w-sm flex items-start gap-4 border border-gray-100 dark:border-[#333] animate-slide-up">
          <div className="h-16 w-12 bg-gray-100 shrink-0 rounded overflow-hidden">
             <img src={selectedImage} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex-grow">
            <h4 className="font-bold text-sm flex items-center gap-1 text-green-600"><CheckCircle2 size={16} /> Added to Bag</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{product.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Size: {selectedSize} | Qty: {quantity}</p>
            <button
              onClick={() => router.push('/cart')}
              className="mt-3 w-full bg-brand-primary text-white text-xs font-bold uppercase tracking-wider py-2 rounded shadow-sm hover:bg-brand-primaryDark transition-colors"
            >
              View Cart
            </button>
          </div>
          <button onClick={() => setShowCartSuccess(false)} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
