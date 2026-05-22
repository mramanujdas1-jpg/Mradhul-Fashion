'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import { Percent, Flame, ArrowRight, Sparkles, RefreshCcw, Star, Quote } from 'lucide-react';

import { API_BASE } from './config';

const fallbackCategories = [
  { _id: 'cat1', name: 'Handcrafted Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { _id: 'cat2', name: 'Designer Lehengas', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600' },
  { _id: 'cat3', name: 'Royal Anarkalis', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600' },
  { _id: 'cat4', name: 'Jaipur Fusion Wear', image: 'https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=600' },
  { _id: 'cat5', name: 'Bridal & Festive', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { _id: 'cat6', name: 'Artisan Jackets & Dupattas', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600' }
];

const fallbackProducts = [
  {
    _id: 'p1',
    name: 'Royale Jaipur Gota Patti Saree',
    description: 'A breathtaking royal georgette saree, hand-embellished by Jaipur heritage artisans. Features detailed gota-patti embroidery borders, traditional hand-block floral motifs, and delicate hand-stitched gold sequins. Fits elegantly for festive banquets and weddings.',
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
    description: 'This royal tie-dye Leheriya Anarkali suit set is crafted from pure hand-loomed Banarasi silk. Embellished with fine mirror embroidery and gold zardozi work along the neck and flare. Includes matching churidar and a sheer chiffon dupatta.',
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
    description: 'A masterpiece of royal bridal couture. Tailored in pure mulberry raw silk with heavy zardozi, hand-woven gold dori, and real semi-precious bead embellishments. The flare is detailed with traditional palace arch motifs handcrafted by Jaipur master artisans over 300 hours.',
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
    description: 'A luxurious velvet jacket intricately detailed with traditional Shekhawati hand-embroidery. Embellished with fine dabka threadwork, mirror details, and brass buttons. Perfect to layer over modern or traditional ethnic ensembles.',
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

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 24, minutes: 0, seconds: 0 });
  const [sectionSettings, setSectionSettings] = useState({
    showHero: true,
    showCategories: true,
    showStory: true,
    showBridalCards: true,
    showFlashSale: true,
    showTrending: true,
    showThreePillars: true,
    showCustomerLove: true,
    showInstagram: true,
    showPromo: true
  });

  // Load section toggles from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mradhul_homepage_sections');
      if (stored) {
        try {
          setSectionSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
        } catch (e) {
          console.warn('Failed parsing homepage section settings.');
        }
      }
    }
  }, []);

  // Load backend data if online
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch(`${API_BASE}/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.length) setCategories(catData);
        }

        const prodRes = await fetch(`${API_BASE}/products?pageSize=12`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.products && prodData.products.length) setProducts(prodData.products);
        }
      } catch (err) {
        console.warn('Backend API offline. Using preloaded dummy datasets for catalog visualization.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Flash sale countdown timer logic
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 24, minutes: 0, seconds: 0 }; // Loop back
        }
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const flashSaleItems = products.filter(p => p.isFlashSale);
  const trendingItems = products.filter(p => p.isTrending);

  return (
    <div className="flex flex-col w-full pb-16 bg-[#FAF7F2] text-[#1E1617]">
      {/* 1. Hero Sliders */}
      {sectionSettings.showHero && <HeroSlider />}

      {/* 2. Premium Category Bubbles */}
      {sectionSettings.showCategories && (
        <section className="py-16 px-4 md:px-12 bg-white dark:bg-brand-charcoal/50 w-full transition-colors border-b border-brand-gold/10">
        <div className="max-w-7xl mx-auto">
          <span className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase text-center block mb-2">CURATED HERITAGE</span>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-wider text-center mb-10 text-brand-primary flex items-center justify-center gap-2">
            Shop by Collection
          </h2>
          
          <div className="flex items-center justify-center gap-8 overflow-x-auto pb-4 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat._id || cat.name}
                onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name)}`)}
                className="flex flex-col items-center gap-3 group flex-shrink-0 focus:outline-none"
              >
                <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border border-brand-gold/20 group-hover:border-brand-primary p-1.5 transition-all duration-500 shadow-sm group-hover:shadow-lg bg-[#FAF7F2]">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <span className="text-xs md:text-sm font-semibold tracking-widest text-[#2B1D20] dark:text-gray-200 group-hover:text-brand-primary transition-colors uppercase">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
        </section>
      )}

      {/* 3. Handcrafted in Jaipur / Brand Storytelling */}
      {sectionSettings.showStory && (
        <section className="py-20 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative group overflow-hidden rounded-3xl border border-brand-gold/20 shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800" 
              alt="Jaipur Heritage Artisans" 
              className="w-full h-[450px] object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/80 via-transparent to-transparent flex items-end p-8">
              <div className="text-white">
                <span className="text-xs font-bold tracking-widest text-brand-gold uppercase block mb-1">LOCAL CRAFT REGISTRY</span>
                <h4 className="font-serif text-xl font-semibold">Supporting 150+ Artisans in Jaipur</h4>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 lg:pl-6">
            <span className="text-xs font-bold tracking-[0.3em] text-brand-gold uppercase">OUR HERITAGE STORY</span>
            <h3 className="font-serif text-3xl md:text-5xl font-semibold text-brand-primary leading-tight">
              Handcrafted in Jaipur, Made for Royalty
            </h3>
            <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
              Every creation at Mradhul Fashion tells a tale of traditional Rajasthani craftsmanship. From the intricate wooden blocks of Sanganer and Bagru to the glistening metal lines of Gota Patti borders, our local master karigars spend hundreds of hours weaving, tie-dyeing, and embroidering each apparel.
            </p>
            <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
              We source only premium silks, luxury georgettes, and organic cotton fabrics, finishing them with heritage detailing inspired by the grand archways and pink palace gardens of Jaipur.
            </p>
            
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-brand-gold/10">
              <div>
                <span className="font-serif text-2xl md:text-3xl font-bold text-brand-primary">100%</span>
                <p className="text-[10px] text-gray-500 tracking-wider uppercase font-semibold mt-1">Handcrafted Artistry</p>
              </div>
              <div>
                <span className="font-serif text-2xl md:text-3xl font-bold text-brand-primary">150+</span>
                <p className="text-[10px] text-gray-500 tracking-wider uppercase font-semibold mt-1">Artisan Partners</p>
              </div>
              <div>
                <span className="font-serif text-2xl md:text-3xl font-bold text-brand-primary">12+</span>
                <p className="text-[10px] text-gray-500 tracking-wider uppercase font-semibold mt-1">Jaipur Villages</p>
              </div>
            </div>
          </div>
          </div>
        </section>
      )}

      {/* 4. Bridal & Festive Collections Editorial Banner Cards */}
      {sectionSettings.showBridalCards && (
        <section className="py-12 px-4 md:px-12 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl h-80 md:h-[400px] group">
            <img 
              src="https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=800" 
              alt="Bridal Lehenga Collection" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#701122]/90 via-[#701122]/30 to-transparent flex flex-col justify-end p-8 md:p-12 text-white">
              <span className="text-[10px] font-bold tracking-[0.25em] text-brand-goldLight uppercase mb-2">MAHARANI COUTURE</span>
              <h3 className="font-serif text-2xl md:text-4xl font-semibold mb-3">Premium Bridal Wear</h3>
              <p className="text-xs md:text-sm text-gray-200 font-light mb-6 max-w-sm">Intricate raw silk lehengas decorated with hand-worked zardozi, gold dori, and meenakari beads.</p>
              <Link href="/products?category=Bridal%20%26%20Festive" className="bg-[#FAF7F2] text-brand-primary hover:bg-brand-cream text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full inline-block shadow-md w-max transition-colors">
                Explore Lehenga Couture
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl h-80 md:h-[400px] group">
            <img 
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800" 
              alt="Festive Wear Collection" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#A91B33]/90 via-[#A91B33]/30 to-transparent flex flex-col justify-end p-8 md:p-12 text-white">
              <span className="text-[10px] font-bold tracking-[0.25em] text-brand-goldLight uppercase mb-2">CELEBRATING HERITAGE</span>
              <h3 className="font-serif text-2xl md:text-4xl font-semibold mb-3">Festive Wear Collection</h3>
              <p className="text-xs md:text-sm text-gray-200 font-light mb-6 max-w-sm">Graceful hand-tied Bandhani dupattas, Gota Patti georgette sarees, and gold-accented shararas.</p>
              <Link href="/products?category=Handcrafted%20Sarees" className="bg-[#FAF7F2] text-brand-primary hover:bg-brand-cream text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full inline-block shadow-md w-max transition-colors">
                Shop Festive Wear
              </Link>
            </div>
          </div>
          </div>
        </section>
      )}

      {/* 5. Flash Sale Countdown Bar & Grid */}
      {sectionSettings.showFlashSale && flashSaleItems.length > 0 && (
        <section className="py-16 px-4 md:px-12 bg-white w-full border-y border-brand-gold/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-brand-primary/10 pb-6 mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary text-white rounded-xl shadow-md">
                  <Flame size={24} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-wider text-brand-primary">
                    Artisan Flash Sale
                  </h2>
                  <p className="text-xs text-gray-500 font-light mt-0.5">Exclusive handpicked heritage wear at preview pricing.</p>
                </div>
              </div>

              {/* Live countdown timer */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider mr-2">CLOSES IN</span>
                <div className="bg-brand-primary text-white font-mono font-bold text-sm px-3 py-1.5 rounded-lg">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="text-brand-primary font-bold">:</span>
                <div className="bg-brand-primary text-white font-mono font-bold text-sm px-3 py-1.5 rounded-lg">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="text-brand-primary font-bold">:</span>
                <div className="bg-brand-primary text-white font-mono font-bold text-sm px-3 py-1.5 rounded-lg">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {flashSaleItems.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Trending Section / Luxury Ethnic Wear */}
      {sectionSettings.showTrending && (
        <section className="py-20 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between border-b border-brand-primary/10 pb-6 mb-10">
          <div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase block mb-1">MEMBER CHOICES</span>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-wider flex items-center gap-2 text-brand-primary">
              <Percent className="text-brand-gold" size={24} /> Editor's Picks & Trending
            </h2>
          </div>
          <Link href="/products?trending=true" className="text-brand-primary text-sm font-semibold tracking-widest hover:text-brand-primaryDark flex items-center gap-1.5 uppercase">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCcw className="animate-spin text-brand-primary" size={32} />
            <p className="text-sm font-light text-gray-500">Unveiling collections...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trendingItems.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
      )}

      {/* 7. Artisan Craftsmanship Story Showcase */}
      {sectionSettings.showThreePillars && (
        <section className="py-20 bg-brand-primary text-[#FAF7F2] w-full px-4 md:px-12 border-t border-brand-gold/20">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-[10px] font-bold tracking-[0.35em] text-brand-goldLight uppercase block mb-3">PRESERVING HERITAGE</span>
          <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-6 max-w-2xl mx-auto leading-tight">
            The Three Pillars of Jaipur Artistry
          </h2>
          <p className="text-sm md:text-base text-brand-goldLight font-light max-w-xl mx-auto mb-16 leading-relaxed">
            Every garment we produce supports local handicraft clusters across Rajasthan, keeping ancient artistic methods alive.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center p-4">
              <div className="h-16 w-16 rounded-full bg-white/5 border border-brand-gold/30 flex items-center justify-center mb-6 text-brand-gold">
                <Sparkles size={28} />
              </div>
              <h4 className="font-serif text-xl font-semibold mb-3">1. Gota Patti Borders</h4>
              <p className="text-xs md:text-sm text-gray-300 font-light leading-relaxed">
                Originated in Rajasthan, this technique uses gold ribbons appliqued onto georgettes with fine hem stitches, giving a grand metallic luster.
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4">
              <div className="h-16 w-16 rounded-full bg-white/5 border border-brand-gold/30 flex items-center justify-center mb-6 text-brand-gold">
                <Sparkles size={28} />
              </div>
              <h4 className="font-serif text-xl font-semibold mb-3">2. Bagru & Sanganer Printing</h4>
              <p className="text-xs md:text-sm text-gray-300 font-light leading-relaxed">
                Hand-pressed block printing using natural local dyes and hand-carved wooden blocks. Each imprint is beautifully unique.
              </p>
            </div>

            <div className="flex flex-col items-center p-4">
              <div className="h-16 w-16 rounded-full bg-white/5 border border-brand-gold/30 flex items-center justify-center mb-6 text-brand-gold">
                <Sparkles size={28} />
              </div>
              <h4 className="font-serif text-xl font-semibold mb-3">3. Hand-tied Bandhani</h4>
              <p className="text-xs md:text-sm text-gray-300 font-light leading-relaxed">
                Tie-dye craft where fabrics are folded and tightly bound with thread in intricate patterns before dye baths, showing beautiful speckled patterns.
              </p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 8. Customer Love / Testimonial Slider */}
      {sectionSettings.showCustomerLove && (
        <section className="py-20 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <span className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase text-center block mb-2">ROYAL REVIEWS</span>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-16 text-brand-primary">
          Customer Love
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm relative">
            <Quote className="absolute top-6 right-6 text-brand-gold/10 h-12 w-12" />
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-brand-gold fill-brand-gold" />
              ))}
            </div>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">
              "The Royale Jaipur Saree exceeded all expectations! The Gota Patti border is so neat and authentic. It felt like wearing a piece of Rajasthani palace history."
            </p>
            <div className="font-semibold text-xs tracking-wider uppercase text-brand-primary">Aditi Rao - Delhi</div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm relative">
            <Quote className="absolute top-6 right-6 text-brand-gold/10 h-12 w-12" />
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-brand-gold fill-brand-gold" />
              ))}
            </div>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">
              "Absolutely love the Sanganeri palazzo set. It is incredibly comfortable and lightweight, and the handblock prints are gorgeous. Looking forward to buying more."
            </p>
            <div className="font-semibold text-xs tracking-wider uppercase text-brand-primary">Priya Sharma - Bangalore</div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm relative">
            <Quote className="absolute top-6 right-6 text-brand-gold/10 h-12 w-12" />
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-brand-gold fill-brand-gold" />
              ))}
            </div>
            <p className="text-sm text-gray-600 font-light leading-relaxed mb-6">
              "The Zardozi bridal lehenga was the star of my wedding reception! The embroidery details are flawless. Truly luxury quality at highly reasonable pricing."
            </p>
            <div className="font-semibold text-xs tracking-wider uppercase text-brand-primary">Kiran Kanwar - Jaipur</div>
          </div>
        </div>
      </section>
      )}

      {/* 9. Instagram Gallery / Luxury Catalog Show */}
      {sectionSettings.showInstagram && (
        <section className="py-12 border-t border-brand-gold/10 w-full bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-12 text-center mb-10">
          <span className="text-[10px] font-bold tracking-[0.3em] text-brand-gold uppercase block mb-2">SOCIAL GALLERY</span>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-brand-primary">Styled in Royalty</h2>
          <p className="text-xs text-gray-500 font-light mt-1">Tag @MradhulFashion in your gorgeous outfits near historical destinations.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-2 max-w-[1400px] mx-auto">
          <div className="h-64 relative group overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600" 
              alt="Jaipur Heritage Style" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold tracking-widest uppercase">
              View Look
            </div>
          </div>
          <div className="h-64 relative group overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600" 
              alt="Jaipur Heritage Style" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold tracking-widest uppercase">
              View Look
            </div>
          </div>
          <div className="h-64 relative group overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600" 
              alt="Jaipur Heritage Style" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold tracking-widest uppercase">
              View Look
            </div>
          </div>
          <div className="h-64 relative group overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=600" 
              alt="Jaipur Heritage Style" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold tracking-widest uppercase">
              View Look
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 10. Welcome Collection Callout */}
      {sectionSettings.showPromo && (
        <section className="my-8 max-w-7xl mx-auto px-4 md:px-12 w-full">
        <div className="relative rounded-3xl overflow-hidden shadow-xl h-80 md:h-[350px]">
          <img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200" alt="Promo collection" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/95 via-brand-primary/45 to-transparent flex flex-col justify-center px-8 md:px-16 text-white max-w-xl">
            <span className="text-xs font-bold tracking-[0.25em] text-brand-goldLight uppercase mb-2">MAJESTIC INITIATION</span>
            <h3 className="font-serif text-3xl md:text-5xl font-semibold leading-tight mb-4">The Royal Welcome</h3>
            <p className="text-xs md:text-sm text-brand-beige font-light mb-6">Receive a custom luxury welcome gift of 15% off your first purchase. Use code <span className="font-bold text-white tracking-widest bg-white/10 px-2 py-0.5 rounded">WELCOMELUXE</span> at checkout.</p>
            <Link href="/products" className="bg-white text-brand-primary hover:bg-brand-cream text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-full inline-block shadow-md w-max transition-colors">
              Begin Shopping
            </Link>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
