import { jest } from '@jest/globals';

/* ---------- mock setup ---------- */

const mockOrderFindOne = jest.fn();
const mockReviewSave = jest.fn();

jest.unstable_mockModule('../models/Order.js', () => ({
  default: { findOne: (...args) => mockOrderFindOne(...args) },
}));

jest.unstable_mockModule('../models/Review.js', () => ({
  default: jest.fn(function (data) {
    return {
      ...data,
      save: (...args) => mockReviewSave(...args),
    };
  }),
}));

jest.unstable_mockModule('../models/Product.js', () => ({
  default: { findById: jest.fn() },
}));

jest.unstable_mockModule('../models/Store.js', () => ({
  default: { findOne: jest.fn() },
}));

const { createReview } = await import('../controllers/reviewController.js');
const ReviewMock = (await import('../models/Review.js')).default;

function mockRequest(body) {
  return { user: { _id: 'user1', role: 'customer' }, body };
}

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const expectNextError = (next, statusCode, message) =>
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode, message }));

/* =============================================================
   PHASE 7 — review gate-keeping (negative + positive)
   Only customers with a DELIVERED order for that product
   may review. Otherwise 403 "must purchase before reviewing".
   ============================================================= */

describe('createReview — delivered-order gate (Phase 7)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockRequest({ product: 'prod1', rating: 5, comment: 'Great!' });
    res = mockResponse();
    next = jest.fn();
  });

  test('product never purchased → 403 "must purchase before reviewing", review NOT saved', async () => {
    mockOrderFindOne.mockResolvedValue(null);

    await createReview(req, res, next);

    expect(mockOrderFindOne).toHaveBeenCalledWith({
      customer: 'user1',
      orderStatus: 'delivered',
      'items.product': 'prod1',
    });
    expectNextError(next, 403, 'You must purchase before reviewing');
    expect(mockReviewSave).not.toHaveBeenCalled();
  });

  test('purchased but order NOT delivered → 403, review NOT saved', async () => {
    mockOrderFindOne.mockResolvedValue(null);

    await createReview(req, res, next);

    expectNextError(next, 403, 'You must purchase before reviewing');
    expect(mockReviewSave).not.toHaveBeenCalled();
  });

  test('delivered order for a DIFFERENT product → 403, review NOT saved', async () => {
    mockOrderFindOne.mockResolvedValue(null);

    await createReview(req, res, next);

    expectNextError(next, 403, 'You must purchase before reviewing');
    expect(mockReviewSave).not.toHaveBeenCalled();
  });

  test('delivered order exists → 201, isVerifiedPurchase true, isApproved false', async () => {
    const mockOrder = {
      store: 'store1',
      isReviewed: false,
      save: jest.fn().mockResolvedValue(true),
    };
    mockOrderFindOne.mockResolvedValue(mockOrder);
    mockReviewSave.mockResolvedValue(true);

    await createReview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockReviewSave).toHaveBeenCalled();
    expect(mockOrder.isReviewed).toBe(true);
    expect(mockOrder.save).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();

    expect(ReviewMock).toHaveBeenCalledWith({
      user: 'user1',
      product: 'prod1',
      store: 'store1',
      rating: 5,
      body: 'Great!',
      isVerifiedPurchase: true,
      isApproved: false,
    });
  });

  test('missing product field → 400, no DB lookups for order', async () => {
    req = mockRequest({ rating: 5, comment: 'Great!' });

    await createReview(req, res, next);

    expectNextError(next, 400, 'Product ID is required');
    expect(mockOrderFindOne).not.toHaveBeenCalled();
  });
});