import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreId } from '../../features/store/storeSlice';
import { formatPrice, formatDate } from '../../utils/formatters';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const OrdersPage = () => {
  const storeId = useSelector(selectStoreId);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/orders');
      setOrders(Array.isArray(res.orders) ? res.orders : []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [storeId]);

  const filteredOrders = activeTab === 'All'
    ? orders
    : orders.filter(o => o.status?.toLowerCase() === activeTab.toLowerCase());

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await axiosInstance.put(`/api/v1/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    setUpdatingId(orderId);
    try {
      await axiosInstance.put(`/api/v1/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Orders</h1>
        <span className="text-xs text-gray-400">Total: {orders.length}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 text-[10px] font-bold px-4 py-2 rounded-xl border transition-all ${
              activeTab === tab
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-[#151515] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">📦</span>
          <p className="text-sm text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <p className="text-xs font-black text-gray-900 dark:text-white">
                    #{order.orderNumber || order._id?.slice(-8)}
                  </p>
                  <p className="text-[10px] text-gray-400">{formatDate(order.createdAt)}</p>
                  <p className="text-xs text-gray-500 font-semibold">{order.user?.name || order.shippingAddress?.fullName || 'Guest'}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  order.status === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                  order.status === 'Shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-900 pt-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">Items: {order.items?.length || 0}</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                    <>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingId === order._id}
                        className="text-[10px] font-bold px-2 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent outline-none"
                      >
                        {['Pending', 'Processing', 'Shipped', 'Delivered'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={updatingId === order._id}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
