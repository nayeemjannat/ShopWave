import { jest } from '@jest/globals';

/* ---------- mock setup ---------- */

const mockOrderFindOne = jest.fn();
const mockReviewSave = jest.fn();
const mockReviewFind = jest.fn();
const mockProductFindById = jest.fn();

jest.unstable_mockModule('../models/Order.js', () => ({
  default: { findOne: (...args) => mockOrderFindOne(...args) },
}));

jest.unstable_mockModule('../models/Review.js', () => {
  const Review = jest.fn(function (data) {
    return {
      ...data,
      save: (...args) => mockReviewSave(...args),
    };
  });
  Review.find = (...args) => mockReviewFind(...args);
  return { default: Review };
});

jest.unstable_mockModule('../models/Product.js', () => ({
  default: { findById: (...args) => mockProductFindById(...args) },
}));

jest.unstable_mockModule('../models/Store.js', () => ({
  default: { findOne: jest.fn() },
}));

const { createReview, getProductReviews } = await import('../controllers/reviewController.js');
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

/* =============================================================
   PHASE 7 — public review visibility gate
   Pending/unapproved reviews must NOT appear in public listing.
   Only isApproved:true reviews are returned.
   ============================================================= */

describe('getProductReviews — approved-only public filter (Phase 7)', () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  test('query filters isApproved: true for the requested product', async () => {
    const chain = { populate: jest.fn().mockReturnValue(undefined), limit: jest.fn().mockResolvedValue([]) };
    chain.populate.mockReturnValue(chain);
    mockReviewFind.mockReturnValue(chain);
    mockProductFindById.mockResolvedValue({ _id: 'prod1', ratings: { average: 4.5, count: 2 } });

    await getProductReviews({ params: { productId: 'prod1' } }, res, next);

    expect(mockReviewFind).toHaveBeenCalledWith({ product: 'prod1', isApproved: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ reviews: [], averageRating: 4.5, totalCount: 2 })
    );
  });

  test('only a pending review exists → public list is empty (not exposed)', async () => {
    const pendingReview = { _id: 'r1', rating: 5, body: 'Spam', isApproved: false };
    const chain = { populate: jest.fn().mockReturnValue(undefined), limit: jest.fn().mockResolvedValue([]) };
    chain.populate.mockReturnValue(chain);
    mockReviewFind.mockReturnValue(chain);
    mockProductFindById.mockResolvedValue({ _id: 'prod1', ratings: { average: 0, count: 0 } });

    await getProductReviews({ params: { productId: 'prod1' } }, res, next);

    expect(mockReviewFind).toHaveBeenCalledWith({ product: 'prod1', isApproved: true });
    expect(pendingReview.isApproved).toBe(false);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ reviews: [], totalCount: 0 })
    );
  });

  test('approved review exists → appears in public list', async () => {
    const approvedReview = { _id: 'r2', rating: 5, body: 'Great', isApproved: true };
    const chain = { populate: jest.fn().mockReturnValue(undefined), limit: jest.fn().mockResolvedValue([approvedReview]) };
    chain.populate.mockReturnValue(chain);
    mockReviewFind.mockReturnValue(chain);
    mockProductFindById.mockResolvedValue({ _id: 'prod1', ratings: { average: 5, count: 1 } });

    await getProductReviews({ params: { productId: 'prod1' } }, res, next);

    expect(mockReviewFind).toHaveBeenCalledWith({ product: 'prod1', isApproved: true });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ reviews: [approvedReview], averageRating: 5, totalCount: 1 })
    );
  });
});