import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { formatPrice, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400',
  processing: 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
  shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
};

const OrderCard = ({ order, onCancel }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const canCancel = ['pending', 'processing'].includes(order.status?.toLowerCase());
  const isDelivered = order.status?.toLowerCase() === 'delivered';

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setIsCancelling(true);
    try {
      await axiosInstance.put(`/api/v1/orders/${order._id}/cancel`);
      toast.success(`Order #${order.orderNumber} cancelled`);
      onCancel(order._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#151515] border border-gray-150 dark:border-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-gray-900 dark:text-white">#{order.orderNumber || order._id?.slice(-8)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_STYLES[order.status?.toLowerCase()] || STATUS_STYLES.pending}`}>
          {order.status || 'Pending'}
        </span>
      </div>

      {/* Items Preview */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(order.items || []).slice(0, 5).map((item, idx) => (
          <img
            key={idx}
            src={item.product?.images?.[0] || 'https://via.placeholder.com/48'}
            alt={item.product?.name}
            className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 dark:border-gray-800 flex-shrink-0"
          />
        ))}
        {(order.items?.length || 0) > 5 && (
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
            +{order.items.length - 5}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-900 pt-3">
        <div>
          <p className="text-[10px] text-gray-400">Total</p>
          <p className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(order.totalAmount)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/orders/${order._id}`}
            className="text-xs font-bold text-primary hover:underline"
          >
            View Details
          </Link>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="text-xs font-bold text-red-500 hover:underline disabled:opacity-50"
            >
              {isCancelling ? '...' : 'Cancel'}
            </button>
          )}
          {isDelivered && !order.isReviewed && (
            <Link
              to={`/product/${order.items?.[0]?.product?._id}/review?orderId=${order._id}`}
              className="text-[10px] font-bold bg-amber-500 text-white px-3 py-1 rounded-xl hover:opacity-90"
            >
              Write Review
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/orders/myorders');
      setOrders(Array.isArray(res.orders) ? res.orders : Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = (cancelledId) => {
    setOrders(prev => prev.map(o =>
      o._id === cancelledId ? { ...o, status: 'cancelled' } : o
    ));
  };

  const filteredOrders = activeTab === 'All'
    ? orders
    : orders.filter(o => o.status?.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white mb-6">My Orders</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 text-[10px] font-bold px-4 py-2 rounded-xl border transition-all ${
              activeTab === tab
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-[#151515] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-2xl mb-4">📦</div>
          <p className="text-sm font-bold text-gray-500">
            {activeTab === 'All' ? 'No orders yet' : `No ${activeTab.toLowerCase()} orders`}
          </p>
          {activeTab === 'All' && (
            <Link to="/shop" className="mt-4 text-xs font-bold text-primary hover:underline">
              Start Shopping →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <OrderCard key={order._id} order={order} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
