import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none focus:border-primary transition-colors';
const labelCls = 'block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1';

const STORE_TYPES = [
  { key: 'electronics', label: 'Electronics', emoji: '📱' },
  { key: 'clothing', label: 'Fashion', emoji: '👗' },
  { key: 'beauty', label: 'Beauty', emoji: '✨' },
  { key: 'grocery', label: 'Grocery', emoji: '🛒' },
  { key: 'digital', label: 'Digital', emoji: '💾' },
  { key: 'multi', label: 'Multi-Category', emoji: '🏪' },
];

const STATUS_COLORS = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  Inactive: 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400',
  Trial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
};

const emptyForm = { name: '', slug: '', storeType: 'electronics', ownerName: '', ownerEmail: '', ownerPassword: '' };

export const ManageStoresPage = () => {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStores = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/v1/store/all');
      setStores(res.stores || []);
    } catch {
      toast.error('Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Auto-generate slug from name
    if (name === 'name') {
      setForm(prev => ({
        ...prev,
        name: value,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }));
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.slug || !form.ownerEmail || !form.ownerPassword) {
      toast.error('Name, slug, owner email and password are required');
      return;
    }
    setIsSaving(true);
    try {
     await axiosInstance.post('/api/v1/store', {
        name: form.name,
        slug: form.slug,
        storeType: form.storeType,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPassword: form.ownerPassword,
      });

      toast.success(`Store "${form.name}" created!`);
      setForm(emptyForm);
      setShowCreate(false);
      fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create store');
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Manage Stores</h1>
          <p className="text-xs text-gray-400 mt-1">{stores.length} store{stores.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
        >
          {showCreate ? '✕ Cancel' : '+ New Store'}
        </button>
      </div>

      {/* Create Store Form */}
      {showCreate && (
        <div className="bg-white dark:bg-[#151515] border border-primary/30 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Create New Store</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Store Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Rahim Electronics" />
            </div>
            <div>
              <label className={labelCls}>Store Slug * (URL identifier)</label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-r-0 border-gray-200 dark:border-gray-800 rounded-l-xl text-xs text-gray-400 font-mono">shopwave.com/</span>
                <input name="slug" value={form.slug} onChange={handleChange} className={inputCls + ' rounded-l-none'} placeholder="rahim-electronics" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Store Type</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-1">
              {STORE_TYPES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, storeType: t.key }))}
                  className={`p-2 rounded-xl border-2 text-center transition-all ${
                    form.storeType === t.key
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg">{t.emoji}</div>
                  <p className={`text-[10px] font-bold mt-0.5 ${form.storeType === t.key ? 'text-primary' : 'text-gray-500'}`}>{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-900 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Store Owner Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Owner Name</label>
                <input name="ownerName" value={form.ownerName} onChange={handleChange} className={inputCls} placeholder="Rahim Uddin" />
              </div>
              <div>
                <label className={labelCls}>Owner Email *</label>
                <input name="ownerEmail" type="email" value={form.ownerEmail} onChange={handleChange} className={inputCls} placeholder="rahim@example.com" />
              </div>
              <div>
                <label className={labelCls}>Initial Password *</label>
                <input name="ownerPassword" type="password" value={form.ownerPassword} onChange={handleChange} className={inputCls} placeholder="Min 8 characters" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              This creates a new storeAdmin account and links it to the store. Share credentials with the client — they can change the password from their profile.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={isSaving}
              className="bg-primary text-white font-bold text-xs px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSaving ? 'Creating...' : 'Create Store + Owner Account'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm); }} className="text-xs font-bold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stores List */}
      {stores.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl">
          <div className="text-5xl mb-3">🏪</div>
          <p className="text-sm font-bold text-gray-500">No stores yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "+ New Store" to create the first client store</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map(store => {
            const typeInfo = STORE_TYPES.find(t => t.key === store.storeType) || { emoji: '🏪', label: store.storeType };
            const isActive = store.isActive !== false;
            return (
              <div key={store._id} className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeInfo.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{store.name}</p>
                      <p className="text-[10px] font-mono text-gray-400">/{store.slug}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? STATUS_COLORS['Active'] : STATUS_COLORS['Inactive']}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-400">Type</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{typeInfo.emoji} {typeInfo.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-400">Owner</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{store.owner?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-400">Email</span>
                    <span className="text-gray-500 truncate max-w-[140px]">{store.owner?.email || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-400">Plan</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{store.subscription?.plan || 'Free'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-400">Created</span>
                    <span className="text-gray-500">{store.createdAt ? new Date(store.createdAt).toLocaleDateString('en-GB') : '—'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-900 flex gap-2">
                  <a
                    href={`/?store=${store.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center text-[11px] font-bold px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-gray-600 dark:text-gray-400"
                  >
                    View Store ↗
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(store.slug);
                      toast.success('Slug copied!');
                    }}
                    className="flex-1 text-[11px] font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    Copy Slug
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageStoresPage;
