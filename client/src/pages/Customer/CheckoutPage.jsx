import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectCartTotal, clearCartLocal } from '../../features/cart/cartSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectStoreId, selectStoreConfig } from '../../features/store/storeSlice';
import { formatPrice } from '../../utils/formatters';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const STEPS = ['Shipping', 'Delivery', 'Payment', 'Review'];

const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {STEPS.map((step, idx) => {
      const stepNum = idx + 1;
      const isActive = stepNum === currentStep;
      const isDone = stepNum < currentStep;
      return (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
              isDone ? 'bg-secondary border-secondary text-white'
              : isActive ? 'bg-primary border-primary text-white'
              : 'bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-400'
            }`}>
              {isDone ? '✓' : stepNum}
            </div>
            <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-primary' : isDone ? text-secondary : 'text-gray-400'}`}>
              {step}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`flex-grow h-0.5 max-w-16 mx-1 mb-5 ${isDone ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-800'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const user = useSelector(selectCurrentUser);
  const storeId = useSelector(selectStoreId);
  const storeConfig = useSelector(selectStoreConfig);

  const { discount = 0, appliedCoupon = null, shippingFee: passedShipping = 60, grandTotal: passedTotal } = location.state || {};

  const [step, setStep] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Step 1: Shipping Address
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    streetAddress: '',
    city: 'Dhaka',
    district: '',
    postalCode: ''
  });

  // Step 2: Shipping Method
  const [shippingMethod, setShippingMethod] = useState('standard');
  const shippingOptions = [
    { id: 'standard', label: 'Standard Delivery', fee: 60, eta: '3–5 days' },
    { id: 'express', label: 'Express Delivery', fee: 120, eta: '1–2 days' }
  ];
  const selectedShipping = shippingOptions.find(s => s.id === shippingMethod);
  const finalShippingFee = cartTotal >= 1000 ? 0 : (selectedShipping?.fee || 60);

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const codFee = paymentMethod === 'cod' ? 20 : 0;
  const loyaltyPoints = Math.floor((cartTotal / 100) * 5); // 5 points per 100 BDT

  const finalTotal = cartTotal - discount + finalShippingFee + codFee;

  const handleAddressChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!address.fullName.trim()) { toast.error('Full name is required'); return false; }
    if (!address.phone.trim()) { toast.error('Phone number is required'); return false; }
    if (!address.streetAddress.trim()) { toast.error('Address is required'); return false; }
    if (!address.city.trim()) { toast.error('City is required'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const orderPayload = {
        items: cartItems.map(item => ({
          product: item.product?._id || item.product,
          quantity: item.quantity,
          price: item.price || item.product?.price
        })),
        shippingAddress: address,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        storeId,
        shippingMethod,
        shippingFee: finalShippingFee
      };

      const res = await axiosInstance.post('/api/v1/orders', orderPayload);

      if (res.success) {
        dispatch(clearCartLocal());

        if (paymentMethod === 'sslcommerz' && res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          toast.success('Order placed successfully!');
          navigate(`/order-success?id=${res.order?._id || res.order?.orderNumber}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0 && step < 4) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white mb-6">Checkout</h1>
      <StepIndicator currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Step Content */}
        <div className="lg:col-span-2 bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-6 shadow-sm">

          {/* STEP 1: Shipping Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-900">
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: 'fullName', label: 'Full Name', placeholder: 'Your full name', type: 'text' },
                  { field: 'phone', label: 'Phone Number', placeholder: '01XXXXXXXXX', type: 'tel' },
                  { field: 'city', label: 'City', placeholder: 'Dhaka', type: 'text' },
                  { field: 'district', label: 'District', placeholder: 'Dhaka District', type: 'text' },
                  { field: 'postalCode', label: 'Postal Code', placeholder: '1207', type: 'text' },
                ].map(({ field, label, placeholder, type }) => (
                  <div key={field}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={address[field]}
                      onChange={(e) => handleAddressChange(field, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Street Address</label>
                  <textarea
                    rows="2"
                    value={address.streetAddress}
                    onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                    placeholder="House/Road/Area details..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping Method */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-900">
                Delivery Method
              </h2>
              {cartTotal >= 1000 && (
                <div className="bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-900/30 p-3 rounded-xl text-xs text-green-700 dark:text-green-400 font-semibold">
                  🎉 You qualify for FREE shipping!
                </div>
              )}
              <div className="space-y-3">
                {shippingOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      shippingMethod === opt.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={opt.id}
                        checked={shippingMethod === opt.id}
                        onChange={() => setShippingMethod(opt.id)}
                        className="text-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{opt.label}</p>
                        <p className="text-[10px] text-gray-400">{opt.eta}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                      {cartTotal >= 1000 ? <span className="text-green-600">FREE</span> : formatPrice(opt.fee)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-900">
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'sslcommerz' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-800'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="sslcommerz"
                    checked={paymentMethod === 'sslcommerz'}
                    onChange={() => setPaymentMethod('sslcommerz')}
                    className="text-primary mt-0.5"
                  />
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Online Payment</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">bKash, Nagad, VISA, MasterCard, Mobile Banking</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {['bKash', 'Nagad', 'VISA', 'Mastercard'].map(m => (
                        <span key={m} className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-[9px] font-bold px-2 py-1 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-800'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-primary mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Cash on Delivery</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Pay when delivered. +৳20 COD handling fee applies.</p>
                  </div>
                </label>
              </div>

              {/* Loyalty Point Preview */}
              <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-150 dark:border-amber-900/30 p-3 rounded-xl flex items-center gap-2">
                <span className="text-lg">🌟</span>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  You'll earn <strong>{loyaltyPoints} loyalty points</strong> from this order!
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Place Order */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-900">
                Review Your Order
              </h2>

              {/* Summary blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-900">
                  <p className="font-bold text-gray-400 uppercase tracking-widest mb-2">Shipping To</p>
                  <p className="font-bold text-gray-900 dark:text-white">{address.fullName}</p>
                  <p className="text-gray-500">{address.phone}</p>
                  <p className="text-gray-500">{address.streetAddress}</p>
                  <p className="text-gray-500">{address.city}, {address.postalCode}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-900">
                  <p className="font-bold text-gray-400 uppercase tracking-widest mb-2">Payment</p>
                  <p className="font-bold text-gray-900 dark:text-white capitalize">
                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (SSLCommerz)'}
                  </p>
                  <p className="font-bold text-gray-400 uppercase tracking-widest mt-3 mb-1">Delivery</p>
                  <p className="font-bold text-gray-900 dark:text-white capitalize">{shippingMethod} — {selectedShipping?.eta}</p>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-3 border-t border-gray-100 dark:border-gray-900 pt-4">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <img
                      src={item.product?.images?.[0] || 'https://via.placeholder.com/40'}
                      alt={item.product?.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 dark:border-gray-800"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{item.product?.name}</p>
                      <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {formatPrice((item.price || item.product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100 dark:border-gray-900">
            {step > 1 ? (
              <button
                onClick={() => setStep(prev => prev - 1)}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-8 py-3 rounded-xl shadow transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="bg-secondary hover:opacity-95 text-white font-bold text-sm px-8 py-3 rounded-xl shadow transition-all disabled:opacity-60"
              >
                {isPlacingOrder ? '⏳ Placing Order...' : '✓ Place Order'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-5 shadow-sm h-fit space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Order Summary</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Items ({cartItems.length})</span><span className="font-bold">{formatPrice(cartTotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span className="font-bold">−{formatPrice(discount)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-bold">{finalShippingFee === 0 ? 'FREE' : formatPrice(finalShippingFee)}</span></div>
            {codFee > 0 && <div className="flex justify-between"><span className="text-gray-500">COD Fee</span><span className="font-bold">{formatPrice(codFee)}</span></div>}
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-900 pt-3 font-black text-sm">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-primary">{formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
