import { jest } from '@jest/globals';

/* ---------- mock setup ---------- */

process.env.JWT_SECRET = 'test-secret';

const mockCartFindOne = jest.fn();
const mockCartFind = jest.fn();

jest.unstable_mockModule('../models/Cart.js', () => ({
  default: {
    findOne: (...args) => mockCartFindOne(...args),
    find: (...args) => mockCartFind(...args),
  },
}));

jest.unstable_mockModule('../models/Product.js', () => ({
  default: { findOne: jest.fn() },
}));

/* stub auth so routes run with a fixed customer identity */
jest.unstable_mockModule('../middleware/auth.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'customerA', role: 'customer' };
    next();
  },
  authorize: (...roles) => (req, res, next) => next(),
}));

import express from 'express';
import request from 'supertest';

const cartRouter = (await import('../routes/cart.js')).default;

const app = express();
app.use('/api/v1/cart', cartRouter);

/* =============================================================
   PHASE 9 — cart data isolation
   GET /api/v1/cart must only ever query the authenticated
   user's own carts ({ user: req.user._id }). No cross-customer
   cart-item leaks.
   ============================================================= */

describe('GET /api/v1/cart — own-user isolation (Phase 9)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('with x-store-id → queries { user: own id, store } ', async () => {
    const ownCart = { _id: 'cart1', items: [{ product: 'p1', quantity: 2 }] };
    mockCartFindOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(ownCart),
    });

    const res = await request(app).get('/api/v1/cart').set('x-store-id', 'storeX');

    expect(res.status).toBe(200);
    expect(mockCartFindOne).toHaveBeenCalledWith({ user: 'customerA', store: 'storeX' });
    expect(res.body.cart).toEqual(ownCart);
  });

  test('no store-id → aggregates ONLY own carts across stores', async () => {
    const ownCartA = { items: [{ product: 'p1', quantity: 1 }] };
    const ownCartB = { items: [{ product: 'p2', quantity: 3 }] };
    mockCartFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue([ownCartA, ownCartB]),
    });

    const res = await request(app).get('/api/v1/cart');

    expect(res.status).toBe(200);
    expect(mockCartFind).toHaveBeenCalledWith({ user: 'customerA' });
    expect(res.body.cart.items).toEqual([
      { product: 'p1', quantity: 1 },
      { product: 'p2', quantity: 3 },
    ]);
  });

  test('leak guard: findOne query ALWAYS includes the user field', async () => {
    mockCartFindOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await request(app).get('/api/v1/cart').set('x-store-id', 'storeX');

    const query = mockCartFindOne.mock.calls[0][0];
    expect(query).toHaveProperty('user', 'customerA');
    expect(query).toHaveProperty('store');
  });

  test('leak guard: find query ALWAYS includes the user field', async () => {
    mockCartFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue([]),
    });

    await request(app).get('/api/v1/cart');

    const query = mockCartFind.mock.calls[0][0];
    expect(query).toHaveProperty('user', 'customerA');
  });
});