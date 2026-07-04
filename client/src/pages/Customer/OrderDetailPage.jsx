import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { formatPrice, formatDate, formatOrderStatus } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/orders/${id}`);
        if (res.success) {
          setOrder(res.order);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch order details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-gray-500 mb-4">Order not found.</p>
        <Link to="/orders" className="bg-primary text-white px-5 py-2 rounded-xl text-xs font-bold">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link to="/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mb-2">
            <span>←</span> Back to Orders
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Order Details</h1>
          <p className="text-xs text-gray-500">Order ID: {order.orderNumber || order._id}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            order.status === 'Delivered'
              ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
              : order.status === 'Cancelled'
              ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
          }`}>
            {formatOrderStatus(order.status)}
          </span>
          <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#151515] rounded-xl border border-gray-100 dark:border-gray-900 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-50 dark:border-gray-900 pb-2">Items</h2>
            <div className="divide-y divide-gray-50 dark:divide-gray-900">
              {order.items?.map((item) => (
                <div key={item._id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <img
                    src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                    alt={item.product?.name}
                    className="w-16 h-16 object-cover rounded-md bg-gray-50 border border-gray-100 dark:border-gray-800"
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.product?.name || 'Unknown Product'}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPrice(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white self-center">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Status */}
          {order.statusTimeline && order.statusTimeline.length > 0 && (
            <div className="bg-white dark:bg-[#151515] rounded-xl border border-gray-100 dark:border-gray-900 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-50 dark:border-gray-900 pb-2">Status History</h2>
              <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                {order.statusTimeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 relative pl-6">
                    <div className="absolute left-[3px] top-[5px] w-[10px] h-[10px] rounded-full bg-primary border-2 border-white dark:border-black"></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{item.status}</p>
                      {item.note && <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Payment Summary */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white dark:bg-[#151515] rounded-xl border border-gray-100 dark:border-gray-900 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-50 dark:border-gray-900 pb-2">Shipping</h2>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">{order.shippingAddress?.fullName || order.user?.name}</p>
              <p>{order.shippingAddress?.phone}</p>
              <p>{order.shippingAddress?.streetAddress}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="bg-white dark:bg-[#151515] rounded-xl border border-gray-100 dark:border-gray-900 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-50 dark:border-gray-900 pb-2">Payment</h2>
            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status</span>
                <span className={`font-semibold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-50 dark:border-gray-900 pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{formatPrice(order.totalAmount - (order.shippingPrice || 0) + (order.discount || 0))}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{formatPrice(order.shippingPrice || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2 text-sm font-bold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-primary">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
