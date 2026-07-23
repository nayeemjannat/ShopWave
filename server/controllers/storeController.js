import Store from '../models/Store.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';

const getOwnedStore = async (user) => {
  const store = await Store.findOne({ owner: user._id });
  if (!store) {
    const error = new Error('Store not found');
    error.statusCode = 404;
    throw error;
  }
  return store;
};

const formatCoupon = (coupon) => ({
  _id: coupon._id,
  code: coupon.code,
  discountType: coupon.discountType === 'percent' ? 'percentage' : 'fixed',
  discountValue: coupon.value,
  minOrderAmount: coupon.minOrder,
  endDate: coupon.expiresAt,
  usageLimit: coupon.maxUses,
  usedCount: coupon.usedCount,
  isActive: coupon.isActive,
});

export const getStoreConfig = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const storeId = req.headers['x-store-id'];

  let store;
  if (slug) {
    store = await Store.findOne({ slug }).select('-payment.storePassword');
  } else if (storeId) {
    store = await Store.findById(storeId).select('-payment.storePassword');
  }

  if (!store || !store.isActive) {
    res.status(404);
    throw new Error('Store not found or inactive');
  }

  res.status(200).json({ success: true, config: store.config, storeType: store.storeType, name: store.name, id: store._id });
});

export const updateStoreConfig = asyncHandler(async (req, res) => {
  const store = await getOwnedStore(req.user);

  // storeName goes to the top-level Store.name field, not into config
  if (req.body.config?.storeName) {
    store.name = req.body.config.storeName;
  }

  if (req.body.config) {
    const { storeName, ...configFields } = req.body.config;
    store.config = { ...store.config, ...configFields };
  }

  await store.save();
  res.status(200).json({
    success: true,
    name: store.name,
    config: store.config,
    storeType: store.storeType,
  });
});

export const getAllStores = asyncHandler(async (req, res) => {
  const stores = await Store.find({})
    .populate('owner', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    stores: stores.map(s => ({
      _id: s._id,
      name: s.name,
      slug: s.slug,
      storeType: s.storeType,
      isActive: s.isActive,
      owner: s.owner,
      subscription: s.subscription,
      createdAt: s.createdAt,
    })),
  });
});

export const getCoupons = asyncHandler(async (req, res) => {
  const store = await getOwnedStore(req.user);
  const coupons = await Coupon.find({ store: store._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, coupons: coupons.map(formatCoupon) });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const store = await getOwnedStore(req.user);
  const { code, discountType, discountValue, minOrderAmount, endDate, usageLimit } = req.body;

  if (!code || !discountValue || !endDate) {
    res.status(400);
    throw new Error('Code, discount value, and expiry date are required');
  }

  const coupon = await Coupon.create({
    store: store._id,
    code: code.toUpperCase(),
    discountType: discountType === 'percentage' ? 'percent' : 'flat',
    value: Number(discountValue),
    minOrder: Number(minOrderAmount) || 0,
    expiresAt: new Date(endDate),
    maxUses: Number(usageLimit) || 1,
  });

  res.status(201).json({ success: true, coupon: formatCoupon(coupon) });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const store = await getOwnedStore(req.user);
  const coupon = await Coupon.findOne({ _id: req.params.id, store: store._id });

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  await coupon.deleteOne();
  res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
});

const buildDateRange = (period) => {
  let startDate = new Date();
  if (period === '7d') startDate.setDate(startDate.getDate() - 7);
  else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
  else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
  else startDate = new Date(0);
  return startDate;
};

const buildAnalyticsResponse = async (matchStage) => {
  // Revenue & orders
  const stats = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$paymentStatus',
        totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
        count: { $sum: 1 }
      }
    }
  ]);

  let totalRevenue = 0;
  let totalOrders = 0;
  stats.forEach(s => {
    totalRevenue += s.totalRevenue;
    totalOrders += s.count;
  });

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    { $match: matchStage },
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } }
  ]);

  // Daily revenue (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailyRevenue = await Order.aggregate([
    { $match: { ...matchStage, createdAt: { $gte: sevenDaysAgo }, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', revenue: 1, _id: 0 } }
  ]);

  // Top selling products
  const topProducts = await Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
  ]);

  // Recent orders
  const recentOrders = await Order.find(matchStage)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .lean();

  return {
    metrics: {
      revenue: { total: totalRevenue, change: 0 },
      orders: { total: totalOrders, change: 0 },
      products: 0,
      customers: { total: 0, change: 0 },
    },
    dailyRevenue,
    ordersByStatus,
    topProducts,
    recentOrders,
  };
};

export const getAnalytics = asyncHandler(async (req, res) => {
  const store = await getOwnedStore(req.user);
  const { period = '30d' } = req.query;
  const startDate = buildDateRange(period);
  const matchStage = { store: store._id, createdAt: { $gte: startDate } };

  const analytics = await buildAnalyticsResponse(matchStage);
  analytics.metrics.products = await Product.countDocuments({ store: store._id, isActive: true });
  analytics.metrics.customers.total = await Order.distinct('user', { store: store._id }).then(u => u.length);

  res.status(200).json({ success: true, ...analytics });
});

export const getGlobalAnalytics = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const startDate = buildDateRange(period);
  const matchStage = { createdAt: { $gte: startDate } };

  const analytics = await buildAnalyticsResponse(matchStage);
  analytics.metrics.products = await Product.countDocuments({ isActive: true });
  analytics.metrics.customers.total = await User.countDocuments({ role: 'customer' });
  analytics.stores = await Store.countDocuments({ isActive: true });

  res.status(200).json({ success: true, ...analytics });
});

export const createStore = asyncHandler(async (req, res) => {
  const { name, storeType, ownerId } = req.body;
  const store = new Store({ name, storeType, owner: ownerId || req.user._id });
  await store.save();
  res.status(201).json({ success: true, store });
});

export const createStoreWithAdmin = asyncHandler(async (req, res) => {
  const { name, slug, storeType, ownerName, ownerEmail, ownerPassword } = req.body;

  if (!name || !ownerEmail || !ownerPassword) {
    res.status(400);
    throw new Error('Store name, owner email and owner password are required');
  }

  const existingUser = await User.findOne({ email: ownerEmail });
  if (existingUser) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const owner = new User({
    name: ownerName || ownerEmail.split('@')[0],
    email: ownerEmail,
    password: ownerPassword,
    role: 'storeAdmin',
  });
  owner.referralCode = owner.generateReferralCode();
  await owner.save();

  const store = new Store({ name, storeType, owner: owner._id });
  if (slug) store.slug = slug;
  await store.save();

  res.status(201).json({
    success: true,
    store,
    owner: { _id: owner._id, name: owner.name, email: owner.email, role: owner.role },
  });
});

export const getPaymentCredentials = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }

  res.status(200).json({
    success: true,
    payment: {
      provider: store.payment?.provider || 'sslcommerz',
      storeId: store.payment?.storeId || '',
      storePassword: store.payment?.storePassword || '',
      isLive: store.payment?.isLive || false,
      cod: {
        enabled: store.payment?.cod?.enabled !== false,
        fee: store.payment?.cod?.fee || 0,
      },
    },
  });
});

export const updatePaymentCredentials = asyncHandler(async (req, res) => {
  const { provider, storeId, storePassword, isLive, cod } = req.body;
  const store = await Store.findById(req.params.id);

  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }

  store.payment = {
    provider: provider || store.payment.provider,
    storeId,
    storePassword,
    isLive,
    cod: {
      enabled: cod?.enabled !== false,
      fee: Number(cod?.fee) || 0,
    },
  };
  await store.save();

  console.log(`Store ${store.name} payment activated by admin`);
  res.status(200).json({ success: true, message: 'Payment credentials updated.' });
});
