import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreConfig, selectStoreName, selectStoreId, selectStoreSlug } from '../../features/store/storeSlice';
import ProductCard from '../../components/common/ProductCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import FlashSaleTimer from '../../components/storefront/FlashSaleTimer';
import axiosInstance from '../../utils/axiosInstance';
import { cloudinaryHeroUrl, cloudinaryCardUrl } from '../../utils/cloudinaryUrl';

const MultiLayout = () => {
  const navigate = useNavigate();
  const storeName = useSelector(selectStoreName);
  const storeConfig = useSelector(selectStoreConfig);
  const storeId = useSelector(selectStoreId);
  const storeSlug = useSelector(selectStoreSlug);

  const [products, setProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMultiData = async () => {
      if (!storeId && storeSlug !== 'demo') return;
      setIsLoading(true);
      try {
        const params = (storeId && storeSlug !== 'demo') ? `&storeId=${storeId}` : '';
        const [productsRes, flashRes] = await Promise.all([
          axiosInstance.get(`/api/v1/products?limit=16${params}`),
          axiosInstance.get(`/api/v1/products?flashSale=true&limit=4${params}`)
        ]);

        if (productsRes.success) {
          const fetchedProducts = productsRes.products || [];
          setProducts(fetchedProducts);
          // Dynamically extract unique categories
          const uniqueCats = Array.from(new Set(fetchedProducts.map(p => p.category).filter(Boolean)));
          setCategories(uniqueCats.slice(0, 6));
        }
        if (flashRes.success) {
          setFlashSaleProducts(flashRes.products || []);
        }
      } catch (err) {
        console.error('Failed to load multi-category layout products', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMultiData();
  }, [storeId, storeSlug]);

  const heroImage = storeConfig?.bannerImages?.[0] || 'https://images.unsplash.com/photo-1472851294608-062f824d296e?q=80&w=1400&auto=format&fit=crop';
  const flashSaleEndTime = flashSaleProducts[0]?.flashSale?.endsAt;

  // Static fallback categories if empty
  const activeCategories = categories.length > 0 ? categories : ['Electronics', 'Clothing', 'Skincare', 'Grocery', 'Accessories'];

  return (
    <div className="space-y-12 pb-16 bg-gray-50 dark:bg-[#0c0c0c] text-gray-800 dark:text-gray-200">
      {/* 1. HERO WITH CATEGORY SIDEBAR */}
      <section className="max-w-7xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar (Desktop only) */}
        <div className="hidden lg:block bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-5 shadow-sm h-[380px] overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Categories</h3>
          <ul className="space-y-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {activeCategories.map((cat) => (
              <li key={cat}>
                <Link
                  to={`/shop?category=${encodeURIComponent(cat)}`}
                  className="block py-2 px-3 rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  📁 {cat}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/shop" className="block py-2 px-3 rounded-lg text-primary hover:bg-gray-50 dark:hover:bg-gray-950 font-bold border-t border-gray-100 dark:border-gray-900 mt-2">
                Browse All
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Banner Slider / Promotional Hero */}
        <div className="lg:col-span-3 h-[380px] rounded-2xl overflow-hidden relative shadow-sm border border-gray-150 dark:border-gray-900">
          <div className="absolute inset-0 bg-black/35 z-10"></div>
          <img
            src={heroImage}
            alt="Store Promotion Banner"
            className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-12 text-white space-y-4">
            <span className="text-[10px] tracking-widest uppercase font-bold text-secondary">Best Deals online</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight max-w-lg leading-none">
              Welcome to {storeName || 'ShopWave'}
            </h1>
            <p className="text-xs text-white/80 max-w-sm">
              Discover catalog deals across multiple departments. Express shopping and safe delivery guaranteed.
            </p>
            <div className="pt-2">
              <Link
                to="/shop"
                className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors shadow"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Promotional Tiles under Hero */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="text-3xl">🛡️</div>
            <div>
              <h4 className="text-xs font-bold">Secure Checkout</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">SSL Secured local payments</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="text-3xl">🚚</div>
            <div>
              <h4 className="text-xs font-bold">Fast Local Delivery</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Same-day shipping across locations</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="text-3xl">🤝</div>
            <div>
              <h4 className="text-xs font-bold">Support 24/7</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Reliable helpline support desk</p>
            </div>
          </div>
        </section>

        {/* 2. FLASH SALE SECTION */}
        {flashSaleProducts.length > 0 && (
          <section className="bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-900 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-white">Flash Sale</h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Special limited-time pricing</p>
                </div>
              </div>
              {flashSaleEndTime && <FlashSaleTimer endsAt={flashSaleEndTime} />}
            </div>

            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-2 scrollbar-none">
              {isLoading
                ? Array.from({ length: 4 }).map((_, idx) => (
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

        {/* 3. TOP CATEGORIES GRID */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-gray-400">Featured Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {activeCategories.slice(0, 5).map((cat) => (
              <Link
                key={cat}
                to={`/shop?category=${encodeURIComponent(cat)}`}
                className="bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 hover:border-primary p-5 rounded-2xl text-center shadow-sm transition-all duration-200"
              >
                <span className="text-2xl block mb-2">📁</span>
                <span className="text-xs font-bold truncate block">{cat}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. PRODUCT SECTIONS (Horizontal lists grouped by category) */}
        {activeCategories.slice(0, 2).map((categoryName) => {
          const categoryProducts = products.filter(p => p.category === categoryName);
          if (categoryProducts.length === 0) return null;

          return (
            <section key={categoryName} className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-900 pb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-white uppercase tracking-wider">{categoryName}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recommended picks</p>
                </div>
                <Link to={`/shop?category=${encodeURIComponent(categoryName)}`} className="text-xs font-bold text-primary hover:underline">
                  See All →
                </Link>
              </div>

              <div className="flex overflow-x-auto gap-4 md:gap-6 pb-2 scrollbar-none">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="w-[240px] flex-shrink-0">
                        <SkeletonCard />
                      </div>
                    ))
                  : categoryProducts.slice(0, 8).map((product) => (
                      <div key={product._id} className="w-[240px] flex-shrink-0">
                        <ProductCard product={product} />
                      </div>
                    ))}
              </div>
            </section>
          );
        })}

        {/* 5. GENERAL PRODUCTS GRID */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-900 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white uppercase tracking-wider">Just For You</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selected collections for you</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-xs text-gray-500">No products available.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Performance: passive scroll listener handled globally
export default React.memo(MultiLayout);
