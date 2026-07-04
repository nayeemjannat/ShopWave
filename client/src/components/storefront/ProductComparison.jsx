import React from 'react';
import { useDispatch } from 'react-redux';
import { addItemToCart } from '../../features/cart/cartSlice';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const ProductComparison = ({ products = [], onRemove }) => {
  const dispatch = useDispatch();

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-550 dark:text-gray-400 text-xs font-semibold">
        No products selected for comparison. Add products from the shop to start comparing.
      </div>
    );
  }

  // Get all unique dynamic field keys across all products
  const dynamicKeys = Array.from(
    new Set(
      products.flatMap(p => (p.dynamicFields ? Object.keys(p.dynamicFields) : []))
    )
  );

  // Helper to find index of best value
  const getBestPriceIndex = () => {
    let minVal = Infinity;
    let minIdx = -1;
    products.forEach((p, idx) => {
      const activePrice = p.flashSale?.isActive ? p.flashSale.salePrice : p.price;
      if (activePrice < minVal) {
        minVal = activePrice;
        minIdx = idx;
      }
    });
    return minIdx;
  };

  const getBestRatingIndex = () => {
    let maxVal = -1;
    let maxIdx = -1;
    products.forEach((p, idx) => {
      const rating = p.ratings?.average || 0;
      if (rating > maxVal) {
        maxVal = rating;
        maxIdx = idx;
      }
    });
    return maxIdx;
  };

  const getBestStockIndex = () => {
    let maxVal = -1;
    let maxIdx = -1;
    products.forEach((p, idx) => {
      const stock = p.stock || 0;
      if (stock > maxVal) {
        maxVal = stock;
        maxIdx = idx;
      }
    });
    return maxIdx;
  };

  const bestPriceIdx = getBestPriceIndex();
  const bestRatingIdx = getBestRatingIndex();
  const bestStockIdx = getBestStockIndex();

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    dispatch(addItemToCart({ productId: product._id, quantity: 1 }))
      .unwrap()
      .then(() => {
        toast.success(`${product.name.split(' ')[0]} added to cart!`);
      })
      .catch((err) => {
        toast.error(err || 'Failed to add item to cart');
      });
  };

  return (
    <div className="w-full overflow-x-auto border border-gray-150 dark:border-gray-900 rounded-2xl bg-white dark:bg-[#151515] shadow-sm">
      <table className="w-full table-fixed border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-150 dark:border-gray-900">
            {/* Attribute Label Column */}
            <th className="w-40 p-4 font-bold text-left bg-gray-50/50 dark:bg-gray-950/20 text-gray-500">
              Product details
            </th>
            {products.map((product) => (
              <th key={product._id} className="p-4 text-center relative border-l border-gray-100 dark:border-gray-900 min-w-[200px]">
                {onRemove && (
                  <button
                    onClick={() => onRemove(product._id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                    title="Remove from comparison"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <div className="flex flex-col items-center gap-2 mt-2">
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/100'}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg bg-gray-50 border border-gray-100 dark:border-gray-800"
                  />
                  <span className="font-bold text-gray-900 dark:text-white line-clamp-2 text-center h-10 px-2">
                    {product.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
          {/* Price Row */}
          <tr>
            <td className="p-4 font-bold bg-gray-50/50 dark:bg-gray-950/20 text-gray-500">
              Price
            </td>
            {products.map((p, idx) => {
              const activePrice = p.flashSale?.isActive ? p.flashSale.salePrice : p.price;
              const isBest = idx === bestPriceIdx && products.length > 1;
              return (
                <td
                  key={p._id}
                  className={`p-4 text-center font-bold border-l border-gray-100 dark:border-gray-900 ${
                    isBest ? 'bg-green-50/50 dark:bg-green-950/10 text-green-600 dark:text-green-400 font-black' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {formatPrice(activePrice)}
                  {isBest && <span className="block text-[9px] font-semibold text-green-550 dark:text-green-400 mt-0.5">Best Price</span>}
                </td>
              );
            })}
          </tr>

          {/* Rating Row */}
          <tr>
            <td className="p-4 font-bold bg-gray-50/50 dark:bg-gray-950/20 text-gray-500">
              Rating
            </td>
            {products.map((p, idx) => {
              const ratingVal = p.ratings?.average || 0;
              const isBest = idx === bestRatingIdx && ratingVal > 0 && products.length > 1;
              return (
                <td
                  key={p._id}
                  className={`p-4 text-center border-l border-gray-100 dark:border-gray-900 ${
                    isBest ? 'bg-green-50/50 dark:bg-green-950/10' : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-amber-500">
                      {'★'.repeat(Math.round(ratingVal))}
                      {'☆'.repeat(5 - Math.round(ratingVal))}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {ratingVal.toFixed(1)} ({p.ratings?.count || 0} reviews)
                    </span>
                  </div>
                </td>
              );
            })}
          </tr>

          {/* Stock Row */}
          <tr>
            <td className="p-4 font-bold bg-gray-50/50 dark:bg-gray-950/20 text-gray-500">
              Availability
            </td>
            {products.map((p, idx) => {
              const inStock = p.stock > 0;
              const isBest = idx === bestStockIdx && inStock && products.length > 1;
              return (
                <td
                  key={p._id}
                  className={`p-4 text-center border-l border-gray-100 dark:border-gray-900 ${
                    isBest ? 'bg-green-50/50 dark:bg-green-950/10' : ''
                  }`}
                >
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inStock ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                  }`}>
                    {inStock ? `In Stock (${p.stock})` : 'Out of Stock'}
                  </span>
                </td>
              );
            })}
          </tr>

          {/* Dynamic Fields Rows */}
          {dynamicKeys.map((key) => (
            <tr key={key}>
              <td className="p-4 font-bold bg-gray-50/50 dark:bg-gray-950/20 text-gray-500 capitalize">
                {key}
              </td>
              {products.map((p) => {
                const val = p.dynamicFields?.[key];
                return (
                  <td
                    key={p._id}
                    className="p-4 text-center border-l border-gray-100 dark:border-gray-900 text-gray-700 dark:text-gray-300 font-medium"
                  >
                    {val !== undefined && val !== null ? String(val) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Action Row */}
          <tr className="border-t border-gray-150 dark:border-gray-900">
            <td className="p-4 bg-gray-50/50 dark:bg-gray-950/20"></td>
            {products.map((product) => (
              <td key={product._id} className="p-4 text-center border-l border-gray-100 dark:border-gray-900">
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={product.stock <= 0}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    product.stock <= 0
                      ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-800'
                      : 'bg-primary hover:bg-primary-hover text-white shadow-sm'
                  }`}
                >
                  {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ProductComparison;
