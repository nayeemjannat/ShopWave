import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import asyncHandler from '../utils/asyncHandler.js';

const assertReviewStoreAccess = async (review, user) => {
  if (user.role === 'superAdmin') return;

  const product = await Product.findById(review.product).select('store');
  if (!product) {
    const error = new Error('Product not found for this review');
    error.statusCode = 404;
    throw error;
  }

  const store = await Store.findOne({ owner: user._id }).select('_id');
  if (!store || product.store.toString() !== store._id.toString()) {
    const error = new Error('Not authorized to manage this review');
    error.statusCode = 403;
    throw error;
  }
};

export const createReview = asyncHandler(async (req, res) => {
  const productId = req.body.productId || req.body.product;
  const { rating, comment } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }
  
  // Check if user has ordered and it's delivered
  const order = await Order.findOne({
    customer: req.user._id,
    orderStatus: 'delivered',
    'items.product': productId
  });

  if (!order) {
    res.status(400);
    throw new Error('You can only review products you have purchased and received');
  }

  const review = new Review({
    user: req.user._id,
    product: productId,
    store: order.store,
    rating,
    body: comment || req.body.body,
    isVerifiedPurchase: true,
    isApproved: false
  });

  await review.save();
  order.isReviewed = true;
  await order.save();
  res.status(201).json({ success: true, message: 'Review submitted, pending approval' });
});

export const getAllReviews = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role !== 'superAdmin') {
    const store = await Store.findOne({ owner: req.user._id }).select('_id');
    if (!store) {
      const error = new Error('Store not found for this admin');
      error.statusCode = 403;
      throw error;
    }
    query.store = store._id;
  }

  const reviews = await Review.find(query)
    .sort({ createdAt: -1 })
    .populate('user', 'name')
    .populate('product', 'name');

  const mapped = reviews.map((r) => ({
    ...r.toObject(),
    comment: r.body,
    status: r.isApproved ? 'approved' : r.adminNote ? 'rejected' : 'pending',
  }));

  res.status(200).json({ success: true, reviews: mapped });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  await assertReviewStoreAccess(review, req.user);

  await review.remove();
  res.status(200).json({ success: true, message: 'Review deleted' });
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await Review.find({ product: productId, isApproved: true })
    .populate('user', 'name avatar')
    .limit(10);
  
  const product = await Product.findById(productId);
  res.status(200).json({
    success: true,
    reviews,
    averageRating: product?.ratings?.average || 0,
    totalCount: product?.ratings?.count || 0
  });
});

export const approveReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  await assertReviewStoreAccess(review, req.user);
  
  review.isApproved = true;
  await review.save(); // POST-SAVE hook updates product ratings
  res.status(200).json({ success: true, message: 'Review approved' });
});

export const rejectReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  await assertReviewStoreAccess(review, req.user);

  review.isApproved = false;
  review.adminNote = req.body.adminNote || '';
  await review.save();
  res.status(200).json({ success: true, message: 'Review rejected' });
});
