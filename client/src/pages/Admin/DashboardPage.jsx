import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreId } from '../../features/store/storeSlice';
import { formatPrice, formatDate } from '../../utils/formatters';
import axiosInstance from '../../utils/axiosInstance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export const DashboardPage = () => {
  const storeId = useSelector(selectStoreId);
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAnalytics = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/api/v1/store/analytics?period=${period}`, { signal: controller.signal });
        if (res.success) {
          setAnalytics(res);
        }
      } catch (err) {
        console.error('Analytics fetch error', err);
        setAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
    return () => controller.abort();
  }, [storeId, period]);

  const metrics = analytics?.metrics || {
    revenue: { total: 0, change: 0 },
    orders: { total: 0, change: 0 },
    products: 0,
    customers: { total: 0, change: 0 },
  };

  const dailyRevenue = analytics?.dailyRevenue || [];
  const ordersByStatus = analytics?.ordersByStatus || [];
  const topProducts = analytics?.topProducts || [];
  const recentOrders = analytics?.recentOrders || [];

  const metricCards = [
    { label: 'Total Revenue', value: formatPrice(metrics.revenue.total), change: metrics.revenue.change, color: 'text-green-600' },
    { label: 'Total Orders', value: metrics.orders.total, change: metrics.orders.change, color: 'text-blue-600' },
    { label: 'Active Products', value: metrics.products, color: 'text-purple-600' },
    { label: 'New Customers', value: metrics.customers.total, change: metrics.customers.change, color: 'text-amber-600' },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((card) => (
              <div key={card.label} className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{card.value}</p>
                {card.change !== undefined && (
                  <p className={`text-xs font-bold mt-1 ${card.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}% vs last month
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line Chart - Daily Revenue */}
            <div className="lg:col-span-2 bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Daily Revenue</h2>
              {dailyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value) => [formatPrice(value), 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-gray-400">No revenue data available.</p>
              )}
            </div>

            {/* Pie Chart - Orders by Status */}
            <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Orders by Status</h2>
              {ordersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {ordersByStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      wrapperStyle={{ fontSize: 10 }}
                      formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-gray-400">No order data available.</p>
              )}
            </div>
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Top Selling Products</h2>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((item, idx) => (
                    <div key={item._id || idx} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                      <img
                        src={item.product?.images?.[0] || 'https://via.placeholder.com/36'}
                        alt={item.product?.name}
                        className="w-9 h-9 rounded-lg object-cover bg-gray-50 border border-gray-100 dark:border-gray-800"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{item.product?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-400">{item.unitsSold} sold</p>
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{formatPrice(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No sales data yet.</p>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Recent Orders</h2>
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((o) => (
                    <div key={o._id} className="flex items-center justify-between text-xs border-b border-gray-50 dark:border-gray-900 pb-2 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">#{o.orderNumber || o._id?.slice(-8)}</p>
                        <p className="text-gray-400">{o.user?.name || 'Guest'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">{formatPrice(o.totalAmount)}</p>
                        <span className={`font-bold ${
                          o.status === 'Delivered' ? 'text-green-600' :
                          o.status === 'Cancelled' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No orders yet.</p>
              )}
              <Link to="/admin/orders" className="mt-4 inline-block text-xs font-bold text-primary hover:underline">
                View All Orders →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
