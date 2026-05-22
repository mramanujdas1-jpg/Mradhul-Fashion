'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../app/context';
import { Heart, ShoppingCart, Star } from 'lucide-react';

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist, addToCart } = useApp();

  const isWishlisted = wishlist.some((item) => item._id === product._id);

  const calculateDiscount = () => {
    if (!product.discountPrice) return 0;
    const diff = product.price - product.discountPrice;
    return Math.round((diff / product.price) * 100);
  };

  const discountPercent = calculateDiscount();

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Default size selection is M or Free Size if not specified
    const selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M';
    addToCart(product, selectedSize, 1);
  };

  return (
    <div className="group relative bg-white dark:bg-brand-charcoal rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-primary/5 flex flex-col h-full">
      {/* Product Image section */}
      <Link href={`/products/${product._id}`} className="relative block overflow-hidden aspect-[3/4] bg-gray-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isTrending && (
            <span className="bg-brand-gold text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
              Trending
            </span>
          )}
          {product.isFlashSale && (
            <span className="bg-brand-primary text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm animate-pulse-slow">
              Flash Sale
            </span>
          )}
        </div>

        {/* Wishlist Icon */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 rounded-full glass-panel hover:bg-brand-primary hover:text-white transition-all duration-300 shadow-sm"
          aria-label="Add to Wishlist"
        >
          <Heart size={16} className={isWishlisted ? "fill-brand-primary text-brand-primary hover:text-white" : ""} />
        </button>

        {/* Hover Quick Add Action Bar */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center">
          <button
            onClick={handleQuickAdd}
            className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold uppercase py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md btn-premium transition-all duration-200"
          >
            <ShoppingCart size={14} /> Quick Add
          </button>
        </div>

        {/* Ratings overlay */}
        {product.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/95 dark:bg-brand-charcoal/95 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
            <span className="text-gray-800 dark:text-gray-200">{product.rating.toFixed(1)}</span>
            <Star size={10} className="fill-brand-gold text-brand-gold" />
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{product.numReviews}</span>
          </div>
        )}
      </Link>

      {/* Info details */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-2">
        <Link href={`/products/${product._id}`} className="block">
          <span className="text-[11px] text-brand-gold font-bold tracking-wider uppercase">
            {product.category}
          </span>
          <h3 className="font-sans font-medium text-sm text-gray-800 dark:text-gray-200 mt-1 line-clamp-1 group-hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price layout */}
        <div className="flex items-baseline gap-2 mt-1">
          {product.discountPrice ? (
            <>
              <span className="font-bold text-base text-brand-primary">
                ₹{product.discountPrice}
              </span>
              <span className="text-xs text-gray-400 line-through">
                ₹{product.price}
              </span>
              <span className="text-[10px] font-bold text-brand-gold">
                ({discountPercent}% OFF)
              </span>
            </>
          ) : (
            <span className="font-bold text-base text-gray-900 dark:text-white">
              ₹{product.price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
