import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStoreId, selectStoreType } from '../../features/store/storeSlice';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

// ── Dynamic fields per store type (PRD Section 11) ──────────────────────────
const DYNAMIC_FIELDS = {
  electronics: [
    { key: 'model', label: 'Model', type: 'text', placeholder: 'Galaxy A54 5G' },
    { key: 'ram', label: 'RAM', type: 'select', options: ['2GB','3GB','4GB','6GB','8GB','12GB','16GB','32GB'] },
    { key: 'storage', label: 'Storage', type: 'select', options: ['16GB','32GB','64GB','128GB','256GB','512GB','1TB'] },
    { key: 'processor', label: 'Processor', type: 'text', placeholder: 'Snapdragon 695' },
    { key: 'battery', label: 'Battery (mAh)', type: 'number', placeholder: '5000' },
    { key: 'display', label: 'Display', type: 'text', placeholder: '6.5" AMOLED 120Hz' },
    { key: 'camera', label: 'Camera', type: 'text', placeholder: '50MP + 12MP + 5MP' },
    { key: 'warranty', label: 'Warranty', type: 'select', options: ['No Warranty','3 Months','6 Months','1 Year','2 Years'] },
  ],
  clothing: [
    { key: 'material', label: 'Material', type: 'text', placeholder: 'Cotton, Polyester...' },
    { key: 'sizes', label: 'Available Sizes', type: 'multiselect', options: ['XS','S','M','L','XL','XXL','3XL','4XL'] },
    { key: 'colors', label: 'Colors', type: 'tags', placeholder: 'Red, Blue, Black...' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Men','Women','Unisex','Kids','Boys','Girls'] },
    { key: 'season', label: 'Season', type: 'select', options: ['All Season','Summer','Winter','Monsoon','Spring'] },
    { key: 'fit', label: 'Fit', type: 'select', options: ['Regular','Slim','Oversized','Relaxed'] },
  ],
  beauty: [
    { key: 'skinType', label: 'Skin Type', type: 'multiselect', options: ['All Skin Types','Oily','Dry','Combination','Sensitive','Normal'] },
    { key: 'volume', label: 'Volume (ml)', type: 'number', placeholder: '50' },
    { key: 'ingredients', label: 'Key Ingredients', type: 'tags', placeholder: 'Niacinamide, Hyaluronic Acid...' },
    { key: 'certifications', label: 'Certifications', type: 'tags', placeholder: 'Halal, Vegan, Cruelty-free...' },
    { key: 'shelfLife', label: 'Shelf Life', type: 'text', placeholder: '24 months' },
  ],
  grocery: [
    { key: 'weight', label: 'Weight / Quantity', type: 'number', placeholder: '1' },
    { key: 'unit', label: 'Unit', type: 'select', options: ['kg','g','L','ml','pcs','dozen','packet','bag'] },
    { key: 'origin', label: 'Origin Country', type: 'text', placeholder: 'Bangladesh' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { key: 'storage', label: 'Storage Instructions', type: 'text', placeholder: 'Keep refrigerated' },
  ],
  digital: [
    { key: 'fileFormat', label: 'File Format', type: 'text', placeholder: 'PDF, ZIP, PSD' },
    { key: 'fileSize', label: 'File Size', type: 'text', placeholder: '25 MB' },
    { key: 'licenseType', label: 'License Type', type: 'select', options: ['Personal Use Only','Commercial Use','Extended License','Open Source'] },
    { key: 'downloadLimit', label: 'Download Limit', type: 'number', placeholder: '3' },
    { key: 'downloadUrl', label: 'Download URL (hidden)', type: 'text', placeholder: 'https://cdn.example.com/file.zip' },
  ],
};

const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-transparent text-gray-900 dark:text-white outline-none focus:border-primary transition-colors';
const labelCls = 'block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1';
const sectionCls = 'bg-white dark:bg-[#151515] border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-sm space-y-4';

// ── Dynamic field renderers ──────────────────────────────────────────────────
const DynamicField = ({ field, value, onChange }) => {
  if (field.type === 'select') {
    return (
      <select
        value={value || ''}
        onChange={e => onChange(field.key, e.target.value)}
        className={inputCls}
      >
        <option value="">— Select —</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-wrap gap-2">
        {field.options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const next = active ? selected.filter(v => v !== opt) : [...selected, opt];
                onChange(field.key, next);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${
                active
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === 'tags') {
    const tags = Array.isArray(value) ? value : (value ? [value] : []);
    const [inputVal, setInputVal] = useState('');
    const addTag = () => {
      const trimmed = inputVal.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange(field.key, [...tags, trimmed]);
      }
      setInputVal('');
    };
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 min-h-[28px]">
          {tags.map(t => (
            <span key={t} className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              {t}
              <button type="button" onClick={() => onChange(field.key, tags.filter(x => x !== t))} className="text-primary/60 hover:text-primary">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className={inputCls}
            placeholder={field.placeholder || 'Type and press Enter'}
          />
          <button type="button" onClick={addTag} className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex-shrink-0">
            Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={value || ''}
      onChange={e => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
      className={inputCls}
      placeholder={field.placeholder || ''}
    />
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
export const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const storeId = useSelector(selectStoreId);
  const storeType = useSelector(selectStoreType);
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    nameBn: '',
    price: '',
    discountedPrice: '',
    category: '',
    brand: '',
    description: '',
    stock: 1,
    isFeatured: false,
    images: [''],
    dynamicFields: {},
    flashSale: { isActive: false, salePrice: '', endDate: '' },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/v1/products/${id}`, { signal: controller.signal });
        if (res.success && res.product) {
          const p = res.product;
          setForm({
            name: p.name || '',
            nameBn: p.nameBn || '',
            price: p.price || '',
            discountedPrice: p.comparePrice || p.discountedPrice || '',
            category: p.category || '',
            brand: p.brand || '',
            description: p.description || '',
            stock: p.stock || 1,
            isFeatured: p.isFeatured || false,
            images: p.images?.length ? p.images : [''],
            dynamicFields: p.dynamicFields || {},
            flashSale: p.flashSale?.active
              ? { isActive: true, salePrice: p.flashSale.discountPct || '', endDate: p.flashSale.endsAt?.slice(0, 16) || '' }
              : { isActive: false, salePrice: '', endDate: '' },
          });
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          toast.error('Failed to load product');
          navigate('/admin/products');
        }
      } finally {
        setIsFetching(false);
      }
    })();
    return () => controller.abort();
  }, [id, isEdit, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('flashSale.')) {
      const key = name.split('.')[1];
      setForm(prev => ({ ...prev, flashSale: { ...prev.flashSale, [key]: type === 'checkbox' ? checked : value } }));
    } else if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }
  }, []);

  const handleDynamicField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, dynamicFields: { ...prev.dynamicFields, [key]: value } }));
  }, []);

  const handleImageChange = (idx, value) => {
    setForm(prev => { const imgs = [...prev.images]; imgs[idx] = value; return { ...prev, images: imgs }; });
  };
  const addImageField = () => setForm(prev => ({ ...prev, images: [...prev.images, ''] }));
  const removeImageField = (idx) => {
    setForm(prev => { const imgs = prev.images.filter((_, i) => i !== idx); return { ...prev, images: imgs.length ? imgs : [''] }; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    setIsLoading(true);
    try {
      const payload = {
        name: form.name,
        nameBn: form.nameBn || undefined,
        price: Number(form.price),
        comparePrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
        category: form.category,
        brand: form.brand,
        description: form.description,
        stock: Number(form.stock),
        isFeatured: form.isFeatured,
        store: storeId,
        images: form.images.filter(Boolean),
        dynamicFields: form.dynamicFields,
        flashSale: form.flashSale.isActive
          ? { active: true, discountPct: Number(form.flashSale.salePrice), startsAt: new Date().toISOString(), endsAt: form.flashSale.endDate }
          : { active: false },
      };

      if (isEdit) {
        await axiosInstance.put(`/api/v1/products/${id}`, payload);
        toast.success('Product updated!');
      } else {
        await axiosInstance.post('/api/v1/products', payload);
        toast.success('Product created!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicFieldDefs = DYNAMIC_FIELDS[storeType] || [];

  if (isFetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── BASIC INFO ── */}
        <div className={sectionCls}>
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Product Name (English) *</label>
              <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Samsung Galaxy A54" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Product Name (Bangla)</label>
              <input name="nameBn" value={form.nameBn} onChange={handleChange} className={inputCls} placeholder="স্যামসাং গ্যালাক্সি এ৫৪" />
            </div>
            <div>
              <label className={labelCls}>Price (৳) *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} className={inputCls} placeholder="35000" />
            </div>
            <div>
              <label className={labelCls}>Compare Price (৳)</label>
              <input name="discountedPrice" type="number" value={form.discountedPrice} onChange={handleChange} className={inputCls} placeholder="Original price (shows strikethrough)" />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input name="category" value={form.category} onChange={handleChange} className={inputCls} placeholder="smartphones" />
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange} className={inputCls} placeholder="Samsung" />
            </div>
            <div>
              <label className={labelCls}>Stock</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} className={inputCls} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="rounded border-gray-300 text-primary w-4 h-4" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Featured Product</span>
              </label>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" rows="3" value={form.description} onChange={handleChange} className={inputCls + ' resize-none'} placeholder="Product description..." />
          </div>
        </div>

        {/* ── DYNAMIC FIELDS (store-type aware) ── */}
        {dynamicFieldDefs.length > 0 && (
          <div className={sectionCls}>
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">
                {storeType === 'electronics' && '📱 Electronics Specs'}
                {storeType === 'clothing' && '👗 Clothing Details'}
                {storeType === 'beauty' && '✨ Beauty Details'}
                {storeType === 'grocery' && '🛒 Grocery Details'}
                {storeType === 'digital' && '💾 Digital Product Details'}
              </h2>
              <p className="text-[10px] text-gray-400 mt-1">Saved to product's dynamicFields — shown in the Specifications tab on the storefront.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dynamicFieldDefs.map(field => (
                <div key={field.key} className={['multiselect','tags'].includes(field.type) ? 'md:col-span-2' : ''}>
                  <label className={labelCls}>{field.label}</label>
                  <DynamicField
                    field={field}
                    value={form.dynamicFields[field.key]}
                    onChange={handleDynamicField}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── IMAGES ── */}
        <div className={sectionCls}>
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-900 pb-2">Images (URLs)</h2>
          <p className="text-[10px] text-gray-400">Paste Cloudinary or any public image URL. First image is used as the product thumbnail.</p>
          {form.images.map((img, idx) => (
            <div key={idx} className="flex items-center gap-2 mt-2">
              {img && <img src={img} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-100 dark:border-gray-800 flex-shrink-0" onError={e => { e.target.style.display='none'; }} />}
              <input value={img} onChange={e => handleImageChange(idx, e.target.value)} className={inputCls} placeholder="https://res.cloudinary.com/..." />
              {form.images.length > 1 && (
                <button type="button" onClick={() => removeImageField(idx)} className="text-red-400 text-xs font-bold flex-shrink-0">✕</button>
              )}
              {idx === form.images.length - 1 && (
                <button type="button" onClick={addImageField} className="text-primary text-xs font-bold flex-shrink-0 whitespace-nowrap">+ Add</button>
              )}
            </div>
          ))}
        </div>

        {/* ── FLASH SALE ── */}
        <div className={sectionCls}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="flashSale.isActive" checked={form.flashSale.isActive} onChange={handleChange} className="rounded border-gray-300 text-primary w-4 h-4" />
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">⚡ Enable Flash Sale</span>
          </label>
          {form.flashSale.isActive && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className={labelCls}>Discount % (e.g. 20 for 20% off)</label>
                <input name="flashSale.salePrice" type="number" value={form.flashSale.salePrice} onChange={handleChange} className={inputCls} placeholder="20" />
              </div>
              <div>
                <label className={labelCls}>Sale Ends At</label>
                <input name="flashSale.endDate" type="datetime-local" value={form.flashSale.endDate} onChange={handleChange} className={inputCls} />
              </div>
              {form.flashSale.salePrice && form.price && (
                <div className="col-span-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2">
                  Price will show as <span className="font-bold text-primary">৳{Math.round(Number(form.price) * (1 - Number(form.flashSale.salePrice) / 100)).toLocaleString()}</span>
                  {' '}(was <span className="line-through">৳{Number(form.price).toLocaleString()}</span>)
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SUBMIT ── */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:opacity-90 text-white font-bold text-sm px-8 py-3 rounded-xl transition-opacity shadow-sm disabled:opacity-60"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
