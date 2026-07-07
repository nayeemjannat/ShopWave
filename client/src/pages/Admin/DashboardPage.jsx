import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { selectStoreId } from '../../features/store/storeSlice';
import { formatPrice } from '../../utils/formatters';
import axiosInstance from '../../utils/axiosInstance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const MetricCard = ({ label, value, change, color }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl font-black text-gray-900">{value}</p>
    {change !== undefined && (
      <p className={`text-xs font-bold mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
      </p>
    )}
  </div>
);

const AnalyticsCharts = ({ dailyRevenue, ordersByStatus }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-bold text-gray-800 mb-4">Daily Revenue</h2>
      {dailyRevenue.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value) => [formatPrice(value), 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#4B44B0" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-gray-400">No revenue data available.</p>
      )}
    </div>
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-bold text-gray-800 mb-4">Orders by Status</h2>
      {ordersByStatus.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
              {ordersByStatus.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-gray-400">No order data available.</p>
      )}
    </div>
  </div>
);

const TopProducts = ({ products }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
    <h2 className="text-sm font-bold text-gray-800 mb-4">Top Selling Products</h2>
    {products.length > 0 ? (
      <div className="space-y-3">
        {products.map((item, idx) => (
          <div key={item._id || idx} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
            <img src={item.product?.images?.[0] || 'https://via.placeholder.com/36'} alt={item.product?.name} className="w-9 h-9 rounded-lg object-cover bg-gray-50 border border-gray-100" />
            <div className="flex-grow min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{item.product?.name || 'Unknown'}</p>
              <p className="text-[10px] text-gray-400">{item.unitsSold} sold</p>
            </div>
            <span className="text-xs font-bold text-gray-900">{formatPrice(item.revenue)}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-gray-400">No sales data yet.</p>
    )}
  </div>
);

const RecentOrders = ({ orders }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
    <h2 className="text-sm font-bold text-gray-800 mb-4">Recent Orders</h2>
    {orders.length > 0 ? (
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-b-0 last:pb-0">
            <div>
              <p className="font-bold text-gray-800">#{o.orderNumber || o._id?.slice(-8)}</p>
              <p className="text-gray-400">{o.user?.name || 'Guest'}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{formatPrice(o.totalAmount)}</p>
              <span className={`font-bold ${o.status === 'Delivered' ? 'text-green-600' : o.status === 'Cancelled' ? 'text-red-500' : 'text-amber-500'}`}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-gray-400">No orders yet.</p>
    )}
    <Link to="/admin/orders" className="mt-4 inline-block text-xs font-bold text-primary hover:underline">View All Orders →</Link>
  </div>
);

const StoreOwnerDashboard = () => {
  const storeId = useSelector(selectStoreId);
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!storeId) return;
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/api/v1/store/analytics?period=${period}`, { signal: controller.signal });
        if (res.success) setAnalytics(res);
      } catch { setAnalytics(null) } finally { setIsLoading(false) }
    };
    fetchData();
    return () => controller.abort();
  }, [storeId, period]);

  const m = analytics?.metrics;
  const metricCards = [
    { label: 'Total Revenue', value: formatPrice(m?.revenue?.total || 0), change: m?.revenue?.change, color: 'text-green-600' },
    { label: 'Total Orders', value: m?.orders?.total || 0, change: m?.orders?.change, color: 'text-blue-600' },
    { label: 'Active Products', value: m?.products || 0, color: 'text-purple-600' },
    { label: 'Customers', value: m?.customers?.total || 0, change: m?.customers?.change, color: 'text-amber-600' },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900">Store Dashboard</h1>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${period === p ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((c) => <MetricCard key={c.label} {...c} />)}
          </div>
          <AnalyticsCharts dailyRevenue={analytics?.dailyRevenue || []} ordersByStatus={analytics?.ordersByStatus || []} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProducts products={analytics?.topProducts || []} />
            <RecentOrders orders={analytics?.recentOrders || []} />
          </div>
        </>
      )}
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/api/v1/store/analytics/global?period=${period}`, { signal: controller.signal });
        if (res.success) setAnalytics(res);
      } catch { setAnalytics(null) } finally { setIsLoading(false) }
    };
    fetchData();
    return () => controller.abort();
  }, [period]);

  const m = analytics?.metrics;
  const metricCards = [
    { label: 'Global Revenue', value: formatPrice(m?.revenue?.total || 0), change: m?.revenue?.change, color: 'text-green-600' },
    { label: 'All Orders', value: m?.orders?.total || 0, change: m?.orders?.change, color: 'text-blue-600' },
    { label: 'Total Products', value: m?.products || 0, color: 'text-purple-600' },
    { label: 'Active Stores', value: analytics?.stores || 0, color: 'text-amber-600' },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Platform Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Overview across all stores</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${period === p ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((c) => <MetricCard key={c.label} {...c} />)}
          </div>
          <AnalyticsCharts dailyRevenue={analytics?.dailyRevenue || []} ordersByStatus={analytics?.ordersByStatus || []} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProducts products={analytics?.topProducts || []} />
            <RecentOrders orders={analytics?.recentOrders || []} />
          </div>
          {/* Quick links for super admin */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Link to="/admin/stores" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-bold text-gray-800">Manage Stores</p>
              <p className="text-xs text-gray-400 mt-1">View, create, and manage all stores on the platform</p>
            </Link>
            <Link to="/admin/users" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-bold text-gray-800">Manage Users</p>
              <p className="text-xs text-gray-400 mt-1">View and manage all platform users and admins</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === 'superAdmin';

  return isSuperAdmin ? <SuperAdminDashboard /> : <StoreOwnerDashboard />;
};

export default DashboardPage;