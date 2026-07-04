import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCartItems, selectCartTotal, selectCartCount,
  updateItem, removeItem, fetchCart, clearCartLocal
} from '../../features/cart/cartSlice';
import { selectStoreId } from '../../features/store/storeSlice';
import { formatPrice } from '../../utils/formatters';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING = 60;

export const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const cartCount = useSelector(selectCartCount);
  const storeId = useSelector(selectStoreId);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const shippingFee = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const grandTotal = cartTotal - discount + shippingFee;

  const handleQuantityChange = (item, newQty) => {
    if (newQty < 1) return;
    dispatch(updateItem({ itemId: item._id, quantity: newQty }))
      .unwrap()
      .catch(() => toast.error('Failed to update quantity'));
  };

  const handleRemove = (itemId) => {
    setRemovingId(itemId);
    dispatch(removeItem(itemId))
      .unwrap()
      .then(() => toast.success('Item removed from cart'))
      .catch(() => toast.error('Failed to remove item'))
      .finally(() => setRemovingId(null));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.error('Enter a coupon code');
    setIsApplyingCoupon(true);
    try {
      const res = await axiosInstance.post('/api/v1/orders/validate-coupon', {
        code: couponCode.trim(),
        storeId,
        cartTotal,
      });
      if (res.success && res.discount) {
        setAppliedCoupon(couponCode.trim());
        setDiscount(res.discount);
        toast.success(`Coupon applied! You saved ${formatPrice(res.discount)}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired coupon');
      setAppliedCoupon(null);
      setDiscount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  if (cartCount === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-gray-50 dark:bg-[#111]">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-3xl mb-5">
          🛒
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Your Cart is Empty</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          Looks like you haven't added anything yet. Start shopping to fill it up!
        </p>
        <Link
          to="/shop"
          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-8 py-3 rounded-xl shadow transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
        Shopping Cart <span className="text-gray-400 text-lg">({cartCount} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product || {};
            const activePrice = product.flashSale?.isActive ? product.flashSale.salePrice : (item.price || product.price || 0);
            const lineTotal = activePrice * item.quantity;
            const outOfStock = product.stock === 0;

            return (
              <div
                key={item._id}
                className={`bg-white dark:bg-[#151515] border rounded-2xl p-4 flex gap-4 shadow-sm transition-opacity ${
                  outOfStock ? 'border-red-200 dark:border-red-900/50 opacity-70' : 'border-gray-150 dark:border-gray-900'
                }`}
              >
                {/* Product Image */}
                <Link to={`/product/${product._id}/${product.slug || 'product'}`} className="flex-shrink-0">
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/80'}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-800"
                  />
                </Link>

                {/* Product Info */}
                <div className="flex-grow min-w-0 space-y-1.5">
                  <Link
                    to={`/product/${product._id}/${product.slug || 'product'}`}
                    className="text-sm font-bold text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-1"
                  >
                    {product.name || 'Unknown Product'}
                  </Link>

                  {item.variantName && (
                    <p className="text-[10px] text-gray-400 font-semibold">{item.variantName}</p>
                  )}

                  {outOfStock && (
                    <span className="inline-block bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Item no longer available
                    </span>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {/* Unit Price */}
                    <span className="text-xs text-gray-500 font-semibold">
                      {formatPrice(activePrice)} <span className="text-gray-350">each</span>
                    </span>

                    {/* Quantity Stepper */}
                    {!outOfStock && (
                      <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2.5 py-1 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-xs font-extrabold w-10 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          disabled={item.quantity >= (product.stock || 99)}
                          className="px-2.5 py-1 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Line Total */}
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      {formatPrice(lineTotal)}
                    </span>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(item._id)}
                      disabled={removingId === item._id}
                      className="text-gray-350 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/10"
                      title="Remove item"
                    >
                      {removingId === item._id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Continue Shopping */}
          <div className="pt-2">
            <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">Order Summary</h2>

            {/* Coupon Input */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Promo Code</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-900/40 p-3 rounded-xl">
                  <div>
                    <p className="text-xs font-extrabold text-green-700 dark:text-green-400">{appliedCoupon}</p>
                    <p className="text-[10px] text-green-600 dark:text-green-500">-{formatPrice(discount)} saved!</p>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-grow px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    {isApplyingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t border-gray-100 dark:border-gray-900 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Subtotal</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{formatPrice(cartTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span className="font-semibold">Coupon Discount</span>
                  <span className="font-bold">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">
                  Shipping
                  {cartTotal >= FREE_SHIPPING_THRESHOLD && (
                    <span className="ml-1 text-green-600 text-[10px]">(Free!)</span>
                  )}
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}
                </span>
              </div>
              {cartTotal < FREE_SHIPPING_THRESHOLD && (
                <p className="text-[10px] text-gray-400 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 p-2 rounded-lg">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - cartTotal)} more for free shipping!
                </p>
              )}

              <div className="flex justify-between border-t border-gray-100 dark:border-gray-900 pt-3 text-base font-black">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-primary">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout', { state: { discount, appliedCoupon, shippingFee, grandTotal } })}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow transition-colors"
            >
              Proceed to Checkout →
            </button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 font-semibold pt-1">
              <span>🔒 Secure Checkout</span>
              <span>·</span>
              <span>🚚 Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
