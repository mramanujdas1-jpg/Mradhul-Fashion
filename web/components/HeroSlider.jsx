'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../app/config';

const defaultSlides = [
  {
    image: '/banner_ethnic.png',
    title: 'The Royal Jaipur Heritage',
    subtitle: 'EXPERIENCE PURE ROYALTY',
    description: 'Explore hand-embellished Gota Patti sarees, traditional Leheriya silk Anarkalis, and exquisite heritage craft.',
    link: '/products?category=Handcrafted%20Sarees',
    align: 'left'
  },
  {
    image: '/banner_western.png',
    title: 'Intricate Handcrafted Bridal Wear',
    subtitle: 'THE MAHARANI BRIDAL COUTURE',
    description: 'Discover pure mulberry raw silk lehengas detailing heavy zardozi, hand-woven gold dori, and pearl hand-embroidery.',
    link: '/products?category=Designer%20Lehengas',
    align: 'right'
  }
];

export default function HeroSlider() {
  const [slidesList, setSlidesList] = useState(defaultSlides);
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev === slidesList.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slidesList.length - 1 : prev - 1));
  };

  // Fetch live banners if online
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_BASE}/banners`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const formatted = data.map((b, idx) => ({
              image: b.image,
              title: b.title,
              subtitle: idx % 2 === 0 ? 'EXPERIENCE PURE ROYALTY' : 'THE MAHARANI BRIDAL COUTURE',
              description: 'Authentic Jaipur designer handwork, tailored specifically for your special occasions.',
              link: b.link || '/products',
              align: idx % 2 === 0 ? 'left' : 'right'
            }));
            setSlidesList(formatted);
          }
        }
      } catch (err) {
        console.warn('API error fetching banners, using default slides.');
      }
    };
    fetchBanners();
  }, []);

  // Autoplay slider
  useEffect(() => {
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, [slidesList]);

  if (!slidesList || slidesList.length === 0) return null;

  return (
    <div className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden bg-brand-obsidian">
      {/* Slider Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background image with overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center select-none"
            style={{ backgroundImage: `url(${slidesList[current].image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
          </div>

          {/* Info Details Content */}
          <div className="absolute inset-0 flex items-center px-6 md:px-24">
            <div
              className={`max-w-2xl text-white ${
                slidesList[current].align === 'right' ? 'ml-auto text-right' : 'mr-auto text-left'
              }`}
            >
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs md:text-sm font-bold tracking-[0.25em] text-brand-gold uppercase block mb-3"
              >
                {slidesList[current].subtitle}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-serif text-3xl md:text-6xl font-semibold tracking-wide leading-tight mb-4"
              >
                {slidesList[current].title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm md:text-lg text-gray-300 font-light mb-8 leading-relaxed"
              >
                {slidesList[current].description}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Link
                  href={slidesList[current].link}
                  className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs md:text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-full inline-block shadow-lg btn-premium transition-all duration-300"
                >
                  Shop Collection
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controllers */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white hover:bg-white/10 transition-all duration-200 z-10"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white hover:bg-white/10 transition-all duration-200 z-10"
        aria-label="Next Slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slidesList.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === current ? 'w-6 bg-brand-primary' : 'w-2 bg-white/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
