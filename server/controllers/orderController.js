import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { initiatePayment, verifySSLCommerzPayment } from '../utils/paymentGateway.js';
import sendEmail, { orderConfirmationTemplate, orderShippedTemplate } from '../utils/sendEmail.js';
import sendWhatsApp from '../utils/sendWhatsApp.js';
import Store from '../models/Store.js';

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

const restoreOrderStock = async (order, session = null) => {
  const options = session ? { session } : {};
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, options);
  }
};

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, storeId, cartTotal = 0 } = req.body;
  const activeStoreId = storeId || req.headers['x-store-id'];

  if (!activeStoreId || !code) {
    res.status(400);
    throw new Error('Store ID and coupon code are required');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), store: activeStoreId, isActive: true });
  const validation = coupon?.isValid(req.user._id, Number(cartTotal));

  if (!coupon || !validation?.valid) {
    res.status(400);
    throw new Error(validation?.message || 'Invalid or expired coupon');
  }

  const discount = coupon.apply(Number(cartTotal));
  res.status(200).json({ success: true, discount, code: coupon.code });
});

export const placeOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode, storeId } = req.body;

  if (!items?.length) {
    res.status(400);
    throw new Error('Order must include at least one item');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, store: storeId, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, session }
      );

      if (!product) {
        res.status(400);
        throw new Error('One or more products are unavailable or out of stock');
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '',
        price: product.price,
        quantity: item.quantity,
      });
    }

    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), store: storeId, isActive: true }).session(session);
      const validation = coupon?.isValid(req.user._id, subtotal);

      if (!coupon || !validation?.valid) {
        res.status(400);
        throw new Error(validation?.message || 'Invalid or expired coupon');
      }

      discount = coupon.apply(subtotal);
      appliedCoupon = coupon;
    }

    const shippingFee = 60;
    const totalAmount = subtotal - discount + shippingFee;

    const order = new Order({
      store: storeId,
      customer: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      couponCode: appliedCoupon?.code,
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      orderStatus: 'pending',
      paymentStatus: 'pending',
      statusTimeline: [{ status: 'pending', timestamp: Date.now() }],
    });

    await order.save({ session });

    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      appliedCoupon.usedBy.push(req.user._id);
      await appliedCoupon.save({ session });
    }

    await Cart.findOneAndDelete({ user: req.user._id, store: storeId }, { session });
    await session.commitTransaction();
    session.endSession();

    const customerEmail = req.user.email;
    await sendEmail({
      to: customerEmail,
      subject: 'Order Confirmation - ShopWave',
      html: orderConfirmationTemplate(order),
    });

    const store = await Store.findById(storeId).populate('owner');
    if (store?.socialLinks?.whatsapp) {
      const msg = `🛒 New Order Received!\nOrder #: ${order.orderNumber}\nCustomer: ${req.user.name}\nTotal: ৳${order.totalAmount}\nItems: ${order.items.length}\nPayment: ${order.paymentMethod.toUpperCase()}`;
      await sendWhatsApp({ to: store.socialLinks.whatsapp, message: msg });
    }

    let paymentUrl = null;
    if (paymentMethod === 'sslcommerz') {
      const pData = await initiatePayment(store, { ...order.toObject(), customerEmail, orderId: order.orderNumber });
      paymentUrl = pData.paymentUrl;
    }

    res.status(201).json({ success: true, order, paymentUrl });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const sslcommerzSuccess = asyncHandler(async (req, res) => {
  const { tran_id, val_id, amount } = req.body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const order = await Order.findOne({ orderNumber: tran_id }).populate('store');

  if (!order) {
    return res.redirect(`${clientUrl}/order-failure`);
  }

  if (order.paymentStatus === 'paid') {
    return res.redirect(`${clientUrl}/order-success?id=${order._id}`);
  }

  try {
    const validation = await verifySSLCommerzPayment(order.store, val_id);

    if (validation.tran_id && validation.tran_id !== order.orderNumber) {
      return res.redirect(`${clientUrl}/order-failure`);
    }

    if (amount && Number(amount) !== Number(order.totalAmount)) {
      return res.redirect(`${clientUrl}/order-failure`);
    }

    order.paymentStatus = 'paid';
    order.transactionId = val_id;
    order.orderStatus = 'processing';
    order.statusTimeline.push({ status: 'processing', timestamp: Date.now() });
    await order.save();
  } catch {
    return res.redirect(`${clientUrl}/order-failure`);
  }

  res.redirect(`${clientUrl}/order-success?id=${order._id}`);
});

export const sslcommerzFailCancel = asyncHandler(async (req, res) => {
  const { tran_id } = req.body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const order = await Order.findOne({ orderNumber: tran_id });

  if (!order) {
    return res.redirect(`${clientUrl}/order-failure`);
  }

  if (order.paymentStatus === 'failed') {
    return res.redirect(`${clientUrl}/order-failure`);
  }

  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'failed';
    order.orderStatus = 'cancelled';
    order.statusTimeline.push({ status: 'cancelled', timestamp: Date.now() });
    await order.save();
    await restoreOrderStock(order);
  }

  res.redirect(`${clientUrl}/order-failure`);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).populate('items.product', 'name images price');
  res.status(200).json({ success: true, orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer', 'name email').populate('items.product', 'name images price');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'storeAdmin' && req.user.role !== 'superAdmin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  if (req.user.role === 'storeAdmin') {
    const adminStoreId = await getAdminStoreId(req.user);
    if (order.store.toString() !== adminStoreId.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }
  }

  res.status(200).json({ success: true, order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'superAdmin') {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  if (order.orderStatus !== 'pending' && order.orderStatus !== 'processing') {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  order.orderStatus = 'cancelled';
  order.statusTimeline.push({ status: 'cancelled', timestamp: Date.now() });
  await order.save();
  await restoreOrderStock(order);

  res.status(200).json({ success: true, message: 'Order cancelled successfully' });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { storeId, status, page = 1, limit = 20 } = req.query;
  const query = {};
  const adminStoreId = await getAdminStoreId(req.user);
  if (adminStoreId) query.store = adminStoreId;
  else if (storeId) query.store = storeId;
  if (status) query.orderStatus = status;

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('customer', 'name email');

  res.status(200).json({ success: true, orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const adminStoreId = await getAdminStoreId(req.user);
  if (adminStoreId && order.store.toString() !== adminStoreId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  const { status } = req.body;
  order.orderStatus = status;
  order.statusTimeline.push({ status, timestamp: Date.now() });
  await order.save();

  if (status === 'shipped' && order.customer) {
    await sendEmail({
      to: order.customer.email,
      subject: 'Your Order has been Shipped!',
      html: orderShippedTemplate(order),
    });
  }

  res.status(200).json({ success: true, order });
});
