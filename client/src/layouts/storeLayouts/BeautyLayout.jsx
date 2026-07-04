import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreConfig, selectStoreName, selectStoreId, selectIsModuleActive } from '../../features/store/storeSlice';
import ProductCard from '../../components/common/ProductCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import FlashSaleTimer from '../../components/storefront/FlashSaleTimer';
import axiosInstance from '../../utils/axiosInstance';
import { cloudinaryHeroUrl, cloudinaryCardUrl } from '../../utils/cloudinaryUrl';

const BeautyLayout = () => {
  const navigate = useNavigate();
  const storeName = useSelector(selectStoreName);
  const storeConfig = useSelector(selectStoreConfig);
  const storeId = useSelector(selectStoreId);

  // Module checks
  const isSkinQuizActive = useSelector(selectIsModuleActive('skinTypeFilter'));
  const isIngredientActive = useSelector(selectIsModuleActive('ingredientList'));
  const isRoutineBuilderActive = useSelector(selectIsModuleActive('routineBuilder'));

  const [bestsellers, setBestsellers] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [ingredientProducts, setIngredientProducts] = useState([]);
  const [routineTab, setRoutineTab] = useState('morning');
  const [isLoading, setIsLoading] = useState(true);

  const CONCERNS = [
    { name: 'Acne & Blemish', slug: 'acne', color: 'bg-emerald-50 text-emerald-800' },
    { name: 'Anti-Aging', slug: 'anti-aging', color: 'bg-rose-50 text-rose-800' },
    { name: 'Brightening', slug: 'brightening', color: 'bg-amber-50 text-amber-800' },
    { name: 'Hydration', slug: 'hydration', color: 'bg-blue-50 text-blue-800' },
    { name: 'Sun Protection', slug: 'sun-protection', color: 'bg-orange-50 text-orange-850' }
  ];

  useEffect(() => {
    const fetchBeautyData = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        const [bestRes, flashRes, allRes] = await Promise.all([
          axiosInstance.get(`/api/v1/products?storeId=${storeId}&sort=rating&limit=8`),
          axiosInstance.get(`/api/v1/products?storeId=${storeId}&flashSale=true&limit=4`),
          axiosInstance.get(`/api/v1/products?storeId=${storeId}&limit=12`)
        ]);

        if (bestRes.success) setBestsellers(bestRes.products || []);
        if (flashRes.success) setFlashSaleProducts(flashRes.products || []);
        if (allRes.success) {
          // Extract products containing Vitamin C or Niacinamide as a mockup for ingredient spotlight
          setIngredientProducts((allRes.products || []).slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load beauty layout products', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeautyData();
  }, [storeId]);

  const heroImage = storeConfig?.bannerImages?.[0] || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1400&auto=format&fit=crop';
  const flashSaleEndTime = flashSaleProducts[0]?.flashSale?.endsAt;

  return (
    <div className="space-y-16 pb-16 bg-pink-50/15 dark:bg-[#0d0709] text-gray-800 dark:text-gray-200">
      {/* 1. SKIN TYPE QUIZ HERO OR STANDARD SLIDER */}
      {isSkinQuizActive ? (
        <section className="relative w-full py-16 bg-gradient-to-r from-rose-100 to-teal-50 dark:from-rose-950/20 dark:to-teal-950/20 flex items-center">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <span className="text-[10px] tracking-widest uppercase font-bold text-rose-500">Skincare Consultation</span>
            <h1 className="text-3xl md:text-5xl font-serif text-gray-900 dark:text-white leading-tight">
              Find Your Perfect Self-Care Routine
            </h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Select your skin type below to discover dermatologist-recommended formulations tailored to your concern.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
              {['Oily', 'Dry', 'Combination', 'Sensitive'].map((type) => (
                <button
                  key={type}
                  onClick={() => navigate(`/shop?skinType=${type}`)}
                  className="bg-white dark:bg-gray-900 border border-rose-100 dark:border-rose-950 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/25 p-4 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-200"
                >
                  ✨ {type} Skin
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative w-full h-[400px] md:h-[480px] overflow-hidden flex items-center bg-gray-100 dark:bg-[#1a1315]">
          <div className="absolute inset-0 bg-black/10 z-10"></div>
          <img
            src={heroImage}
            alt="Beauty Banner"
            className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
          />
          <div className="max-w-7xl mx-auto px-4 w-full relative z-20 space-y-4 text-center sm:text-left text-white sm:text-gray-900 dark:sm:text-white">
            <h1 className="text-4xl md:text-5xl font-serif leading-none max-w-md">
              Radiant Skin <br />
              Starts Here.
            </h1>
            <p className="text-xs md:text-sm text-white/90 sm:text-gray-600 dark:sm:text-gray-400 max-w-sm">
              Discover authentic skincare essentials sourced globally for healthy, glowing skin.
            </p>
            <div className="pt-2">
              <Link
                to="/shop"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-3 rounded-full transition-colors shadow-md shadow-rose-600/10"
              >
                Shop Collection
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 space-y-16">
        {/* 2. BESTSELLERS ROW */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-rose-100/50 dark:border-rose-950/30 pb-3">
            <div>
              <h2 className="text-xl font-serif text-gray-900 dark:text-white">Customer Favorites ⭐</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Top-rated best sellers</p>
            </div>
            <Link to="/shop?sort=rating" className="text-xs font-bold text-rose-500 hover:underline">
              View All
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 md:gap-6 pb-2 scrollbar-none">
            {isLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="w-[240px] flex-shrink-0">
                    <SkeletonCard />
                  </div>
                ))
              : bestsellers.map((product) => (
                  <div key={product._id} className="w-[240px] flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>
        </section>

        {/* 3. CONCERN-BASED CATEGORIES */}
        <section className="space-y-6">
          <h2 className="text-center text-xl font-serif tracking-wide text-gray-900 dark:text-white">Shop by Skin Concern</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CONCERNS.map((concern) => (
              <div
                key={concern.slug}
                onClick={() => navigate(`/shop?concern=${encodeURIComponent(concern.name)}`)}
                className={`p-6 rounded-2xl text-center cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 ${concern.color} flex flex-col items-center justify-center`}
              >
                <span className="text-xs font-bold tracking-wide">{concern.name}</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70 mt-2">Browse →</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. FLASH SALE */}
        {flashSaleProducts.length > 0 && (
          <section className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/10 dark:to-orange-950/10 border border-rose-100/50 dark:border-rose-900/40 rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-100/30 pb-4">
              <div className="space-y-1">
                <h2 className="text-base font-serif text-rose-800 dark:text-rose-400">Self-Care Sunday Sale</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Limited time offers on premium brands</p>
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

        {/* 5. INGREDIENT SPOTLIGHT */}
        {isIngredientActive && ingredientProducts.length > 0 && (
          <section className="space-y-6 bg-white dark:bg-[#120e10] p-6 rounded-2xl border border-rose-100/30 dark:border-rose-950/20 shadow-sm">
            <div className="text-center space-y-2">
              <span className="text-[10px] tracking-widest uppercase font-bold text-teal-600">Ingredient Spotlight</span>
              <h3 className="text-xl font-serif text-gray-900 dark:text-white">Active Ingredient: Niacinamide</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Known for minimizing pores, strengthening skin barriers, and regulating excess oil. Experience target formulations.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {ingredientProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 6. ROUTINE BUILDER CTA */}
        {isRoutineBuilderActive && (
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif text-gray-900 dark:text-white">Build Your Skincare Routine</h2>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Dermatologist recommended application order</p>
            </div>
            <div className="flex justify-center gap-4 border-b border-rose-100/50 dark:border-rose-950/30 max-w-xs mx-auto pb-2">
              <button
                onClick={() => setRoutineTab('morning')}
                className={`text-xs font-bold tracking-wider uppercase pb-1.5 border-b-2 ${
                  routineTab === 'morning' ? 'border-rose-500 text-rose-500' : 'border-transparent text-gray-400'
                }`}
              >
                ☀️ Morning
              </button>
              <button
                onClick={() => setRoutineTab('night')}
                className={`text-xs font-bold tracking-wider uppercase pb-1.5 border-b-2 ${
                  routineTab === 'night' ? 'border-rose-500 text-rose-500' : 'border-transparent text-gray-400'
                }`}
              >
                🌙 Night
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 relative before:absolute before:left-0 before:right-0 before:top-1/2 before:h-0.5 before:bg-rose-100/50 dark:before:bg-rose-950/20 before:-z-10 hidden md:grid">
              {[
                { step: '1', name: 'Cleanse', icon: '🧼', desc: 'Wash away impurities' },
                { step: '2', name: 'Tone', icon: '💧', desc: 'Balance pH levels' },
                { step: '3', name: 'Treat', icon: '🧪', desc: 'Target serums' },
                { step: '4', name: 'Moisturize', icon: '🧴', desc: 'Seal in hydration' },
                { step: '5', name: 'Protect', icon: '🛡️', desc: 'SPF coverage' }
              ].map((step) => (
                <div key={step.step} className="bg-white dark:bg-[#120e10] p-4 rounded-xl border border-rose-50 dark:border-rose-950 text-center shadow-sm relative space-y-1">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                    {step.step}
                  </div>
                  <span className="text-2xl block pt-2">{step.icon}</span>
                  <h4 className="text-xs font-bold">{step.name}</h4>
                  <p className="text-[9px] text-gray-400">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. TRUST CERTIFICATIONS */}
        <section className="bg-white dark:bg-[#120e10] border border-rose-100/30 dark:border-rose-950/20 rounded-2xl p-6 flex flex-wrap justify-around items-center text-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">👩‍⚕️</span>
            <span className="text-xs font-bold text-gray-500">Dermatologist Tested</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🐰</span>
            <span className="text-xs font-bold text-gray-500">Cruelty Free</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <span className="text-xs font-bold text-gray-500">Organic Ingredients</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span className="text-xs font-bold text-gray-500">Paraben Free</span>
          </div>
        </section>
      </div>
    </div>
  );
};

// Performance: passive scroll listener handled globally
export default React.memo(BeautyLayout);
