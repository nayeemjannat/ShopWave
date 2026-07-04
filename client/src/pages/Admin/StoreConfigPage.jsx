import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectStoreConfig, selectStoreName, selectStoreType, updateConfigLocal, fetchStoreConfig } from '../../features/store/storeSlice';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

// PRD Section 3 — Store Types with auto-activated modules
const STORE_TYPES = [
  {
    key: 'electronics',
    label: 'Electronics / Phones',
    emoji: '📱',
    desc: 'StarTech-style — spec badges, brand filter, comparison',
    autoModules: ['comparison', 'flashSale', 'reviews', 'loyaltyPoints'],
    color: '#4B44B0',
  },
  {
    key: 'clothing',
    label: 'Fashion / Clothing',
    emoji: '👗',
    desc: 'Aarong-style — lookbook hero, size chart, color swatches',
    autoModules: ['comparison', 'reviews', 'wishlist'],
    color: '#BE185D',
  },
  {
    key: 'beauty',
    label: 'Beauty / Skincare',
    emoji: '✨',
    desc: "Kiehl's-style — ingredient cards, skin type filter",
    autoModules: ['reviews', 'referral', 'loyaltyPoints'],
    color: '#9D4EDD',
  },
  {
    key: 'grocery',
    label: 'Grocery / Food',
    emoji: '🛒',
    desc: 'Chaldal-style — delivery slot, freshness badge, category grid',
    autoModules: ['deliverySlot', 'nutritionInfo', 'reviews'],
    color: '#16A34A',
  },
  {
    key: 'digital',
    label: 'Digital Products',
    emoji: '💾',
    desc: 'Minimal — instant download, license info, preview modal',
    autoModules: ['reviews'],
    color: '#0EA5E9',
  },
  {
    key: 'multi',
    label: 'Multi-Category',
    emoji: '🏪',
    desc: 'Amazon/Daraz-style — sidebar tree, mega nav, all modules',
    autoModules: ['comparison', 'flashSale', 'reviews', 'loyaltyPoints', 'referral'],
    color: '#F97316',
  },
];

const ALWAYS_ON = ['wishlist', 'cart'];

const ALL_MODULES = [
  { key: 'wishlist', label: 'Wishlist', alwaysOn: true },
  { key: 'cart', label: 'Cart', alwaysOn: true },
  { key: 'comparison', label: 'Product Comparison' },
  { key: 'flashSale', label: 'Flash Sale' },
  { key: 'reviews', label: 'Reviews & Ratings' },
  { key: 'loyaltyPoints', label: 'Loyalty Points' },
  { key: 'referral', label: 'Referral Program' },
  { key: 'nutritionInfo', label: 'Nutrition Info' },
  { key: 'deliverySlot', label: 'Delivery Slot' },
];

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Hind Siliguri', 'Open Sans', 'Lato', 'Montserrat'];

const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none focus:border-primary transition-colors';
const sectionCls = 'bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-sm space-y-4';
const labelCls = 'block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1';

export const StoreConfigPage = () => {
  const dispatch = useDispatch();
  const config = useSelector(selectStoreConfig);
  const storeName = useSelector(selectStoreName);
  const currentStoreType = useSelector(selectStoreType);

  const [form, setForm] = useState({
    storeName: storeName || '',
    storeType: currentStoreType || 'electronics',
    primaryColor: config?.primaryColor || '#4B44B0',
    secondaryColor: config?.secondaryColor || '#1B9C75',
    fontFamily: config?.fontFamily || 'Inter',
    logo: config?.logo || '',
    bannerImages: config?.bannerImages?.length ? config.bannerImages : [''],
    activeModules: config?.activeModules?.length ? config.activeModules : [...ALWAYS_ON],
    facebookUrl: config?.socialLinks?.facebook || '',
    instagramUrl: config?.socialLinks?.instagram || '',
    whatsappNumber: config?.socialLinks?.whatsapp || '',
    language: config?.language || 'en',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      storeName: storeName || prev.storeName,
      storeType: currentStoreType || prev.storeType,
      primaryColor: config?.primaryColor || prev.primaryColor,
      secondaryColor: config?.secondaryColor || prev.secondaryColor,
      fontFamily: config?.fontFamily || prev.fontFamily,
      logo: config?.logo || prev.logo,
      bannerImages: config?.bannerImages?.length ? config.bannerImages : prev.bannerImages,
      activeModules: config?.activeModules?.length ? config.activeModules : prev.activeModules,
    }));
  }, [config, storeName, currentStoreType]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (['primaryColor', 'secondaryColor', 'fontFamily'].includes(field)) {
      dispatch(updateConfigLocal({ [field]: value }));
    }
  };

  // When store type changes: update color + auto-activate recommended modules
  const handleStoreTypeChange = (typeKey) => {
    const typeInfo = STORE_TYPES.find(t => t.key === typeKey);
    const autoModules = [...ALWAYS_ON, ...(typeInfo?.autoModules || [])];
    // merge — don't remove modules user manually enabled
    const merged = [...new Set([...form.activeModules, ...autoModules])];
    setForm(prev => ({
      ...prev,
      storeType: typeKey,
      primaryColor: typeInfo?.color || prev.primaryColor,
      activeModules: merged,
    }));
    dispatch(updateConfigLocal({ primaryColor: typeInfo?.color }));
  };

  const handleModuleToggle = (moduleKey) => {
    setForm(prev => {
      const active = prev.activeModules.includes(moduleKey)
        ? prev.activeModules.filter(k => k !== moduleKey)
        : [...prev.activeModules, moduleKey];
      dispatch(updateConfigLocal({ activeModules: active }));
      return { ...prev, activeModules: active };
    });
  };

  const handleBannerChange = (idx, value) => {
    setForm(prev => {
      const banners = [...prev.bannerImages];
      banners[idx] = value;
      return { ...prev, bannerImages: banners };
    });
  };

  const addBannerField = () => setForm(prev => ({ ...prev, bannerImages: [...prev.bannerImages, ''] }));
  const removeBannerField = (idx) => {
    setForm(prev => {
      const banners = prev.bannerImages.filter((_, i) => i !== idx);
      return { ...prev, bannerImages: banners.length ? banners : [''] };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        storeType: form.storeType,
        config: {
          storeName: form.storeName,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          fontFamily: form.fontFamily,
          logo: form.logo,
          bannerImages: form.bannerImages.filter(Boolean),
          activeModules: form.activeModules,
          socialLinks: {
            facebook: form.facebookUrl,
            instagram: form.instagramUrl,
            whatsapp: form.whatsappNumber,
          },
          language: form.language,
        },
      };

      const res = await axiosInstance.put('/api/v1/store/config', payload);
      if (res.success) {
        toast.success('Store configuration saved!');
        dispatch(fetchStoreConfig());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedType = STORE_TYPES.find(t => t.key === form.storeType);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Store Configuration</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">

          {/* ── STORE TYPE SELECTOR ── */}
          <div className={sectionCls}>
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2 mb-4">
                Store Type
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Store type determines the homepage layout, product fields, and which modules are activated automatically.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {STORE_TYPES.map(t => {
                const isSelected = form.storeType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleStoreTypeChange(t.key)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-xl mb-1">{t.emoji}</div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                );
              })}
            </div>
            {selectedType && (
              <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500">
                <span className="font-bold text-gray-700 dark:text-gray-300">Auto-activated: </span>
                {[...ALWAYS_ON, ...(selectedType.autoModules || [])].join(', ')}
              </div>
            )}
          </div>

          {/* ── STORE INFO ── */}
          <div className={sectionCls}>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">Store Info</h2>
            <div>
              <label className={labelCls}>Store Name</label>
              <input value={form.storeName} onChange={(e) => handleChange('storeName', e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Language</label>
                <select value={form.language} onChange={(e) => handleChange('language', e.target.value)} className={inputCls}>
                  <option value="en">English</option>
                  <option value="bn">বাংলা</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 px-3 py-2 bg-gray-50 dark:bg-gray-950 rounded-xl">BDT ৳</p>
              </div>
            </div>
          </div>

          {/* ── THEME ── */}
          <div className={sectionCls}>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">Theme</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer p-0.5" />
                  <input value={form.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} className={inputCls} placeholder="#4B44B0" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.secondaryColor} onChange={(e) => handleChange('secondaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer p-0.5" />
                  <input value={form.secondaryColor} onChange={(e) => handleChange('secondaryColor', e.target.value)} className={inputCls} placeholder="#1B9C75" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>Font Family</label>
              <select value={form.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)} className={inputCls}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* ── LOGO & BANNERS ── */}
          <div className={sectionCls}>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">Logo & Banners</h2>
            <div>
              <label className={labelCls}>Logo URL</label>
              <div className="flex items-center gap-2">
                {form.logo && <img src={form.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-gray-100 dark:border-gray-800" />}
                <input value={form.logo} onChange={(e) => handleChange('logo', e.target.value)} className={inputCls} placeholder="https://example.com/logo.png" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Banner Images</label>
              {form.bannerImages.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  {url && <img src={url} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-100 dark:border-gray-800 flex-shrink-0" />}
                  <input value={url} onChange={(e) => handleBannerChange(idx, e.target.value)} className={inputCls} placeholder="https://example.com/banner.jpg" />
                  {form.bannerImages.length > 1 && (
                    <button type="button" onClick={() => removeBannerField(idx)} className="text-red-500 text-xs font-bold flex-shrink-0">✕</button>
                  )}
                  {idx === form.bannerImages.length - 1 && (
                    <button type="button" onClick={addBannerField} className="text-primary text-xs font-bold flex-shrink-0">+ Add</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── MODULES ── */}
          <div className={sectionCls}>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">Modules</h2>
            <p className="text-xs text-gray-400">Changing store type above auto-activates recommended modules. You can also toggle manually.</p>
            <div className="space-y-3 mt-2">
              {ALL_MODULES.map(mod => {
                const isOn = ALWAYS_ON.includes(mod.key) || form.activeModules.includes(mod.key);
                const disabled = ALWAYS_ON.includes(mod.key);
                return (
                  <label key={mod.key} className={`flex items-center justify-between py-1 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{mod.label}</span>
                    <div
                      onClick={() => !disabled && handleModuleToggle(mod.key)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${isOn ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'} ${!disabled ? 'cursor-pointer' : ''}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-4' : ''}`} />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── SOCIAL LINKS ── */}
          <div className={sectionCls}>
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">Social Links</h2>
            <div>
              <label className={labelCls}>Facebook URL</label>
              <input value={form.facebookUrl} onChange={(e) => handleChange('facebookUrl', e.target.value)} className={inputCls} placeholder="https://facebook.com/yourpage" />
            </div>
            <div>
              <label className={labelCls}>Instagram URL</label>
              <input value={form.instagramUrl} onChange={(e) => handleChange('instagramUrl', e.target.value)} className={inputCls} placeholder="https://instagram.com/yourpage" />
            </div>
            <div>
              <label className={labelCls}>WhatsApp Number</label>
              <input value={form.whatsappNumber} onChange={(e) => handleChange('whatsappNumber', e.target.value)} className={inputCls} placeholder="+8801XXXXXXXXX" />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary hover:opacity-90 text-white font-bold text-sm py-3 rounded-xl transition-opacity shadow-sm disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {/* ── LIVE PREVIEW PANEL ── */}
        <div className="bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl shadow-sm overflow-hidden sticky top-6 h-fit">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: form.primaryColor + '20', color: form.primaryColor }}>
              {selectedType?.emoji} {selectedType?.label}
            </span>
          </div>
          <div className="p-6" style={{ '--primary': form.primaryColor, '--secondary': form.secondaryColor, fontFamily: form.fontFamily }}>
            <div className="space-y-4 max-w-sm mx-auto">
              {/* Navbar preview */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                {form.logo
                  ? <img src={form.logo} alt="logo" className="h-7 object-contain" />
                  : <span className="text-sm font-black" style={{ color: form.primaryColor }}>{form.storeName || 'Store Name'}</span>
                }
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800" />
                  <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>

              {/* Hero preview */}
              <div className="rounded-xl overflow-hidden h-24 relative flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}>
                {form.bannerImages.filter(Boolean)[0] && (
                  <img src={form.bannerImages[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                <div className="relative z-10 text-white text-center">
                  <p className="text-[10px] font-bold opacity-75 uppercase tracking-wider">{selectedType?.label}</p>
                  <p className="text-sm font-black">Welcome to {form.storeName || 'Your Store'}</p>
                  <div className="mt-1">
                    <span className="text-[10px] font-bold px-3 py-1 bg-white/20 rounded-full">Shop Now →</span>
                  </div>
                </div>
              </div>

              {/* Sample cards */}
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map(i => (
                  <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl p-2">
                    <div className="h-16 rounded-lg bg-gray-50 dark:bg-gray-900 mb-2 flex items-center justify-center">
                      <span className="text-2xl">{selectedType?.emoji}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-1" />
                    <div className="h-2 rounded w-1/2" style={{ backgroundColor: form.primaryColor + '30' }} />
                    <div className="mt-2 text-center">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: form.primaryColor }}>
                        Add to Cart
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center text-[10px] text-gray-400">
                {form.activeModules.length} module(s) active · {form.language === 'bn' ? 'বাংলা' : 'English'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreConfigPage;
