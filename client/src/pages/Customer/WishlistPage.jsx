import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import ProductCard from '../../components/common/ProductCard';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

export const WishlistPage = () => {
  const user = useSelector(selectCurrentUser);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/users/wishlist');
      if (res.success) {
        setWishlistItems(res.wishlist || []);
      }
    } catch (err) {
      toast.error('Failed to load wishlist items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user?.wishlist]); // Reload when wishlist changes in auth state

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">My Wishlist</h1>
      {wishlistItems.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Your wishlist is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {wishlistItems.map((product) => (
            <ProductCard key={product._id} product={product} showCompare={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
