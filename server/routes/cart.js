import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const storeId = req.headers['x-store-id'];
  let cart;
  if (storeId) {
    cart = await Cart.findOne({ user: req.user._id, store: storeId }).populate('items.product', 'name price images stock');
    if (!cart) cart = { items: [] };
  } else {
    // No storeId: aggregate all carts for this user
    const carts = await Cart.find({ user: req.user._id }).populate('items.product', 'name price images stock');
    const allItems = carts.flatMap(c => c.items || []);
    cart = { items: allItems };
  }
  res.status(200).json({ success: true, cart });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { productId, quantity, variant } = req.body;
  const storeId = req.headers['x-store-id'];
  if (!storeId) {
    return res.status(400).json({ success: false, message: 'Store ID is required' });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
  }

  const product = await Product.findOne({ _id: productId, store: storeId, isActive: true });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found for this store' });
  }
  
  let cart = await Cart.findOne({ user: req.user._id, store: storeId });
  if (!cart) {
    cart = new Cart({ user: req.user._id, store: storeId, items: [] });
  }

  const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);
  const nextQuantity = itemIndex > -1 ? cart.items[itemIndex].quantity + quantity : quantity;
  if (product.stock < nextQuantity) {
    return res.status(400).json({ success: false, message: 'Not enough stock available' });
  }

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity, variant });
  }

  await cart.save();
  res.status(200).json({ success: true, cart });
}));

router.put('/:itemId', asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const storeId = req.headers['x-store-id'];
  if (!storeId) {
    return res.status(400).json({ success: false, message: 'Store ID is required' });
  }
  if (!Number.isInteger(quantity)) {
    return res.status(400).json({ success: false, message: 'Quantity must be an integer' });
  }

  const cart = await Cart.findOne({ user: req.user._id, store: storeId });
  
  if (cart) {
    const itemIndex = cart.items.findIndex(p => p._id.toString() === req.params.itemId);
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        const product = await Product.findOne({ _id: cart.items[itemIndex].product, store: storeId, isActive: true });
        if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found for this store' });
        }
        if (product.stock < quantity) {
          return res.status(400).json({ success: false, message: 'Not enough stock available' });
        }
        cart.items[itemIndex].quantity = quantity;
      }
      await cart.save();
      return res.status(200).json({ success: true, cart });
    }
  }
  res.status(404).json({ success: false, message: 'Item not found in cart' });
}));

router.delete('/:itemId', asyncHandler(async (req, res) => {
  const storeId = req.headers['x-store-id'];
  if (!storeId) {
    return res.status(400).json({ success: false, message: 'Store ID is required' });
  }
  const cart = await Cart.findOne({ user: req.user._id, store: storeId });
  
  if (cart) {
    cart.items = cart.items.filter(p => p._id.toString() !== req.params.itemId);
    await cart.save();
    return res.status(200).json({ success: true, cart });
  }
  res.status(404).json({ success: false, message: 'Cart not found' });
}));

export default router;
