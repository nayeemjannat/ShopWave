import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreName, selectActiveModules, selectStoreConfig, selectStoreSlug } from '../../features/store/storeSlice';
import axiosInstance from '../../utils/axiosInstance';
import ProductCard from '../../components/common/ProductCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import useCountdown from '../../hooks/useCountdown';

const BRANDS = ['Samsung', 'Apple', 'Xiaomi', 'Realme', 'Oppo', 'Vivo', 'OnePlus', 'Others'];

const CATEGORIES = [
  { name: 'Smartphones', slug: 'smartphones', icon: '📱' },
  { name: 'Laptops',     slug: 'laptops',     icon: '💻' },
  { name: 'Tablets',     slug: 'tablets',     icon: '🖥️' },
  { name: 'Accessories', slug: 'accessories', icon: '🎧' },
  { name: 'Cameras',     slug: 'cameras',     icon: '📷' },
  { name: 'TV & Audio',  slug: 'tv-audio',    icon: '📺' },
];

// Flash sale countdown
const FlashSaleTimer = ({ endsAt }) => {
  const { hours, minutes, seconds, expired } = useCountdown(endsAt);
  if (expired) return null;
  const pad = n => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1">
      {[[pad(hours),'H'],[pad(minutes),'M'],[pad(seconds),'S']].map(([val, unit]) => (
        <div key={unit} className="flex flex-col items-center">
          <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-md min-w-[32px] text-center">{val}</span>
          <span className="text-[8px] font-bold text-red-400 mt-0.5">{unit}</span>
        </div>
      ))}
    </div>
  );
};

const ElectronicsLayout = () => {
  const navigate = useNavigate();
  const storeName   = useSelector(selectStoreName);
  const activeModules = useSelector(selectActiveModules) || [];
  const config      = useSelector(selectStoreConfig);

  const storeSlug   = useSelector(selectStoreSlug);

  const isFlashActive   = activeModules.includes('flashSale');
  const isCompareActive = activeModules.includes('comparison');

  const [featuredProducts, setFeaturedProducts]   = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [newArrivals, setNewArrivals]             = useState([]);
  const [isLoading, setIsLoading]                 = useState(true);

  const heroImage = config?.bannerImages?.[0] ||
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1400&auto=format&fit=crop';

  useEffect(() => {
    const controller = new AbortController();
    const storeId    = config?.storeId;

    const fetchAll = async () => {
      try {
        const params = (storeId && storeSlug !== 'demo') ? `&storeId=${storeId}` : '';
        const [featuredRes, flashRes, newRes] = await Promise.all([
          axiosInstance.get(`/api/v1/products?isFeatured=true&limit=8${params}`, { signal: controller.signal }),
          axiosInstance.get(`/api/v1/products?flashSale=true&limit=6${params}`,  { signal: controller.signal }),
          axiosInstance.get(`/api/v1/products?sort=newest&limit=6${params}`,     { signal: controller.signal }),
        ]);
        setFeaturedProducts(featuredRes.products  || []);
        setFlashSaleProducts(flashRes.products    || []);
        setNewArrivals(newRes.products            || []);
      } catch (err) {
        if (err.name !== 'CanceledError') console.error('ElectronicsLayout fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
    return () => controller.abort();
  }, [config?.storeId, storeSlug]);

  const flashSaleEndTime = flashSaleProducts[0]?.flashSale?.endsAt;

  return (
    /* PRD 5.1: hero dark, rest clean white */
    <div className="bg-white text-gray-900 min-h-screen pb-16">

      {/* ── 1. HERO — dark overlay, tech-forward ────────────────── */}
      <section className="relative w-full h-[420px] md:h-[520px] overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-black/55 z-10" />
        <img
          src={heroImage}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          loading="eager"
        />
        {/* subtle tech-grid accent */}
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:14px_24px]" />

        <div className="max-w-7xl mx-auto px-6 w-full relative z-20 space-y-5">
          <span className="inline-block text-[10px] uppercase tracking-widest font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-3 py-1 rounded-full">
            NEW ARRIVALS
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-2xl leading-none">
            Next-Gen Tech,<br />
            <span style={{ color: 'var(--primary, #4B44B0)' }}>Delivered Fast</span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-lg font-medium">
            Explore latest phones, laptops &amp; accessories
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/shop"
              className="text-white font-bold text-sm px-7 py-3 rounded-xl transition-all shadow-lg"
              style={{ backgroundColor: 'var(--primary, #4B44B0)' }}
            >
              Shop Now →
            </Link>
            {isCompareActive && (
              <Link
                to="/compare"
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-7 py-3 rounded-xl border border-white/20 transition-all"
              >
                Compare Models
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-14 mt-12">

        {/* ── 2. BRAND FILTER ROW ──────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Popular Brands</h2>
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {BRANDS.map(brand => (
              <button
                key={brand}
                onClick={() => navigate(`/shop?brand=${encodeURIComponent(brand)}`)}
                className="flex-shrink-0 bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary px-5 py-2 rounded-full text-xs font-bold text-gray-600 hover:text-primary transition-all duration-150"
              >
                {brand}
              </button>
            ))}
          </div>
        </section>

        {/* ── 3. FLASH SALE ────────────────────────────────────── */}
        {isFlashActive && flashSaleProducts.length > 0 && (
          <section className="bg-red-50 border border-red-100 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <h2 className="text-base font-black text-red-600 uppercase tracking-tight">Flash Deals</h2>
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Limited-time pricing</p>
                </div>
              </div>
              {flashSaleEndTime && <FlashSaleTimer endsAt={flashSaleEndTime} />}
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-[230px] flex-shrink-0"><SkeletonCard /></div>)
                : flashSaleProducts.map(p => (
                    <div key={p._id} className="w-[230px] flex-shrink-0">
                      <ProductCard product={p} showCompare={isCompareActive} />
                    </div>
                  ))
              }
            </div>
          </section>
        )}

        {/* ── 4. CATEGORY GRID ─────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Shop by Category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all group"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-[11px] font-bold text-gray-600 group-hover:text-primary transition-colors">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 5. FEATURED PRODUCTS ─────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Top Picks This Week</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Handpicked featured gadgets</p>
            </div>
            <Link to="/shop" className="text-xs font-bold hover:underline" style={{ color: 'var(--primary, #4B44B0)' }}>
              View All →
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm font-bold text-gray-400">No featured products yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Go to <Link to="/admin/products/new" className="underline" style={{ color: 'var(--primary)' }}>Admin → Products → Add New</Link> and tick "Featured Product"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featuredProducts.map(p => <ProductCard key={p._id} product={p} showCompare={isCompareActive} />)}
            </div>
          )}
        </section>

        {/* ── 6. COMPARISON BANNER ─────────────────────────────── */}
        {isCompareActive && (
          <section
            className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--primary, #4B44B0), #6C63FF)' }}
          >
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black">Confused about specs?</h3>
              <p className="text-xs text-white/80 max-w-sm">Compare up to 4 models side-by-side on specs, processor, battery, and price.</p>
            </div>
            <Link to="/compare" className="bg-white text-gray-900 font-bold text-xs px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm">
              Compare Now →
            </Link>
          </section>
        )}

        {/* ── 7. NEW ARRIVALS ──────────────────────────────────── */}
        {newArrivals.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">New Arrivals</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Freshly stocked latest releases</p>
              </div>
              <Link to="/shop?sort=newest" className="text-xs font-bold hover:underline" style={{ color: 'var(--primary, #4B44B0)' }}>
                See All →
              </Link>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-[230px] flex-shrink-0"><SkeletonCard /></div>)
                : newArrivals.map(p => (
                    <div key={p._id} className="w-[230px] flex-shrink-0">
                      <ProductCard product={p} showCompare={isCompareActive} />
                    </div>
                  ))
              }
            </div>
          </section>
        )}

        {/* ── 8. TRUST STRIP ───────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🛡️', title: 'Official Warranty', desc: '100% brand warranty' },
            { icon: '📦', title: 'Genuine Products',  desc: 'Guaranteed authentic' },
            { icon: '🚀', title: 'Fast Delivery',     desc: 'Same / next day' },
            { icon: '🔄', title: 'Easy Returns',      desc: '7-day replacements' },
          ].map(item => (
            <div key={item.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center space-y-1.5">
              <div className="text-2xl">{item.icon}</div>
              <h4 className="text-xs font-black text-gray-800">{item.title}</h4>
              <p className="text-[10px] text-gray-400">{item.desc}</p>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
};

export default React.memo(ElectronicsLayout);
