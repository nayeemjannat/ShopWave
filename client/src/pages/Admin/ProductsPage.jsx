import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreId } from '../../features/store/storeSlice';
import ProductCard from '../../components/common/ProductCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

export const ProductsPage = () => {
  const storeId = useSelector(selectStoreId);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async (page = 1, { signal } = {}) => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const params = { storeId, page, limit: 12 };
      if (search.trim()) params.q = search.trim();
      const res = await axiosInstance.get('/api/v1/products', { params, signal });
      if (res.success) {
        setProducts(res.products || []);
        setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(1, { signal: controller.signal });
    return () => controller.abort();
  }, [storeId]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await axiosInstance.delete(`/api/v1/products/${id}`);
      toast.success('Product deleted');
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Products</h1>
        <Link
          to="/admin/products/new"
          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-grow px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none"
        />
        <button
          type="submit"
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">📦</span>
          <p className="text-sm text-gray-500">No products found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p._id} className="relative group">
                <ProductCard product={p} />
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Link
                    to={`/admin/products/${p._id}/edit`}
                    className="bg-white dark:bg-gray-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-gray-200 dark:border-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="bg-white dark:bg-gray-900 text-red-500 text-xs font-bold px-2 py-1 rounded-md shadow-sm border border-gray-200 dark:border-gray-800 hover:bg-red-50 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchProducts(pagination.page - 1)}
                className="border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: pagination.pages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => fetchProducts(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    pagination.page === idx + 1
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchProducts(pagination.page + 1)}
                className="border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;
