import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreId } from '../../features/store/storeSlice';
import ProductCard from '../../components/common/ProductCard';
import { SkeletonGrid } from '../../components/common/SkeletonCard';
import axiosInstance from '../../utils/axiosInstance';

export const ShopPage = () => {
  const storeId = useSelector(selectStoreId);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Read URL query params
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const sortParam = searchParams.get('sort') || '';
  const pageParam = searchParams.get('page') || '1';
  const queryParam = searchParams.get('q') || '';
  const ratingParam = searchParams.get('rating') || '';
  const inStockParam = searchParams.get('inStock') || '';
  const viewParam = searchParams.get('view') || 'grid';

  const viewMode = viewParam === 'list' ? 'list' : 'grid';

  // Local states
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // Selected categories/brands as sets for checkbox behavior
  const selectedCategories = useMemo(() => new Set(categoryParam ? categoryParam.split(',') : []), [categoryParam]);
  const selectedBrands = useMemo(() => new Set(brandParam ? brandParam.split(',') : []), [brandParam]);

  const sidebarSearchRef = useRef(null);
  const [sidebarSearchTimeout, setSidebarSearchTimeout] = useState(null);

  // Count per category/brand for display
  const [categoryCounts, setCategoryCounts] = useState({});
  const [brandCounts, setBrandCounts] = useState({});

  // Sync inputs with URL changes
  useEffect(() => {
    setMinPriceInput(minPriceParam);
    setMaxPriceInput(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  // Fetch unique categories & brands for sidebar filters
  useEffect(() => {
    const controller = new AbortController();
    const fetchFilterOptions = async () => {
      if (!storeId) return;
      try {
        const res = await axiosInstance.get(`/api/v1/products?storeId=${storeId}&limit=200`, { signal: controller.signal });
        if (res.success && res.products) {
          const catMap = {};
          const brandMap = {};
          res.products.forEach(p => {
            if (p.category) {
              catMap[p.category] = (catMap[p.category] || 0) + 1;
            }
            if (p.brand) {
              brandMap[p.brand] = (brandMap[p.brand] || 0) + 1;
            }
          });
          setCategories(Object.keys(catMap));
          setBrands(Object.keys(brandMap));
          setCategoryCounts(catMap);
          setBrandCounts(brandMap);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Failed to load filter options', err);
      }
    };
    fetchFilterOptions();
    return () => controller.abort();
  }, [storeId]);

  // Fetch products based on active filters
  useEffect(() => {
    const controller = new AbortController();
    const fetchFilteredProducts = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        const params = {
          storeId,
          page: pageParam,
          limit: 12,
          isActive: true
        };

        if (categoryParam) params.category = categoryParam;
        if (brandParam) params.brand = brandParam;
        if (minPriceParam) params.minPrice = minPriceParam;
        if (maxPriceParam) params.maxPrice = maxPriceParam;
        if (sortParam) params.sort = sortParam;
        if (queryParam) params.q = queryParam;
        if (ratingParam) params.rating = ratingParam;
        if (inStockParam === 'true') params.inStock = 'true';

        const endpoint = queryParam ? '/api/v1/products/search' : '/api/v1/products';
        const res = await axiosInstance.get(endpoint, { params, signal: controller.signal });

        if (res.success) {
          setProducts(res.products || []);
          setPagination(res.pagination || { page: 1, pages: 1, total: res.products?.length || 0 });
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Products fetch error', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredProducts();
    return () => controller.abort();
  }, [storeId, categoryParam, brandParam, minPriceParam, maxPriceParam, sortParam, pageParam, queryParam, ratingParam, inStockParam]);

  const updateFilters = useCallback((key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', '1');

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const toggleFilterArray = useCallback((key, value) => {
    const current = searchParams.get(key) || '';
    const arr = current ? current.split(',') : [];
    const idx = arr.indexOf(value);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(value);
    }
    const next = arr.join(',');
    updateFilters(key, next);
  }, [searchParams, updateFilters]);

  const handlePriceApply = useCallback((e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', '1');

    if (minPriceInput) nextParams.set('minPrice', minPriceInput);
    else nextParams.delete('minPrice');

    if (maxPriceInput) nextParams.set('maxPrice', maxPriceInput);
    else nextParams.delete('maxPrice');

    setSearchParams(nextParams);
  }, [searchParams, minPriceInput, maxPriceInput, setSearchParams]);

  const handleClearAll = useCallback(() => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams(new URLSearchParams({ page: '1' }));
  }, [setSearchParams]);

  const handlePageChange = useCallback((pageNum) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(pageNum));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  const handleSidebarSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSidebarSearch(value);
    if (sidebarSearchTimeout) clearTimeout(sidebarSearchTimeout);
    const timeout = setTimeout(() => {
      updateFilters('q', value);
    }, 300);
    setSidebarSearchTimeout(timeout);
  }, [sidebarSearchTimeout, updateFilters]);

  const handleBrandSearchChange = useCallback((e) => {
    setBrandSearch(e.target.value);
  }, []);

  const toggleViewMode = useCallback((mode) => {
    const nextParams = new URLSearchParams(searchParams);
    if (mode === 'list') {
      nextParams.set('view', 'list');
    } else {
      nextParams.delete('view');
    }
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    return !!(categoryParam || brandParam || minPriceParam || maxPriceParam || queryParam || ratingParam || inStockParam);
  }, [categoryParam, brandParam, minPriceParam, maxPriceParam, queryParam, ratingParam, inStockParam]);

  // Pagination with max 10 pages
  const paginationRange = useMemo(() => {
    const total = pagination.pages;
    const current = pagination.page;
    if (total <= 10) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const half = 4;
    let start = Math.max(1, current - half);
    let end = Math.min(total, current + half);
    if (end - start < 9) {
      if (start === 1) {
        end = Math.min(total, start + 9);
      } else if (end === total) {
        start = Math.max(1, end - 9);
      }
    }
    const range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return { range, start, end, total, showStartEllipsis: start > 2, showEndEllipsis: end < total - 1 };
  }, [pagination.pages, pagination.page]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return brands;
    return brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [brands, brandSearch]);

  const filteredCategories = useMemo(() => {
    if (!sidebarSearch) return categories;
    return categories.filter(c => c.toLowerCase().includes(sidebarSearch.toLowerCase()));
  }, [categories, sidebarSearch]);

  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Search in results */}
      <div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={sidebarSearch}
            onChange={handleSidebarSearchChange}
            placeholder="Search in results..."
            className="input-field text-xs pl-9 pr-3 py-2 w-full"
          />
        </div>
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClearAll}
          className="text-xs font-bold text-danger hover:text-danger/80 transition-colors"
        >
          Clear All Filters
        </button>
      )}

      {/* Category Filter */}
      <div>
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Categories</h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {filteredCategories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isChecked = selectedCategories.has(cat);
            return (
              <label key={cat} className="flex items-center gap-2 text-xs font-semibold cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFilterArray('category', cat)}
                  className="custom-checkbox"
                />
                <span className={`flex-1 ${isChecked ? 'text-primary font-bold' : 'text-ink group-hover:text-primary'}`}>
                  {cat}
                </span>
                {count > 0 && (
                  <span className="text-[10px] text-muted font-medium">({count})</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div className="border-t border-border pt-5">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Brands</h3>
          {brands.length > 6 && (
            <div className="mb-2">
              <input
                type="text"
                value={brandSearch}
                onChange={handleBrandSearchChange}
                placeholder="Search brands..."
                className="input-field text-xs px-3 py-1.5 w-full"
              />
            </div>
          )}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {filteredBrands.map((brand) => {
              const count = brandCounts[brand] || 0;
              const isChecked = selectedBrands.has(brand);
              return (
                <label key={brand} className="flex items-center gap-2 text-xs font-semibold cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilterArray('brand', brand)}
                    className="custom-checkbox"
                  />
                  <span className={`flex-1 ${isChecked ? 'text-primary font-bold' : 'text-ink group-hover:text-primary'}`}>
                    {brand}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] text-muted font-medium">({count})</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Rating Filter */}
      <div className="border-t border-border pt-5">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Rating</h3>
        <div className="space-y-2">
          {[
            { value: '4', label: '4★ & above' },
            { value: '3', label: '3★ & above' },
            { value: '2', label: '2★ & above' },
            { value: '', label: 'Any rating' },
          ].map((opt) => (
            <label key={opt.value || 'any'} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={ratingParam === opt.value || (!ratingParam && opt.value === '')}
                onChange={() => updateFilters('rating', opt.value || '')}
                className="w-3.5 h-3.5 text-primary focus:ring-primary"
              />
              <span className={ratingParam === opt.value ? 'text-primary font-bold' : 'text-ink'}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* In Stock Only */}
      <div className="border-t border-border pt-5">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-bold text-ink">In Stock Only</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={inStockParam === 'true'}
              onChange={(e) => updateFilters('inStock', e.target.checked ? 'true' : '')}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-ghost border border-border rounded-full peer-checked:bg-primary peer-checked:border-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
          </div>
        </label>
      </div>

      {/* Price Range Filter */}
      <div className="border-t border-border pt-5">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Price Range</h3>
        <form onSubmit={handlePriceApply} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="input-field text-xs px-3 py-1.5 w-full"
            />
            <span className="text-muted text-xs">—</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="input-field text-xs px-3 py-1.5 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setMinPriceInput(''); setMaxPriceInput(''); }}
              className="btn-secondary btn-sm flex-1"
            >
              Clear
            </button>
            <button
              type="submit"
              className="btn-primary btn-sm flex-1"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderProductGridView = () => (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 contain-layout">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} showCompare={true} />
      ))}
    </div>
  );

  const renderProductListView = () => (
    <div className="space-y-4">
      {products.map((product) => (
        <div
          key={product._id}
          onClick={() => navigate(`/product/${product._id}`)}
          className="flex gap-4 lg:gap-6 bg-surface border border-border rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
        >
          <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-xl overflow-hidden bg-ghost flex-shrink-0">
            <img
              src={product.images?.[0] || 'https://via.placeholder.com/200'}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <h3 className="text-sm font-bold text-ink truncate">{product.name}</h3>
              <p className="text-xs text-muted mt-1 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-price font-black text-primary">{product.discountedPrice || product.price} BDT</span>
              <span className="text-xs text-muted">{product.brand}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const isArray = Array.isArray(paginationRange);
    const range = isArray ? paginationRange : paginationRange.range;
    const showStartEllipsis = !isArray && paginationRange.showStartEllipsis;
    const showEndEllipsis = !isArray && paginationRange.showEndEllipsis;

    return (
      <div className="flex justify-center items-center gap-1.5 border-t border-border pt-6">
        <button
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
          className="btn-secondary btn-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>
        {!isArray && showStartEllipsis && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="w-8 h-8 rounded-lg text-xs font-bold text-muted hover:bg-ghost transition-colors"
            >
              1
            </button>
            <span className="text-muted text-xs px-1">...</span>
          </>
        )}
        {range.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
              pagination.page === pageNum
                ? 'bg-primary text-white shadow-btn'
                : 'text-ink hover:bg-ghost border border-border'
            }`}
          >
            {pageNum}
          </button>
        ))}
        {!isArray && showEndEllipsis && (
          <>
            <span className="text-muted text-xs px-1">...</span>
            <button
              onClick={() => handlePageChange(paginationRange.total)}
              className="w-8 h-8 rounded-lg text-xs font-bold text-muted hover:bg-ghost transition-colors"
            >
              {paginationRange.total}
            </button>
          </>
        )}
        <button
          disabled={pagination.page === pagination.pages}
          onClick={() => handlePageChange(pagination.page + 1)}
          className="btn-secondary btn-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          Next
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Banner/Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-ink uppercase tracking-tight">Shop Products</h1>
          {queryParam && (
            <p className="text-xs text-muted mt-1">Search results for "{queryParam}"</p>
          )}
        </div>

        {/* Top bar: count, sort, view toggle */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            <span className="text-xs font-bold text-muted hidden sm:inline">
              {pagination.total} {pagination.total === 1 ? 'Product' : 'Products'}
            </span>
          )}

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden btn-secondary btn-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
          </button>

          <select
            value={sortParam}
            onChange={(e) => updateFilters('sort', e.target.value)}
            className="input-field text-xs font-bold px-3 py-2 w-auto"
          >
            <option value="">Sort: Latest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-surface text-muted hover:bg-ghost'}`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
              </svg>
            </button>
            <button
              onClick={() => toggleViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-surface text-muted hover:bg-ghost'}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block bg-surface border border-border p-5 rounded-2xl shadow-card h-fit sticky top-20">
          <SidebarContent />
        </aside>

        {/* Products Area */}
        <div className="md:col-span-3 space-y-8">
          {!isLoading && (
            <span className="text-xs font-bold text-muted md:hidden">
              {pagination.total} {pagination.total === 1 ? 'Product' : 'Products'}
            </span>
          )}

          {isLoading ? (
            <SkeletonGrid count={12} cols={viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} />
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-surface border border-border rounded-2xl shadow-card">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-sm font-bold text-ink mt-3">No products found</h3>
              <p className="text-xs text-muted mt-1">Try clearing your filters or search with another term.</p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="btn-primary btn-md mt-4"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? renderProductGridView() : renderProductListView()}
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          ></div>
          <div className="relative flex flex-col w-72 bg-surface h-full shadow-modal p-6 z-10 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Filters</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-md text-muted hover:bg-ghost"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
