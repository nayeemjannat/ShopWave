import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated, logoutUser } from '../../features/auth/authSlice';
import { selectCartCount } from '../../features/cart/cartSlice';
import { selectStoreConfig, selectStoreName } from '../../features/store/storeSlice';
import useDebounce from '../../hooks/useDebounce';
import axiosInstance from '../../utils/axiosInstance';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const cartCount = useSelector(selectCartCount);
  const storeName = useSelector(selectStoreName);
  const storeConfig = useSelector(selectStoreConfig);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef(null);

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (isUserDropdownOpen && !event.target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

  useEffect(() => {
    const fetchSearch = async () => {
      if (debouncedSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const response = await axiosInstance.get(`/api/v1/products/search?q=${encodeURIComponent(debouncedSearch)}`);
        if (response.success && response.products) {
          setSearchResults(response.products.slice(0, 5));
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Search error', err);
      }
    };
    fetchSearch();
  }, [debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSearchResults(false);
      navigate(`/shop?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchResultClick = (product) => {
    setShowSearchResults(false);
    setSearchTerm('');
    navigate(`/product/${product._id}/${product.slug || 'product'}`);
  };

  const handleLogout = useCallback(() => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        toast.success('Logged out successfully');
        navigate('/');
      })
      .catch((err) => {
        toast.error(err || 'Failed to logout');
      });
  }, [dispatch, navigate]);

  const wishlistCount = user?.wishlist?.length || 0;
  const logoUrl = storeConfig?.logo;
  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
  ];

  return (
    <>
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled ? 'navbar-glass shadow-sticky' : 'navbar-glass'
      }`}
    >
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-px pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-16 flex items-center justify-between gap-4">
          {/* Hamburger (Mobile only) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden btn-icon"
            aria-label="Toggle Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName || 'ShopWave'} className="h-9 object-contain" />
            ) : (
              <span className="text-lg font-bold text-primary tracking-tight">
                {storeName || 'ShopWave'}
              </span>
            )}
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 text-label rounded-10px transition-colors duration-150 ${
                    isActive ? 'bg-primary-light text-primary font-semibold' : 'text-muted hover:text-ink hover:bg-ghost'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* SEARCH BAR (Desktop) */}
          <div ref={searchRef} className="hidden md:block flex-grow max-w-md relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSearchResults(searchResults.length > 0)}
                className="rounded-full bg-ghost border border-border h-10 pl-4 pr-10 text-sm outline-none focus:border-primary focus:shadow-input-focus transition-all duration-150 w-full placeholder:text-muted"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted hover:text-ink"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-surface rounded-2xl shadow-modal border border-border overflow-hidden z-50">
                {searchResults.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => handleSearchResultClick(product)}
                    className="flex items-center gap-3 p-3 hover:bg-ghost cursor-pointer transition-colors duration-150 border-b border-border last:border-b-0"
                  >
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/50'}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-xl bg-ghost"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{product.name}</p>
                      <p className="text-xs font-bold text-secondary">
                        {formatPrice(product.flashSale?.isActive ? product.flashSale.salePrice : product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ICONS & ACCOUNT */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <Link
              to={isAuthenticated ? '/wishlist' : '/login'}
              className="btn-icon hidden sm:flex relative"
              aria-label="Wishlist"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-danger text-badge font-bold rounded-full flex items-center justify-center text-white">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="btn-icon relative"
              aria-label="Shopping Cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-primary text-badge font-bold rounded-full flex items-center justify-center text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Auth / User Dropdown */}
            <div className="relative user-dropdown-container">
              {isAuthenticated ? (
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-1.5 focus:outline-none hover:bg-ghost p-1 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center text-sm uppercase">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      user?.name?.substring(0, 2)
                    )}
                  </div>
                  <svg className="w-3.5 h-3.5 hidden md:block text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="btn-secondary btn-sm"
                >
                  Login
                </Link>
              )}

              {isAuthenticated && isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-surface rounded-2xl shadow-modal border border-border py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-label text-muted">Signed in as</p>
                    <p className="text-sm font-semibold text-ink truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-ink hover:bg-ghost transition-colors"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-ink hover:bg-ghost transition-colors"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-ink hover:bg-ghost transition-colors"
                  >
                    Wishlist
                  </Link>

                  {user?.loyaltyPoints !== undefined && (
                    <div className="px-4 py-1.5 flex items-center justify-between text-badge font-bold text-warning bg-warning/10 my-1 mx-2 rounded-md">
                      <span>Points</span>
                      <span>{user.loyaltyPoints} pts</span>
                    </div>
                  )}

                  {(user?.role === 'storeAdmin' || user?.role === 'superAdmin') && (
                    <Link
                      to="/admin"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="block px-4 py-2 text-sm font-semibold text-secondary border-t border-border hover:bg-ghost transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-danger font-medium hover:bg-danger/5 transition-colors border-t border-border"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH ROW */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field h-9 pl-4 pr-10 text-xs"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-64 max-w-xs bg-surface h-full shadow-modal p-5 z-10">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-bold text-primary">{storeName || 'ShopWave'}</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-icon"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navLinks.concat(
                { path: isAuthenticated ? '/wishlist' : '/login', label: 'Wishlist' },
                { path: '/cart', label: 'Cart' }
              ).map((link) => {
                const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-10px text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-light text-primary' : 'text-ink hover:bg-ghost'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {isAuthenticated && (user?.role === 'storeAdmin' || user?.role === 'superAdmin') && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-10px text-sm font-semibold text-secondary hover:bg-secondary/5 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </nav>

            <div className="mt-auto pt-6 border-t border-border">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full btn-danger btn-sm"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center w-full btn-primary btn-sm"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="mobile-bottom-bar md:hidden">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center h-full transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-muted'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-badge font-semibold mt-0.5">Home</span>
        </Link>
        <Link
          to="/shop"
          className={`flex flex-col items-center justify-center h-full transition-colors ${location.pathname.startsWith('/shop') ? 'text-primary' : 'text-muted'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <span className="text-badge font-semibold mt-0.5">Shop</span>
        </Link>
        <Link
          to="/cart"
          className={`flex flex-col items-center justify-center h-full relative transition-colors ${location.pathname === '/cart' ? 'text-primary' : 'text-muted'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute top-1 right-5 w-4 h-4 bg-primary text-badge font-bold rounded-full flex items-center justify-center text-white border-2 border-surface">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
          <span className="text-badge font-semibold mt-0.5">Cart</span>
        </Link>
        <Link
          to={isAuthenticated ? '/profile' : '/login'}
          className={`flex flex-col items-center justify-center h-full transition-colors ${location.pathname === '/profile' || location.pathname === '/login' ? 'text-primary' : 'text-muted'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-badge font-semibold mt-0.5">Account</span>
        </Link>
      </div>
    </>
  );
};

export default Navbar;
