import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsModuleActive } from '../../features/store/storeSlice';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const ComparisonPage = () => {
  const isCompareActive = useSelector(selectIsModuleActive('comparison'));
  const [products, setProducts] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('shopwave_compare') || '[]');
      setProducts(stored);
    } catch {
      setProducts([]);
    }
  }, []);

  const removeProduct = (id) => {
    const updated = products.filter(p => p._id !== id);
    localStorage.setItem('shopwave_compare', JSON.stringify(updated));
    setProducts(updated);
    toast.success('Removed from comparison');
  };

  const clearAll = () => {
    localStorage.removeItem('shopwave_compare');
    setProducts([]);
    toast.success('Comparison list cleared');
  };

  if (!isCompareActive) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <span className="text-4xl mb-4">🔒</span>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Comparison Not Available</h2>
        <p className="text-sm text-gray-500">This store has not enabled the product comparison feature.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <span className="text-4xl mb-4">📋</span>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No Products to Compare</h2>
        <p className="text-sm text-gray-500 mb-4">Select up to 4 products from the shop to compare them side by side.</p>
        <Link to="/shop" className="bg-primary text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors">
          Go to Shop
        </Link>
      </div>
    );
  }

  // Collect all unique attribute keys from all products
  const allKeys = Array.from(
    new Set(
      products.flatMap(p => (p.dynamicFields ? Object.keys(p.dynamicFields) : []))
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Compare Products</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{products.length} of 4 selected</span>
          <button
            onClick={clearAll}
            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white dark:bg-[#151515] rounded-2xl shadow-sm overflow-hidden">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-40">Feature</th>
              {products.map((p) => (
                <th key={p._id} className="p-4 text-center min-w-[200px] border-l border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => removeProduct(p._id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <img
                    src={p.images?.[0] || 'https://via.placeholder.com/150'}
                    alt={p.name}
                    className="w-full h-36 object-cover rounded-lg mb-3"
                  />
                  <Link
                    to={`/product/${p._id}/${p.slug || 'product'}`}
                    className="text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-primary transition-colors line-clamp-2"
                  >
                    {p.name}
                  </Link>
                  <p className="text-lg font-black text-primary mt-2">{formatPrice(p.price)}</p>
                  <Link
                    to={`/product/${p._id}/${p.slug || 'product'}`}
                    className="mt-3 inline-block bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    View Details
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price Row */}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</td>
              {products.map((p) => (
                <td key={p._id} className="p-4 text-center text-sm font-black text-gray-900 dark:text-white border-l border-gray-100 dark:border-gray-800">
                  {formatPrice(p.flashSale?.isActive ? p.flashSale.salePrice : p.price)}
                </td>
              ))}
            </tr>

            {/* Rating Row */}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rating</td>
              {products.map((p) => (
                <td key={p._id} className="p-4 text-center border-l border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-center gap-1 text-amber-500 text-sm">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx}>{idx < Math.round(p.ratings?.average || 0) ? '★' : '☆'}</span>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">({p.numOfReviews || 0})</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Stock Row */}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stock</td>
              {products.map((p) => (
                <td key={p._id} className={`p-4 text-center text-xs font-bold border-l border-gray-100 dark:border-gray-800 ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {p.stock > 0 ? `In Stock (${p.stock})` : 'Out of Stock'}
                </td>
              ))}
            </tr>

            {/* Dynamic Fields Rows */}
            {allKeys.map((key) => (
              <tr key={key} className="border-b border-gray-50 dark:border-gray-900">
                <td className="p-3 text-xs font-bold text-gray-400 capitalize">{key}</td>
                {products.map((p) => {
                  const val = p.dynamicFields?.[key];
                  return (
                    <td key={p._id} className="p-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 border-l border-gray-100 dark:border-gray-800">
                      {val !== undefined && val !== null ? String(val) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonPage;
