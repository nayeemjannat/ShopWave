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
  const product = await Product.findById(req.params.id);
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

export const searchProducts = asyncHandler(async (req, res) => {
  const { q, storeId } = req.query;
  const products = await Product.find({
    $or: [
      { $text: { $search: q } },
      { name: { $regex: q, $options: 'i' } }
    ],
    store: storeId,
    isActive: true
  });
  
  res.status(200).json({ success: true, products });
});

export const bulkImport = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Bulk import not implemented yet' });
});

export const generateDescription = asyncHandler(async (req, res) => {
  const { name, specs, storeType } = req.body;
  const description = await generateProductDescription({ name, specs, storeType });
  res.status(200).json({ success: true, description });
});
