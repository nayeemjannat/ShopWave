import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';

export const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrder: '', expiresAt: '' });

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/store/coupons');
      setCoupons(Array.isArray(res.coupons) ? res.coupons : []);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditCoupon(null);
    setForm({ code: '', discountType: 'percentage', discountValue: '', minOrder: '', expiresAt: '' });
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || '',
      minOrder: coupon.minOrder || '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) {
      toast.error('Code and discount value are required');
      return;
    }
    try {
      await axiosInstance.post('/api/v1/store/coupons', {
        ...form,
        discountValue: Number(form.discountValue),
        minOrder: form.minOrder ? Number(form.minOrder) : undefined,
      });
      toast.success(editCoupon ? 'Coupon updated' : 'Coupon created');
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await axiosInstance.delete(`/api/v1/store/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Coupons</h1>
        <button onClick={openCreate} className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors">
          + New Coupon
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#151515] rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-900">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Code</label>
                <input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Type</label>
                  <select value={form.discountType} onChange={(e) => setForm(f => ({ ...f, discountType: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Value</label>
                  <input type="number" value={form.discountValue} onChange={(e) => setForm(f => ({ ...f, discountValue: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Min Order</label>
                  <input type="number" value={form.minOrder} onChange={(e) => setForm(f => ({ ...f, minOrder: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Expires At</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors">
                  {editCoupon ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">🏷️</span>
          <p className="text-sm text-gray-500">No coupons yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <div key={c._id} className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">{c.code}</p>
                <p className="text-xs text-gray-400">
                  {c.discountType === 'percentage' ? `${c.discountValue}%` : `৳${c.discountValue}`} OFF
                  {c.minOrder ? ` (min. ৳${c.minOrder})` : ''}
                </p>
                {c.expiresAt && <p className="text-[10px] text-gray-500">Expires: {formatDate(c.expiresAt)}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(c)} className="text-xs font-bold text-primary hover:underline">Edit</button>
                <button onClick={() => handleDelete(c._id)} className="text-xs font-bold text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
