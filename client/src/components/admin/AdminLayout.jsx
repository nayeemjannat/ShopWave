import React, { useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import { selectStoreName } from '../../features/store/storeSlice';

const useUser = () => {
  const auth = (window.__store || {});
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch { return null; }
};

export const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const storeName = useSelector(selectStoreName);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Read user from Redux auth state via localStorage (authSlice persists to localStorage)
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch { /* noop */ }

  const handleLogout = useCallback(async () => {
    await dispatch(logoutUser());
    navigate('/login');
  }, [dispatch, navigate]);

  const isSuperAdmin = user?.role === 'superAdmin';

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { to: '/admin/products', label: 'Products', icon: '📦' },
    { to: '/admin/orders', label: 'Orders', icon: '🛒' },
    { to: '/admin/store-config', label: 'Store Config', icon: '🎨' },
    { to: '/admin/payment-config', label: 'Payment', icon: '💳' },
    { to: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
    { to: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  ];

  // SuperAdmin-only links inserted after Orders
  const superAdminLinks = [
    { to: '/admin/stores', label: 'Manage Stores', icon: '🏪' },
    { to: '/admin/users', label: 'All Users', icon: '👥' },
  ];

  const allLinks = isSuperAdmin
    ? [
        ...navLinks.slice(0, 3),
        ...superAdminLinks,
        ...navLinks.slice(3),
      ]
    : navLinks;

  const navLinkCls = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-primary/20 text-primary'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="flex h-screen bg-ghost text-ink overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-ink text-white flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <p className="text-base font-black text-white tracking-tight">ShopWave</p>
          <p className="text-[11px] text-white/40 mt-0.5 truncate">{storeName || 'Admin Panel'}</p>
          {isSuperAdmin && (
            <span className="mt-1.5 inline-block text-[9px] font-bold px-2 py-0.5 bg-primary/30 text-primary rounded-full uppercase tracking-wider">
              Super Admin
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allLinks.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={navLinkCls}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: version + logout */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-base">🚪</span>
            <span>Logout</span>
          </button>
          <p className="text-[10px] text-white/20 px-3">v1.0 · ShopWave Platform</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-[#111] border-b border-gray-100 dark:border-gray-900 flex items-center justify-between px-4 flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              {user?.name || user?.email || 'Admin'}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black">
              {(user?.name || user?.email || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
