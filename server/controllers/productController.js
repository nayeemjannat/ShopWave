import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateProductDescription from '../utils/aiDescription.js';

const getAdminStoreId = async (user) => {
  if (user.role === 'superAdmin') return null;
  const store = await Store.findOne({ owner: user._id }).select('_id');
  if (!store) {
    const error = new Error('Store not found for this admin');
    error.statusCode = 403;
    throw error;
  }
  return store._id;
};

export const getProducts = asyncHandler(async (req, res) => {
  const { category, brand, minPrice, maxPrice, inStock, storeId, page = 1, limit = 12, sort, isFeatured, flashSale } = req.query;

  const query = {};
  if (storeId) query.store = storeId;
  query.isActive = true;

  if (category) query.category = category;
  if (brand) query.brand = brand;
  if (isFeatured === 'true') query.isFeatured = true;
  if (flashSale === 'true') {
    query['flashSale.active'] = true;
    query['flashSale.endsAt'] = { $gt: new Date() };
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (inStock === 'true') query.stock = { $gt: 0 };

  let sortConfig = { createdAt: -1 };
  if (sort === 'price_asc') sortConfig = { price: 1 };
  if (sort === 'price_desc') sortConfig = { price: -1 };
  if (sort === 'rating') sortConfig = { 'ratings.average': -1 };

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortConfig)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.status(200).json({ success: true, count, pagination: { page: Number(page), pages: Math.ceil(count / limit), total: count }, products });
});

export const getProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error('Product not found');
  }
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.status(200).json({ success: true, product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const images = req.files ? req.files.map(f => f.path) : [];
  const adminStoreId = await getAdminStoreId(req.user);
  
  let dynamicFields = {};
  let variants = [];
  if (req.body.dynamicFields) dynamicFields = typeof req.body.dynamicFields === 'string' ? JSON.parse(req.body.dynamicFields) : req.body.dynamicFields;
  if (req.body.variants) variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;

  const product = new Product({
    ...req.body,
    store: adminStoreId || req.body.store,
    images,
    dynamicFields,
    variants
  });

  await product.save();
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const adminStoreId = await getAdminStoreId(req.user);
  if (adminStoreId && product.store.toString() !== adminStoreId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  const { store, ...updates } = req.body;
  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.status(200).json({ success: true, product: updatedProduct });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const adminStoreId = await getAdminStoreId(req.user);
  if (adminStoreId && product.store.toString() !== adminStoreId.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }
  product.isActive = false;
  await product.save();
  res.status(200).json({ success: true, message: 'Product deleted' });
});

const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
};

const bestWordSimilarity = (term, haystack) => {
  let best = 0;
  for (const word of haystack.split(/\s+/)) {
    const dist = levenshtein(term, word);
    const sim = 1 - dist / Math.max(term.length, word.length);
    if (sim > best) best = sim;
  }
  return best;
};

export const searchProducts = asyncHandler(async (req, res) => {
  const { q, storeId } = req.query;
  const query = { isActive: true };
  if (storeId) query.store = storeId;

  if (!q) {
    const products = await Product.find(query);
    return res.status(200).json({ success: true, products });
  }

  const rgx = new RegExp(q, 'i');
  const exact = await Product.find({
    ...query,
    $or: [
      { name: rgx },
      { nameBn: rgx },
      { brand: rgx },
      { description: rgx },
      { tags: rgx },
    ],
  });
  if (exact.length) {
    return res.status(200).json({ success: true, products: exact });
  }

  const candidates = await Product.find(query).select('name nameBn brand tags');
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = [];
  for (const p of candidates) {
    const haystacks = [p.name, p.nameBn, p.brand, (p.tags || []).join(' ')]
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    let best = 0;
    for (const term of terms) {
      for (const hay of haystacks) {
        const sim = bestWordSimilarity(term, hay);
        if (sim > best) best = sim;
      }
    }
    if (best >= 0.6) scored.push({ product: p, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  res.status(200).json({ success: true, products: scored.map((s) => s.product) });
});

export const bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('CSV file is required');
  }

  const adminStoreId = await getAdminStoreId(req.user);
  const csvContent = req.file.buffer.toString('utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });

  const imported = [];
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2;

    if (!row.name || !row.price || !row.category) {
      errors.push({ row: rowNum, message: 'Missing required fields (name, price, category)' });
      continue;
    }

    const price = Number(row.price);
    if (isNaN(price) || price < 0) {
      errors.push({ row: rowNum, message: `Invalid price "${row.price}"` });
      continue;
    }

    const stock = row.stock ? Number(row.stock) : 0;
    if (isNaN(stock) || stock < 0) {
      errors.push({ row: rowNum, message: `Invalid stock "${row.stock}"` });
      continue;
    }

    let dynamicFields = {};
    if (row.dynamicFields) {
      try {
        dynamicFields = JSON.parse(row.dynamicFields);
      } catch {
        errors.push({ row: rowNum, message: `Invalid dynamicFields JSON "${row.dynamicFields}"` });
        continue;
      }
    }

    const tags = row.tags ? row.tags.split('|').map(t => t.trim()).filter(Boolean) : [];
    const isFeatured = row.isFeatured === 'true' || row.isFeatured === '1';

    try {
      const product = new Product({
        store: adminStoreId,
        name: row.name,
        nameBn: row.nameBn || '',
        description: row.description || '',
        price,
        comparePrice: row.comparePrice ? Number(row.comparePrice) : undefined,
        category: row.category,
        brand: row.brand || '',
        stock,
        sku: row.sku || undefined,
        images: row.images ? row.images.split('|').map(u => u.trim()).filter(Boolean) : [],
        isFeatured,
        tags,
        dynamicFields,
      });

      await product.save();
      imported.push({ row: rowNum, _id: product._id, name: product.name });
    } catch (err) {
      errors.push({ row: rowNum, message: err.message });
    }
  }

  res.status(201).json({
    success: true,
    importedCount: imported.length,
    failedCount: errors.length,
    imported,
    errors,
  });
});

export const generateDescription = asyncHandler(async (req, res) => {
  const { name, specs, storeType } = req.body;
  const description = await generateProductDescription({ name, specs, storeType });
  res.status(200).json({ success: true, description });
});
