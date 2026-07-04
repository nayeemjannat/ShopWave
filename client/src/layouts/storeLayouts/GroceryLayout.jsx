import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectStoreConfig, selectStoreName, selectStoreId, selectIsModuleActive } from '../../features/store/storeSlice';
import { addItemToCart } from '../../features/cart/cartSlice';
import ProductCard from '../../components/common/ProductCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import FlashSaleTimer from '../../components/storefront/FlashSaleTimer';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { cloudinaryHeroUrl, cloudinaryCardUrl } from '../../utils/cloudinaryUrl';

const GroceryLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const storeName = useSelector(selectStoreName);
  const storeConfig = useSelector(selectStoreConfig);
  const storeId = useSelector(selectStoreId);

  const isDeliverySlotActive = useSelector(selectIsModuleActive('deliverySlot'));
  const isNutritionActive = useSelector(selectIsModuleActive('nutritionInfo'));

  const [products, setProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('Dhaka');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const CATEGORIES = [
    { name: 'Vegetables', icon: '🥬', slug: 'vegetables' },
    { name: 'Fruits', icon: '🍎', slug: 'fruits' },
    { name: 'Dairy & Eggs', icon: '🥛', slug: 'dairy' },
    { name: 'Meat & Fish', icon: '🥩', slug: 'meat-fish' },
    { name: 'Bakery', icon: '🍞', slug: 'bakery' },
    { name: 'Snacks', icon: '🍿', slug: 'snacks' },
    { name: 'Beverages', icon: '🥤', slug: 'beverages' },
    { name: 'Household', icon: '🧹', slug: 'household' }
  ];

  useEffect(() => {
    const fetchGroceryData = async () => {
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
        console.error('Failed to load grocery layout products', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroceryData();
  }, [storeId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAddBundleToCart = () => {
    // Mock bundle addition - select up to 3 grocery items from list
    const bundleItems = products.slice(0, 3);
    if (bundleItems.length === 0) {
      toast.error('No products available to add');
      return;
    }
    
    Promise.all(
      bundleItems.map(item => dispatch(addItemToCart({ productId: item._id, quantity: 1 })))
    )
      .then(() => {
        toast.success('Weekly Grocery Bundle added to cart!');
      })
      .catch(() => {
        toast.error('Failed to add bundle to cart');
      });
  };

  const heroImage = storeConfig?.bannerImages?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1400&auto=format&fit=crop';
  const flashSaleEndTime = flashSaleProducts[0]?.flashSale?.endsAt;

  return (
    <div className="space-y-16 pb-16 bg-green-50/5 dark:bg-[#060c08] text-gray-800 dark:text-gray-200">
      {/* 1. DELIVERY SLOT HERO */}
      <section className="relative w-full py-16 md:py-24 bg-gradient-to-r from-emerald-100 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <span className="text-[10px] tracking-widest uppercase font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
            🚀 2-Hour Express Delivery
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
            Fresh Groceries <br className="hidden sm:inline" />
            Delivered Straight to Your Door
          </h1>

          {/* Location Selector & Search form */}
          <div className="bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            {isDeliverySlotActive && (
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 outline-none border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800"
              >
                <option value="Dhaka">Dhaka City</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
              </select>
            )}
            <form onSubmit={handleSearchSubmit} className="flex-grow flex items-center pr-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fresh vegetables, dairy, or essential grocery items..."
                className="w-full px-4 py-2 bg-transparent text-xs text-gray-900 dark:text-white outline-none placeholder-gray-400"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-colors shadow-sm"
              >
                Search
              </button>
            </form>
          </div>

          <div className="text-[11px] text-gray-500 font-semibold flex items-center justify-center gap-2">
            <span>Trending searches:</span>
            <Link to="/shop?q=onion" className="text-emerald-600 underline">Onion</Link>
            <Link to="/shop?q=milk" className="text-emerald-600 underline">Milk</Link>
            <Link to="/shop?q=oil" className="text-emerald-600 underline">Cooking Oil</Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-16">
        {/* 2. CATEGORY QUICK ACCESS */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-gray-400">Popular Categories</h2>
          <div className="flex overflow-x-auto gap-4 pb-3 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="flex-shrink-0 flex flex-col items-center group w-20 text-center"
              >
                <div className="w-14 h-14 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-full flex items-center justify-center text-2xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/20 group-hover:scale-105 transition-all duration-200 shadow-sm">
                  {cat.icon}
                </div>
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 mt-2 truncate max-w-full group-hover:text-emerald-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. FLASH DEALS (Grid) */}
        {flashSaleProducts.length > 0 && (
          <section className="space-y-6 bg-emerald-50/20 dark:bg-emerald-950/5 p-6 rounded-2xl border border-emerald-100/30 dark:border-emerald-950/20">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100/20 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏰</span>
                <div>
                  <h2 className="text-base font-bold text-emerald-800 dark:text-emerald-400">Today's Hot Deals</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Prices expire tonight</p>
                </div>
              </div>
              {flashSaleEndTime && <FlashSaleTimer endsAt={flashSaleEndTime} />}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {isLoading
                ? Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)
                : flashSaleProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
            </div>
          </section>
        )}

        {/* 4. FRESH ARRIVALS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Just Stocked Today</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Freshness Guaranteed from local farms</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)
            ) : products.length === 0 ? (
              <p className="text-xs text-gray-500">No fresh products found.</p>
            ) : (
              products.slice(0, 8).map((product) => (
                <div key={product._id} className="relative group">
                  {/* Freshness Badge overlay */}
                  <span className="absolute top-2.5 right-12 z-20 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    Fresh 🥬
                  </span>
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* 5. BUNDLE DEALS */}
        {products.length > 2 && (
          <section className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md text-white">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] uppercase font-extrabold bg-white/20 border border-white/30 px-3 py-0.5 rounded-full tracking-wider">Weekly Bundle Pack</span>
              <h3 className="text-xl font-bold">Weekly Family Grocery Bundle</h3>
              <p className="text-xs text-white/80 font-medium max-w-md">
                Get a pre-selected combination of seasonal vegetables, high-grade local rice, and fresh dairy items. Save up to 15% overall!
              </p>
            </div>
            <button
              onClick={handleAddBundleToCart}
              className="bg-white text-emerald-800 font-bold text-xs px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow"
            >
              Add Bundle to Cart
            </button>
          </section>
        )}

        {/* 6. NUTRITION DIETARY PREFERENCE */}
        {isNutritionActive && (
          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-extrabold text-gray-500">Shop by Dietary Preference</h2>
            <div className="flex flex-wrap gap-3">
              {['Vegan', 'Keto / Low-Carb', 'Diabetic-Friendly', 'Organic Certified', 'Gluten-Free'].map((diet) => (
                <button
                  key={diet}
                  onClick={() => navigate(`/shop?tag=${encodeURIComponent(diet)}`)}
                  className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-800 px-5 py-2 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-150"
                >
                  🥗 {diet}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 7. TRUST STRIP */}
        <section className="bg-white dark:bg-[#121613] border border-green-100/30 dark:border-green-950/20 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-2">
            <h4 className="text-xs font-bold text-gray-850 dark:text-white uppercase tracking-wider">💧 100% Hygienic</h4>
            <p className="text-[10px] text-gray-400 mt-1">Processed under strict safety measures</p>
          </div>
          <div className="p-2 border-t border-gray-50 sm:border-t-0 sm:border-l border-green-50/50 dark:border-green-950/10">
            <h4 className="text-xs font-bold text-gray-850 dark:text-white uppercase tracking-wider">🚚 2 Hour Delivery</h4>
            <p className="text-[10px] text-gray-400 mt-1">Fast delivery within Dhaka city limits</p>
          </div>
          <div className="p-2 border-t border-gray-50 sm:border-t-0 sm:border-l border-green-50/50 dark:border-green-950/10">
            <h4 className="text-xs font-bold text-gray-850 dark:text-white uppercase tracking-wider">🔄 Easy Replacements</h4>
            <p className="text-[10px] text-gray-400 mt-1">No-questions replacement for quality items</p>
          </div>
        </section>
      </div>
    </div>
  );
};

// Performance: passive scroll listener handled globally
export default React.memo(GroceryLayout);
