import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe, selectCurrentUser, selectIsAuthenticated, selectAuthLoading } from './features/auth/authSlice';
import { fetchStoreConfig } from './features/store/storeSlice';
import { fetchCart } from './features/cart/cartSlice';
import Toast from './components/common/Toast';
import Navbar from './components/common/Navbar';
import ScrollToTop from './components/common/ScrollToTop';

// Lazy Loaded Pages
const HomePage = React.lazy(() => import('./pages/Customer/HomePage'));
const ShopPage = React.lazy(() => import('./pages/Customer/ShopPage'));
const ProductDetailPage = React.lazy(() => import('./pages/Customer/ProductDetailPage'));
const CartPage = React.lazy(() => import('./pages/Customer/CartPage'));
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/Auth/ResetPasswordPage'));
const ComparisonPage = React.lazy(() => import('./pages/Customer/ComparisonPage'));
const OrderSuccessPage = React.lazy(() => import('./pages/Customer/OrderSuccessPage'));
const OrderFailurePage = React.lazy(() => import('./pages/Customer/OrderFailurePage'));

// Protected Customer Pages
const CheckoutPage = React.lazy(() => import('./pages/Customer/CheckoutPage'));
const OrderHistoryPage = React.lazy(() => import('./pages/Customer/OrderHistoryPage'));
const OrderDetailPage = React.lazy(() => import('./pages/Customer/OrderDetailPage'));
const ProfilePage = React.lazy(() => import('./pages/Customer/ProfilePage'));
const WishlistPage = React.lazy(() => import('./pages/Customer/WishlistPage'));

// Admin Pages
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const DashboardPage = React.lazy(() => import('./pages/Admin/DashboardPage'));
const ProductsPage = React.lazy(() => import('./pages/Admin/ProductsPage'));
const ProductFormPage = React.lazy(() => import('./pages/Admin/ProductFormPage'));
const OrdersPage = React.lazy(() => import('./pages/Admin/OrdersPage'));
const UsersPage = React.lazy(() => import('./pages/Admin/UsersPage'));
const StoreConfigPage = React.lazy(() => import('./pages/Admin/StoreConfigPage'));
const CouponsPage = React.lazy(() => import('./pages/Admin/CouponsPage'));
const ReviewsPage = React.lazy(() => import('./pages/Admin/ReviewsPage'));
const PaymentConfigPage = React.lazy(() => import('./pages/Admin/PaymentConfigPage'));
const ManageStoresPage = React.lazy(() => import('./pages/Admin/ManageStoresPage'));

// Loader components
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#111]">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
    </div>
  </div>
);

// Protected Route Wrapper for Customers
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) return <LoadingSpinner />;
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Route Wrapper
const AdminRoute = ({ children, allowedRoles = ['storeAdmin', 'superAdmin'] }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Store Layout Wrapper (adds Navbar and padding)
const StorefrontLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#111] text-gray-800 dark:text-gray-200 pb-16 md:pb-0">
    <Navbar />
    <main className="flex-grow">
      {children}
    </main>
  </div>
);

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Resolve store slug from domain or environment
    const hostname = window.location.hostname;
    let slug = '';
    const parts = hostname.split('.');
    
    if (parts.length > 2 && parts[0] !== 'www') {
      slug = parts[0];
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      slug = urlParams.get('store') || import.meta.env.VITE_STORE_SLUG || '';
    }

    dispatch(fetchStoreConfig(slug));

    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getMe());
      dispatch(fetchCart());
    }
  }, [dispatch]);

  return (
    <Router>
      <ScrollToTop />
      <Toast />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Storefront Routes */}
          <Route path="/" element={<StorefrontLayout><HomePage /></StorefrontLayout>} />
          <Route path="/shop" element={<StorefrontLayout><ShopPage /></StorefrontLayout>} />
          <Route path="/product/:id/:slug" element={<StorefrontLayout><ProductDetailPage /></StorefrontLayout>} />
          <Route path="/cart" element={<StorefrontLayout><CartPage /></StorefrontLayout>} />
          <Route path="/compare" element={<StorefrontLayout><ComparisonPage /></StorefrontLayout>} />
          <Route path="/order-success" element={<StorefrontLayout><OrderSuccessPage /></StorefrontLayout>} />
          <Route path="/order-failure" element={<StorefrontLayout><OrderFailurePage /></StorefrontLayout>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Customer Routes */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <StorefrontLayout><CheckoutPage /></StorefrontLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <StorefrontLayout><OrderHistoryPage /></StorefrontLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute>
              <StorefrontLayout><OrderDetailPage /></StorefrontLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <StorefrontLayout><ProfilePage /></StorefrontLayout>
            </ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute>
              <StorefrontLayout><WishlistPage /></StorefrontLayout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="store-config" element={<StoreConfigPage />} />
            <Route path="payment-config" element={
              <AdminRoute>
                <PaymentConfigPage />
              </AdminRoute>
            } />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="stores" element={
              <AdminRoute allowedRoles={['superAdmin']}>
                <ManageStoresPage />
              </AdminRoute>
            } />
            <Route path="users" element={
              <AdminRoute allowedRoles={['superAdmin']}>
                <UsersPage />
              </AdminRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
