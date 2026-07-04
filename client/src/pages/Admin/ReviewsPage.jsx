import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/reviews');
      setReviews(Array.isArray(res.reviews) ? res.reviews : []);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleApprove = async (id) => {
    try {
      await axiosInstance.put(`/api/v1/reviews/${id}/approve`);
      toast.success('Review approved');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve review');
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosInstance.put(`/api/v1/reviews/${id}/reject`);
      toast.success('Review rejected');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject review');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await axiosInstance.delete(`/api/v1/reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Reviews</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">⭐</span>
          <p className="text-sm text-gray-500">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r._id} className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                    {r.user?.name?.substring(0, 2) || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{r.user?.name || 'Anonymous'}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-sm">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>{idx < r.rating ? '★' : '☆'}</span>
                  ))}
                </div>
              </div>
              {r.product && (
                <p className="text-[10px] text-gray-400">Product: {r.product.name || r.product._id}</p>
              )}
              <p className="text-xs text-gray-700 dark:text-gray-300">{r.comment}</p>
              <div className="flex items-center gap-3 border-t border-gray-100 dark:border-gray-900 pt-3">
                {r.status !== 'approved' && (
                  <button onClick={() => handleApprove(r._id)} className="text-xs font-bold text-green-600 hover:underline">Approve</button>
                )}
                {r.status !== 'rejected' && (
                  <button onClick={() => handleReject(r._id)} className="text-xs font-bold text-amber-600 hover:underline">Reject</button>
                )}
                <button onClick={() => handleDelete(r._id)} className="text-xs font-bold text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
