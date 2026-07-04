import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreConfig, selectStoreName, selectStoreId, selectIsModuleActive } from '../../features/store/storeSlice';
import ProductCard from '../../components/common/ProductCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import FlashSaleTimer from '../../components/storefront/FlashSaleTimer';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { cloudinaryHeroUrl, cloudinaryCardUrl } from '../../utils/cloudinaryUrl';

const ClothingLayout = () => {
  const navigate = useNavigate();
  const storeName = useSelector(selectStoreName);
  const storeConfig = useSelector(selectStoreConfig);
  const storeId = useSelector(selectStoreId);
  const isFitGuideActive = useSelector(selectIsModuleActive('fitGuide') || selectIsModuleActive('routineBuilder'));

  const [products, setProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const TABS = ['All', 'Tops', 'Bottoms', 'Dresses', 'Accessories'];

  useEffect(() => {
    const fetchClothingData = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        const [productsRes, flashRes] = await Promise.all([
          axiosInstance.get(`/api/v1/products?storeId=${storeId}&limit=12`),
          axiosInstance.get(`/api/v1/products?storeId=${storeId}&flashSale=true&limit=4`)
        ]);

        if (productsRes.success) setProducts(productsRes.products || []);
        if (flashRes.success) setFlashSaleProducts(flashRes.products || []);
      } catch (err) {
        console.error('Failed to load clothing layout products', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClothingData();
  }, [storeId]);

  // Handle Tab change for Trending Now
  const getFilteredProducts = () => {
    if (activeTab === 'All') return products.slice(0, 8);
    return products.filter(p => p.category?.toLowerCase().includes(activeTab.toLowerCase())).slice(0, 8);
  };

  const heroImage = storeConfig?.bannerImages?.[0] || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&auto=format&fit=crop';
  const flashSaleEndTime = flashSaleProducts[0]?.flashSale?.endsAt;

  return (
    <div className="space-y-16 pb-16 bg-white dark:bg-[#0c0c0c] text-gray-800 dark:text-gray-200">
      {/* 1. FULL-SCREEN HERO */}
      <section className="relative w-full h-[80vh] md:h-screen overflow-hidden flex items-center bg-gray-50 dark:bg-[#151515]">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <img
          src={heroImage}
          alt="Fashion Lookbook Hero"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />

        <div className="max-w-7xl mx-auto px-4 w-full relative z-20 text-center text-white space-y-6">
          <p className="text-xs tracking-[0.3em] uppercase font-bold text-white/95">
            New Season Collection
          </p>
          <h1 className="text-5xl md:text-7xl font-serif tracking-tight max-w-3xl mx-auto leading-none">
            {storeName || 'The Apparel Co.'}
          </h1>
          <p className="text-xs md:text-sm text-white/80 max-w-md mx-auto tracking-wide">
            Carefully curated essentials designed to harmonize elegance, style, and seasonal comfort.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <button
              onClick={() => navigate('/shop?category=Women')}
              className="bg-white text-gray-900 font-bold text-xs tracking-wider px-8 py-3 rounded-full hover:bg-gray-100 transition-colors shadow-md"
            >
              Shop Women
            </button>
            <button
              onClick={() => navigate('/shop?category=Men')}
              className="bg-transparent text-white font-bold text-xs tracking-wider px-8 py-3 rounded-full border border-white hover:bg-white/10 transition-colors"
            >
              Shop Men
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-16">
        {/* 2. CATEGORY STRIPS */}
        <section className="space-y-6">
          <h2 className="text-center text-xl font-serif italic tracking-wide text-gray-900 dark:text-white">Shop by Department</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Women', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop' },
              { name: 'Men', img: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=600&auto=format&fit=crop' },
              { name: 'Kids', img: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=600&auto=format&fit=crop' },
              { name: 'Accessories', img: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=600&auto=format&fit=crop' }
            ].map((cat) => (
              <div
                key={cat.name}
                onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
                className="group relative h-[300px] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300 z-10"></div>
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-6 left-6 z-20 text-white">
                  <h3 className="text-lg font-serif font-bold tracking-wider">{cat.name}</h3>
                  <p className="text-[10px] tracking-wider uppercase font-semibold text-white/80 mt-1">Explore Department →</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. NEW COLLECTION */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-serif tracking-tight text-gray-900 dark:text-white">The New Arrivals</h2>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Selected pieces for your seasonal lookbook</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-xs text-center text-gray-500">No new arrivals listed yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* 4. FLASH SALE (Soft styling) */}
        {flashSaleProducts.length > 0 && (
          <section className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-100 dark:border-amber-900/30 pb-4">
              <div className="space-y-1">
                <h2 className="text-base font-serif italic text-amber-800 dark:text-amber-500">Limited Season Offers</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Special discounts on premium apparel</p>
              </div>
              {flashSaleEndTime && <FlashSaleTimer endsAt={flashSaleEndTime} />}
            </div>

            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-2 scrollbar-none">
              {isLoading
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="w-[240px] flex-shrink-0">
                      <SkeletonCard />
                    </div>
                  ))
                : flashSaleProducts.map((product) => (
                    <div key={product._id} className="w-[240px] flex-shrink-0">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </div>
          </section>
        )}

        {/* 5. STYLE GUIDE / OUTFIT BUILDER */}
        {isFitGuideActive && (
          <section className="relative rounded-2xl overflow-hidden min-h-[300px] flex items-center p-6 md:p-12 bg-gray-100 dark:bg-[#151515] border border-gray-150 dark:border-gray-900">
            <div className="md:w-1/2 space-y-4 text-center md:text-left">
              <span className="text-[10px] tracking-widest uppercase font-bold text-secondary">Fit & Styling Guide</span>
              <h3 className="text-2xl font-serif tracking-tight text-gray-900 dark:text-white">Build Your Signature Look</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium max-w-sm">
                Confused about measurements, fits, or size guides? Check out our size guide and curate your seasonal fits with ease.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => toast.success('Size guide opening soon!')}
                  className="bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold px-6 py-2.5 rounded-full transition-colors shadow-sm"
                >
                  Open Fit Guide
                </button>
              </div>
            </div>
            <div className="hidden md:block absolute right-12 top-6 bottom-6 w-1/3 rounded-xl overflow-hidden shadow">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop"
                alt="Styling"
                className="w-full h-full object-cover"
              />
            </div>
          </section>
        )}

        {/* 6. TRENDING NOW */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 gap-4">
            <div>
              <h2 className="text-xl font-serif text-gray-900 dark:text-white">Trending Now</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Top-voted styles of the week</p>
            </div>
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ${
                    activeTab === tab
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-500 dark:bg-gray-950 dark:hover:bg-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)}
            </div>
          ) : getFilteredProducts().length === 0 ? (
            <p className="text-xs text-center text-gray-500 py-6">No products available in this category.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {getFilteredProducts().map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* 7. WHY APPAREL */}
        <section className="border-t border-gray-100 dark:border-gray-900 pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-3">
            <h4 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">🌿 Sustainable Materials</h4>
            <p className="text-[10px] text-gray-400 mt-1">Ethically sourced and environment friendly fabrics</p>
          </div>
          <div className="p-3 border-t border-gray-50 sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-900">
            <h4 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">🧵 Perfect Stitching</h4>
            <p className="text-[10px] text-gray-400 mt-1">Meticulously crafted premium details</p>
          </div>
          <div className="p-3 border-t border-gray-50 sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-900">
            <h4 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">🚚 Free Shipping</h4>
            <p className="text-[10px] text-gray-400 mt-1">Complimentary delivery for orders above 3000 BDT</p>
          </div>
        </section>
      </div>
    </div>
  );
};

// Performance: passive scroll listener handled globally
export default React.memo(ClothingLayout);
