import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreConfig, selectStoreName, selectStoreId, selectIsModuleActive } from '../../features/store/storeSlice';
import ProductCard from '../../components/common/ProductCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { cloudinaryHeroUrl, cloudinaryCardUrl } from '../../utils/cloudinaryUrl';

const DigitalLayout = () => {
  const navigate = useNavigate();
  const storeName = useSelector(selectStoreName);
  const storeConfig = useSelector(selectStoreConfig);
  const storeId = useSelector(selectStoreId);
  const isPreviewActive = useSelector(selectIsModuleActive('previewModal'));

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const CAT_PILLS = ['Templates', 'eBooks', 'Software', 'Courses', 'Audio'];

  useEffect(() => {
    const fetchDigitalData = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/api/v1/products?storeId=${storeId}&limit=12`);
        if (res.success) {
          setProducts(res.products || []);
        }
      } catch (err) {
        console.error('Failed to load digital layout products', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDigitalData();
  }, [storeId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handlePreviewTrigger = (productName) => {
    toast.success(`Opening instant preview for: ${productName}`);
  };

  return (
    <div className="space-y-16 pb-16 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-150">
      {/* 1. HERO - VALUE PROPOSITION */}
      <section className="relative py-16 md:py-24 bg-gray-50 dark:bg-[#121212] border-b border-gray-100 dark:border-gray-900 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <span className="text-[10px] tracking-widest uppercase font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-1 rounded-full">
            Instant Delivery
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-none">
            Buy once. <br className="hidden sm:inline" />
            <span className="text-indigo-600 dark:text-indigo-400">Download instantly.</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Discover premium digital assets, templates, PDFs, and courses created by industry experts.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center bg-white dark:bg-[#1f1f1f] rounded-xl shadow border border-gray-200 dark:border-gray-800 p-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates, ebooks, files..."
              className="w-full px-4 py-2 bg-transparent text-xs text-gray-800 dark:text-white outline-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {CAT_PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => navigate(`/shop?category=${encodeURIComponent(pill)}`)}
                className="bg-white hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 text-[10px] font-bold text-gray-650 dark:text-gray-450 px-4 py-1.5 rounded-full transition-colors"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-16">
        {/* 2. FEATURED PRODUCTS GRID */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-950 pb-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">Featured Digital Assets</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Top-rated creations</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-xs text-gray-500">No assets available.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product._id} className="relative group">
                  {/* File Type overlay badge */}
                  <span className="absolute top-2.5 right-12 z-20 bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow uppercase">
                    {product.dynamicFields?.fileType || 'ZIP'}
                  </span>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. NEW RELEASES */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">Just Added</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Newly published releases</p>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-4 md:gap-6 pb-2 scrollbar-none">
            {isLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="w-[240px] flex-shrink-0">
                    <SkeletonCard />
                  </div>
                ))
              : products.slice(0, 8).map((product) => (
                  <div key={product._id} className="w-[240px] flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section className="border-t border-gray-100 dark:border-gray-950 pt-12 text-center space-y-8">
          <h2 className="text-lg font-bold">How ShopWave Downloads Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl">🔍</div>
              <h3 className="text-xs font-bold text-gray-800 dark:text-white">1. Select Asset</h3>
              <p className="text-[10px] text-gray-400 max-w-xs mx-auto">Browse courses, software, or templates matching your needs.</p>
            </div>
            <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-950 pt-6 sm:pt-0">
              <div className="text-3xl">💳</div>
              <h3 className="text-xs font-bold text-gray-800 dark:text-white">2. Complete Checkout</h3>
              <p className="text-[10px] text-gray-400 max-w-xs mx-auto">Purchase securely via local wallets or online banking.</p>
            </div>
            <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-950 pt-6 sm:pt-0">
              <div className="text-3xl">⚡</div>
              <h3 className="text-xs font-bold text-gray-800 dark:text-white">3. Get Download Link</h3>
              <p className="text-[10px] text-gray-400 max-w-xs mx-auto">Links will be emailed instantly and saved under your orders profile.</p>
            </div>
          </div>
        </section>

        {/* 5. TRY BEFORE YOU BUY (Preview modal triggers) */}
        {isPreviewActive && products.length > 0 && (
          <section className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-150/30 dark:border-indigo-900/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg font-bold">Need to preview the template?</h3>
              <p className="text-xs text-gray-500 font-medium max-w-md">
                Click on the preview buttons below to examine templates, watch course intros, or listen to audio snippets before purchasing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {products.slice(0, 2).map((product) => (
                <button
                  key={product._id}
                  onClick={() => handlePreviewTrigger(product.name)}
                  className="bg-white border border-gray-200 text-gray-750 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
                >
                  👁️ {product.name.split(' ')[0]} Preview
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Performance: passive scroll listener handled globally
export default React.memo(DigitalLayout);
