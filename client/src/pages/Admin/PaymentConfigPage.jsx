import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectStoreId } from '../../features/store/storeSlice';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

export const PaymentConfigPage = () => {
  const storeId = useSelector(selectStoreId);
  const [form, setForm] = useState({
    sslcommerz: {
      storeId: '',
      storePassword: '',
      isLive: false,
    },
    cod: {
      enabled: true,
      fee: 20,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/store/${storeId}/payment`, { signal: controller.signal });
        const payment = res.payment;
        setForm({
          sslcommerz: {
            storeId: payment.storeId || '',
            storePassword: payment.storePassword || '',
            isLive: !!payment.isLive,
          },
          cod: {
            enabled: payment.cod?.enabled !== false,
            fee: payment.cod?.fee || 0,
          },
        });
      } catch (err) {
        if (err.name !== 'CanceledError') {
          toast.error('Failed to load existing payment configuration');
        }
      } finally {
        setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [storeId]);

  const handleSslChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      sslcommerz: { ...prev.sslcommerz, [field]: value },
    }));
  };

  const handleCodChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      cod: { ...prev.cod, [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!storeId) {
      toast.error('No store selected');
      return;
    }
    setIsSaving(true);
    try {
      await axiosInstance.put(`/api/v1/store/${storeId}/payment`, {
        provider: 'sslcommerz',
        storeId: form.sslcommerz.storeId,
        storePassword: form.sslcommerz.storePassword,
        isLive: form.sslcommerz.isLive,
        cod: {
          enabled: form.cod.enabled,
          fee: Number(form.cod.fee),
        },
      });
      toast.success('Payment configuration saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payment config');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Payment Configuration</h1>

      {/* SSLCommerz */}
      <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">SSLCommerz</h2>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Store ID</label>
          <input value={form.sslcommerz.storeId} onChange={(e) => handleSslChange('storeId', e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none" placeholder="Your SSLCommerz Store ID" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Store Password</label>
          <input type="password" value={form.sslcommerz.storePassword} onChange={(e) => handleSslChange('storePassword', e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none" placeholder="API Password" />
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400">
          <input type="checkbox" checked={form.sslcommerz.isLive} onChange={(e) => handleSslChange('isLive', e.target.checked)} className="rounded border-gray-300 text-primary" />
          Go Live (uncheck for Sandbox / Testing)
        </label>
      </div>

      {/* Cash on Delivery */}
      <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">Cash on Delivery</h2>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400">
          <input type="checkbox" checked={form.cod.enabled} onChange={(e) => handleCodChange('enabled', e.target.checked)} className="rounded border-gray-300 text-primary" />
          Enable Cash on Delivery
        </label>
        {form.cod.enabled && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">COD Handling Fee (BDT)</label>
            <input type="number" value={form.cod.fee} onChange={(e) => handleCodChange('fee', e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none" />
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-sm"
      >
        {isSaving ? 'Saving...' : 'Save Payment Configuration'}
      </button>
    </div>
  );
};

export default PaymentConfigPage;
