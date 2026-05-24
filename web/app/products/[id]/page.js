'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { useRouter } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import { Star, Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, RefreshCcw, Send, X, CheckCircle2 } from 'lucide-react';

import { API_BASE } from '../../config';

export default function ProductDetails({ params }) {
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.id;
  
  const router = useRouter();
  const { user, addToCart, wishlist, toggleWishlist } = useApp();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selector variables
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Review Submissions
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [uploadingReviewImg, setUploadingReviewImg] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [showCartSuccess, setShowCartSuccess] = useState(false);
  const [reviewSort, setReviewSort] = useState('newest');

  const isWishlisted = product && wishlist.some((item) => item._id === product._id);

  // Load details
  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
        setReviews(data.reviews || []);
        setSelectedImage(data.product.images[0]);
        setSelectedSize(data.product.sizes[0] || 'M');
        setSelectedColor(data.product.colors[0] || '');
 
        // Fetch related products
        const recRes = await fetch(`${API_BASE}/products?category=${encodeURIComponent(data.product.category)}`);
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecommended(recData.products.filter((p) => p._id !== data.product._id));
        }
      }
    } catch (err) {
      setProduct(null);
      setReviews([]);
      setRecommended([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, selectedSize, quantity);
    setShowCartSuccess(true);
    setTimeout(() => {
      setShowCartSuccess(false);
    }, 3500);
  };

  const handleReviewImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingReviewImg(true);
    setReviewError('');
    setReviewSuccess('');

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

      setReviewImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      setReviewError(err.message || 'Failed to upload one or more review images.');
    } finally {
      setUploadingReviewImg(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSuccess('');
    setReviewError('');

    if (!user) {
      setReviewError('Please login to submit product reviews.');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError('Review comments cannot be empty.');
      return;
    }

    const imagesArr = Array.isArray(reviewImages) ? reviewImages : [];

    try {
      const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment, images: imagesArr })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess('Review submitted successfully.');
        setReviewComment('');
        setReviewImages([]);
        fetchProductDetails();
      } else {
        setReviewError(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewError('Unable to connect to the backend server to submit reviews.');
    }
  };

  const handleHelpfulClick = async (reviewId) => {
    if (!user) {
      alert('Please sign in to rate helpful reviews.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/products/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('mf_auth_token')}`
        }
      });
      if (res.ok) {
        fetchProductDetails();
      } else {
        const data = await res.json();
        console.warn('Helpful rating failed:', data.message);
      }
    } catch (err) {
      console.error('Failed to register helpful vote:', err);
    }
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
        <h2 className="font-serif text-2xl">Garment Not Found</h2>
        <button onClick={() => router.push('/products')} className="mt-4 bg-brand-primary text-white px-6 py-2.5 rounded-full text-xs uppercase font-bold">
          Return To Shop
        </button>
      </div>
    );
  }

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  // Star Rating distribution calculations
  const starBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (starBreakdown[r.rating] !== undefined) {
      starBreakdown[r.rating]++;
    }
  });

  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (reviewSort === 'rating-high') {
      return b.rating - a.rating;
    } else if (reviewSort === 'rating-low') {
      return a.rating - b.rating;
    }
    return 0;
  });

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description,
    "sku": product.sku || product._id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Mradhul Jaipur"
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "url": `https://mradhulfashion.com/products/${product._id}`,
      "priceCurrency": "INR",
      "price": product.discountPrice || product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceValidUntil": "2026-12-31"
    },
    ...(reviews.length > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating || 4.5,
        "reviewCount": reviews.length
      },
      "review": reviews.map(r => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": r.name
        },
        "datePublished": new Date(r.createdAt).toISOString().split('T')[0],
        "reviewBody": r.comment,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating
        }
      }))
    } : {})
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {/* Detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Side: Images selectors */}
        <div className="flex flex-col gap-4">
          <div
            className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-50 border border-brand-primary/5 shadow-sm relative cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={(e) => {
              const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
              const x = ((e.pageX - left - window.scrollX) / width) * 100;
              const y = ((e.pageY - top - window.scrollY) / height) * 100;
              setZoomPos({ x, y });
            }}
          >
            <img
              src={selectedImage}
              alt={product.name}
              className={`w-full h-full object-cover object-center transition-transform duration-75 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
            />
          </div>
          {/* Thumbnails grid */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {product.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(img)}
                className={`h-20 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                  selectedImage === img ? 'border-brand-primary' : 'border-transparent bg-gray-100'
                }`}
              >
                <img src={img} alt="Thumbnail view" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Product Details info */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-primary font-bold uppercase tracking-wider">{product.brand || 'Mradhul Jaipur'}</span>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{product.category}</span>
            </div>
            <h1 className="font-serif text-3xl font-semibold mt-1 leading-tight text-gray-800 dark:text-gray-100">{product.name}</h1>

            {/* Ratings stars count */}
            {product.rating > 0 && (
              <div className="flex items-center gap-1 mt-2.5 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-0.5 text-brand-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(product.rating) ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span>({product.rating.toFixed(1)})</span>
                <span className="text-gray-300">|</span>
                <span>{product.numReviews} ratings</span>
              </div>
            )}
          </div>

          {/* Pricing bar */}
          <div className="border-y border-black/5 dark:border-white/5 py-4 flex items-baseline gap-3">
            {product.discountPrice ? (
              <>
                <span className="font-serif text-3xl font-bold text-brand-primary">₹{product.discountPrice}</span>
                <span className="text-sm text-gray-400 line-through">₹{product.price}</span>
                <span className="text-xs font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-md">
                  ({discountPercent}% OFF)
                </span>
              </>
            ) : (
              <span className="font-serif text-3xl font-bold">₹{product.price}</span>
            )}
          </div>

          {/* Colors Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Select Color</span>
              <div className="flex items-center gap-2.5">
                {product.colors.map((color) => {
                  const isActive = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-8 w-8 rounded-full border-2 hover:scale-110 transition-all shadow-sm focus:outline-none flex items-center justify-center ${
                        isActive ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-105' : 'border-black/15'
                      }`}
                      title={color}
                    >
                      {isActive && (
                        <span className="text-[10px] text-white drop-shadow font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Select Sizing Option</span>
              <div className="flex items-center gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 min-w-[2.75rem] px-3 border-2 rounded-xl text-xs font-bold transition-all uppercase flex items-center justify-center ${
                      selectedSize === size
                        ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                        : 'border-black/10 dark:border-white/10 hover:border-brand-primary/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons (Add to Cart, Wishlist, quantity) */}
          <div className="flex items-center gap-4">
            {/* Quantity select */}
            <div className="flex items-center border border-black/10 dark:border-white/10 rounded-xl overflow-hidden h-12">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 hover:bg-black/5 dark:hover:bg-white/5 text-sm h-full"
              >
                -
              </button>
              <span className="px-4 text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 hover:bg-black/5 dark:hover:bg-white/5 text-sm h-full"
              >
                +
              </button>
            </div>

            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              className="bg-brand-primary hover:bg-brand-primaryDark text-white font-bold text-xs uppercase tracking-wider h-12 flex-grow rounded-xl flex items-center justify-center gap-2 btn-premium shadow-md"
            >
              <ShoppingBag size={16} /> Add to Cart Bag
            </button>

            {/* Wishlist toggle */}
            <button
              onClick={() => toggleWishlist(product)}
              className="p-3.5 border-2 border-black/10 dark:border-white/10 rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all"
              aria-label="Wishlist Bookmark"
            >
              <Heart size={18} className={isWishlisted ? 'fill-brand-primary text-brand-primary' : ''} />
            </button>
          </div>

          {/* Accordion Tabs Description, Shipping Info */}
          <div className="border-t border-black/5 dark:border-white/5 pt-4">
            <div className="flex border-b border-black/5 dark:border-white/5 pb-2 gap-6 text-sm font-semibold text-gray-500">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-1 ${activeTab === 'description' ? 'text-brand-primary border-b-2 border-brand-primary font-bold' : ''}`}
              >
                Product Details
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`pb-1 ${activeTab === 'shipping' ? 'text-brand-primary border-b-2 border-brand-primary font-bold' : ''}`}
              >
                Returns & Shipping
              </button>
            </div>
            
            <div className="py-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light">
              {activeTab === 'description' ? (
                <div className="flex flex-col gap-4">
                  <p>{product.description}</p>
                  
                  {/* Fabric and SKU details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Fabric / Material</span>
                      <p className="text-sm font-semibold">{product.fabricMaterial || 'Premium Silk & Cotton blend'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">SKU Code</span>
                      <p className="text-sm font-mono">{product.sku || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Dynamic specs list */}
                  {product.specifications && product.specifications.length > 0 && (
                    <div className="pt-4 border-t border-black/5 dark:border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Specifications</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        {product.specifications.map((spec, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                            <span className="text-gray-500 font-light">{spec.key}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-brand-gold" />
                    <span>{product.deliveryInfo || 'Ships within 24-48 hours. Free express delivery in India.'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw size={16} className="text-brand-gold" />
                    <span>{product.returnPolicy || '7-day standard returns. alter services available.'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-brand-gold" />
                    <span>Razorpay SSL Secure and COD checkout options.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews and Ratings submissions section */}
      <section className="mt-16 border-t border-black/5 dark:border-white/5 pt-12">
        <h2 className="font-serif text-2xl font-semibold mb-8">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Review write submissions form */}
          <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-brand-primary/10 flex flex-col gap-4">
            <h4 className="font-serif font-bold text-base text-brand-primary">Share Your Styling Review</h4>
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-semibold uppercase">Rating Score</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-2 text-xs rounded-xl focus:outline-none focus:border-brand-primary"
                >
                  <option value={5}>5 Stars (Excellent)</option>
                  <option value={4}>4 Stars (Good)</option>
                  <option value={3}>3 Stars (Fair)</option>
                  <option value={2}>2 Stars (Poor)</option>
                  <option value={1}>1 Star (Awful)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-semibold uppercase">Comment Review</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about the fabric quality, sizing fit, and aesthetics..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 p-3 text-xs rounded-xl focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-semibold uppercase">Review Photos</label>
                <div className="flex flex-col gap-2 p-3 border border-black/10 dark:border-white/10 rounded-xl bg-transparent">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleReviewImageUpload}
                    className="hidden"
                    id="customer-review-images-upload"
                    disabled={uploadingReviewImg}
                  />
                  <label
                    htmlFor="customer-review-images-upload"
                    className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-center py-2.5 rounded-xl cursor-pointer hover:bg-brand-primary/15 transition-all text-[10px] font-bold uppercase tracking-wider block"
                  >
                    {uploadingReviewImg ? 'Uploading...' : 'Upload Photos'}
                  </label>
                  
                  {reviewImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {reviewImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative h-10 w-10 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden bg-gray-50 flex-shrink-0 group">
                          <img src={imgUrl} className="h-full w-full object-cover" alt="Review thumbnail" />
                          <button
                            type="button"
                            onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-brand-primary text-white rounded-bl-lg p-0.5 opacity-90 hover:opacity-100 transition-opacity"
                            aria-label="Remove Image"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {reviewSuccess && <p className="text-xs text-green-600 font-semibold">{reviewSuccess}</p>}
              {reviewError && <p className="text-xs text-brand-primary font-semibold">{reviewError}</p>}

              <button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm mt-2"
              >
                <Send size={12} /> Post Review
              </button>
            </form>
          </div>

          {/* List of customer reviews */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Rating distribution dashboard */}
            {reviews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl bg-gray-50 dark:bg-brand-charcoal/30 border border-black/5 dark:border-white/5">
                <div className="flex flex-col justify-center items-center text-center">
                  <span className="text-4xl font-bold font-serif text-brand-primary">{product.rating.toFixed(1)}</span>
                  <div className="flex items-center gap-0.5 text-brand-gold mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < Math.round(product.rating) ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1.5 font-semibold">{reviews.length} Customer Reviews</span>
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1.5 justify-center">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = starBreakdown[stars] || 0;
                    const percent = Math.round((count / (reviews.length || 1)) * 100);
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-10 text-gray-500 font-semibold text-right">{stars} Star</span>
                        <div className="flex-grow h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div style={{ width: `${percent}%` }} className="h-full bg-brand-gold" />
                        </div>
                        <span className="w-12 text-gray-400 text-left font-light">{percent}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-sm font-light text-gray-500 italic py-6">Be the first to leave a review for this premium clothing item!</p>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                  <span className="text-xs font-semibold text-gray-500">Customer Ratings & Reviews ({reviews.length})</span>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    className="bg-transparent border border-black/10 dark:border-white/10 p-1.5 rounded-lg text-xs focus:outline-none focus:border-brand-primary"
                  >
                    <option value="newest">Sort By: Newest First</option>
                    <option value="rating-high">Sort By: Highest Rating</option>
                    <option value="rating-low">Sort By: Lowest Rating</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-2">
                  {sortedReviews.map((rev) => {
                  const hasUpvoted = rev.helpfulUsers && user && rev.helpfulUsers.includes(user._id);
                  return (
                    <div key={rev._id} className="border-b border-black/5 dark:border-white/5 pb-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{rev.name}</span>
                          {rev.verifiedPurchase && (
                            <span className="bg-green-500/10 text-green-600 border border-green-500/20 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              ✓ Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-light">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-brand-gold mt-1.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} className={i < rev.rating ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'} />
                        ))}
                      </div>
                      <p className="text-xs font-light text-gray-600 dark:text-gray-300 mt-2.5 leading-relaxed">{rev.comment}</p>
                      
                      {/* Review uploaded images gallery */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          {rev.images.map((imgUrl, imgIdx) => (
                            <a
                              key={imgIdx}
                              href={imgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-14 w-14 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 hover:opacity-85 transition-opacity"
                            >
                              <img src={imgUrl} alt="Customer upload" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Helpful Upvotes Bar */}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleHelpfulClick(rev._id)}
                          className={`text-[10px] font-bold flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                            hasUpvoted
                              ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                              : 'border-black/10 dark:border-white/10 text-gray-500 hover:border-brand-primary hover:text-brand-primary'
                          }`}
                        >
                          👍 Helpful ({rev.helpfulCount || 0})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Recommended Slider carousel */}
      {recommended.length > 0 && (
        <section className="mt-20">
          <h3 className="font-serif text-2xl font-semibold tracking-wider text-center mb-8">You May Also Luxe</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recommended.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Cart Addition Success Popup */}
      {showCartSuccess && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel p-5 rounded-2xl border border-green-500/20 bg-white/95 dark:bg-brand-charcoal/95 shadow-xl max-w-sm flex items-start gap-3 animate-slide-up">
          <div className="h-10 w-10 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} className="fill-green-100" />
          </div>
          <div className="flex-grow">
            <h4 className="font-bold text-xs text-gray-800 dark:text-gray-100">Added to Bag</h4>
            <p className="text-[10px] text-gray-500 font-light mt-0.5">{product.name} ({selectedSize}) is ready in your cart.</p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => router.push('/cart')}
                className="bg-brand-primary text-white text-[9px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-lg shadow"
              >
                Go to Cart
              </button>
              <button
                type="button"
                onClick={() => setShowCartSuccess(false)}
                className="border border-black/10 dark:border-white/10 text-[9px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-lg"
              >
                Keep Shopping
              </button>
            </div>
          </div>
          <button type="button" onClick={() => setShowCartSuccess(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
