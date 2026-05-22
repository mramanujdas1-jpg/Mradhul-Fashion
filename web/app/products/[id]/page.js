'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { useRouter } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import { Star, Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, RefreshCcw, Send } from 'lucide-react';

import { API_BASE } from '../../config';

const fallbackProducts = [
  {
    _id: 'p1',
    name: 'Royale Jaipur Gota Patti Saree',
    description: 'A breathtaking royal georgette saree, hand-embellished by Jaipur heritage artisans. Features detailed gota-patti embroidery borders, traditional hand-block floral motifs, and delicate hand-stitched gold sequins. Fits elegantly for festive banquets and weddings.',
    price: 18999,
    discountPrice: 14999,
    category: 'Handcrafted Sarees',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
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
    description: 'This royal tie-dye Leheriya Anarkali suit set is crafted from pure hand-loomed Banarasi silk. Embellished with fine mirror embroidery and gold zardozi work along the neck and flare. Includes matching churidar and a sheer chiffon dupatta.',
    price: 14499,
    discountPrice: 11999,
    category: 'Royal Anarkalis',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800', 'https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=800'],
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
    description: 'A masterpiece of royal bridal couture. Tailored in pure mulberry raw silk with heavy zardozi, hand-woven gold dori, and real semi-precious bead embellishments. The flare is detailed with traditional palace arch motifs handcrafted by Jaipur master artisans over 300 hours.',
    price: 49999,
    discountPrice: 42999,
    category: 'Bridal & Festive',
    images: ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=800', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
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
    images: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
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
    description: 'A luxurious velvet jacket intricately detailed with traditional Shekhawati hand-embroidery. Embellished with fine dabka threadwork, mirror details, and brass buttons. Perfect to layer over modern or traditional ethnic ensembles.',
    price: 12999,
    discountPrice: 9999,
    category: 'Artisan Jackets & Dupattas',
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 8,
    rating: 4.9,
    numReviews: 9,
    isTrending: true,
    isFlashSale: false
  }
];

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
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

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

        // Fetch related products
        const recRes = await fetch(`${API_BASE}/products?category=${encodeURIComponent(data.product.category)}`);
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecommended(recData.products.filter((p) => p._id !== data.product._id));
        }
      }
    } catch (err) {
      console.warn('API error fetching product. Toggling mock detail mode.');
      const localProduct = fallbackProducts.find((p) => p._id === productId) || fallbackProducts[0];
      setProduct(localProduct);
      setSelectedImage(localProduct.images[0]);
      setSelectedSize(localProduct.sizes[0] || 'M');
      setReviews([
        { _id: 'r1', name: 'Alok Mishra', rating: 5, comment: 'Simply stunning! The fabric feel and colors represent pure premium luxury.', createdAt: new Date().toISOString() },
        { _id: 'r2', name: 'Preeti Sharma', rating: 4, comment: 'Fits beautifully. Perfect embroidery work.', createdAt: new Date().toISOString() }
      ]);
      setRecommended(fallbackProducts.filter((p) => p._id !== localProduct._id));
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
    router.push('/cart');
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

    try {
      const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess('Review submitted successfully.');
        setReviewComment('');
        fetchProductDetails();
      } else {
        setReviewError(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewError('Unable to connect to the backend server to submit reviews.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 font-sans">
      {/* Detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Side: Images selectors */}
        <div className="flex flex-col gap-4">
          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-50 border border-brand-primary/5 shadow-sm">
            <img src={selectedImage} alt={product.name} className="w-full h-full object-cover object-center" />
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
            <span className="text-xs text-brand-gold font-bold uppercase tracking-widest">{product.category}</span>
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
                <p>{product.description}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-brand-gold" />
                    <span>Free express delivery on all credit card or prepaid transactions.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw size={16} className="text-brand-gold" />
                    <span>15 days hassle-free sizing returns with pick up right from your address.</span>
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
            {reviews.length === 0 ? (
              <p className="text-sm font-light text-gray-500 italic py-6">Be the first to leave a review for this premium clothing item!</p>
            ) : (
              <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-2">
                {reviews.map((rev) => (
                  <div key={rev._id} className="border-b border-black/5 dark:border-white/5 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{rev.name}</span>
                      <span className="text-[10px] text-gray-400 font-light">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-brand-gold mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < rev.rating ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'} />
                      ))}
                    </div>
                    <p className="text-xs font-light text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
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
    </div>
  );
}
