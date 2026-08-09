import { jest } from '@jest/globals';

/* ---------- mock setup ---------- */

const mockOrderFindById = jest.fn();
const mockOrderSave = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
const mockUserCountDocuments = jest.fn();

jest.unstable_mockModule('../models/Order.js', () => ({
  default: { findById: (...args) => mockOrderFindById(...args) },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findById: (...args) => mockUserFindById(...args),
    findByIdAndUpdate: (...args) => mockUserFindByIdAndUpdate(...args),
    countDocuments: (...args) => mockUserCountDocuments(...args),
  },
}));

jest.unstable_mockModule('../models/Store.js', () => ({
  default: { findOne: jest.fn() },
}));

jest.unstable_mockModule('../models/Product.js', () => ({
  default: { findOneAndUpdate: jest.fn(), findById: jest.fn() },
}));

jest.unstable_mockModule('../models/Cart.js', () => ({
  default: { findOneAndDelete: jest.fn() },
}));

jest.unstable_mockModule('../models/Coupon.js', () => ({
  default: { findOne: jest.fn() },
}));

jest.unstable_mockModule('../utils/sendEmail.js', () => ({
  default: jest.fn().mockResolvedValue(true),
  orderConfirmationTemplate: jest.fn().mockReturnValue('<html></html>'),
  orderShippedTemplate: jest.fn().mockReturnValue('<html></html>'),
}));

jest.unstable_mockModule('../utils/sendWhatsApp.js', () => ({
  default: jest.fn().mockResolvedValue(true),
}));

jest.unstable_mockModule('../utils/paymentGateway.js', () => ({
  initiatePayment: jest.fn().mockResolvedValue({ paymentUrl: 'http://x', sessionKey: 's' }),
  verifySSLCommerzPayment: jest.fn(),
}));

jest.unstable_mockModule('../utils/invoiceGenerator.js', () => ({
  generateOrderInvoice: jest.fn().mockResolvedValue('http://localhost:5000/invoices/SW-1.pdf'),
}));

jest.unstable_mockModule('mongoose', () => ({
  default: {
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  },
}));

const { getLoyaltyPoints, getReferralInfo } = await import('../controllers/userController.js');
const { updateOrderStatus } = await import('../controllers/orderController.js');

function mockRequest(overrides = {}) {
  return { user: { _id: 'user1', role: 'superAdmin' }, params: { id: 'order1' }, body: {}, ...overrides };
}

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

/* =============================================================
   PHASE 8 — loyalty read endpoint
   GET /api/v1/users/loyalty must return points (number)
   and history (array) even when history is empty.
   ============================================================= */

describe('GET /api/v1/users/loyalty — read endpoint (Phase 8)', () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  test('user with empty history → 200, points number + history [] (no error)', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user1', loyaltyPoints: 0, loyaltyHistory: [] });

    await getLoyaltyPoints(mockRequest(), res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, points: 0, history: [] });
    expect(next).not.toHaveBeenCalled();
  });

  test('user with points earned → 200 with points and history entries', async () => {
    mockUserFindById.mockResolvedValue({
      _id: 'user1',
      loyaltyPoints: 45,
      loyaltyHistory: [{ action: 'Referral bonus', points: 50, date: new Date().toISOString() }],
    });

    await getLoyaltyPoints(mockRequest(), res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      points: 45,
      history: expect.any(Array),
    });
  });

  test('history field missing on doc → returns [] instead of crashing', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user1', loyaltyPoints: 10 });

    await getLoyaltyPoints(mockRequest(), res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, points: 10, history: [] });
  });
});

/* =============================================================
   PHASE 8 — loyalty earn on order delivered (write logic)
   updateOrderStatus → delivered must credit loyaltyPoints
   and append to loyaltyHistory.
   ============================================================= */

describe('updateOrderStatus — grants loyalty points on delivered (Phase 8)', () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  test('shipped → delivered: customer credited floor(totalAmount/100) points', async () => {
    const order = {
      _id: 'order1',
      store: 'store1',
      orderStatus: 'shipped',
      totalAmount: 1650,
      customer: { _id: 'user1', email: 'u@test.com' },
      save: mockOrderSave.mockResolvedValue(true),
    };
    order.populate = jest.fn().mockReturnValue(order);
    mockOrderFindById.mockReturnValue(order);

    await updateOrderStatus(mockRequest({ body: { status: 'delivered' } }), res, next);

    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({
        $inc: { loyaltyPoints: 16 },
        $push: {
          loyaltyHistory: expect.objectContaining({ action: 'Order delivered', points: 16, orderId: 'order1' }),
        },
      })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, order }));
    expect(next).not.toHaveBeenCalled();
  });

  test('order under 100 taka → no points granted (no $inc call)', async () => {
    const order = {
      _id: 'order1',
      store: 'store1',
      orderStatus: 'shipped',
      totalAmount: 60,
      customer: { _id: 'user1' },
      save: mockOrderSave.mockResolvedValue(true),
    };
    mockOrderFindById.mockReturnValue(order);

    await updateOrderStatus(mockRequest({ body: { status: 'delivered' } }), res, next);

    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('non-delivered status → no loyalty credit', async () => {
    const order = {
      _id: 'order1',
      store: 'store1',
      orderStatus: 'processing',
      customer: { _id: 'user1' },
      save: mockOrderSave.mockResolvedValue(true),
    };
    mockOrderFindById.mockReturnValue(order);

    await updateOrderStatus(mockRequest({ body: { status: 'shipped' } }), res, next);

    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});

/* =============================================================
   PHASE 8 — referral info endpoint
   GET /api/v1/users/referrals returns code/url/count without error
   ============================================================= */

describe('GET /api/v1/users/referrals — referral info (Phase 8)', () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

test('returns referral code, url and count', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user1', referralCode: 'ABC123' });
    mockUserCountDocuments.mockResolvedValue(2);

    await getReferralInfo(mockRequest(), res, next);

    expect(mockUserCountDocuments).toHaveBeenCalledWith({ referredBy: 'user1' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        referralCode: 'ABC123',
        referralUrl: expect.stringContaining('/register?ref=ABC123'),
        referralCount: 2,
        referredCount: 2,
        totalEarned: 100,
      })
    );
  });

  test('no referrals yet → referredCount 0, still 200 with code+url', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'user1', referralCode: 'ABC123' });
    mockUserCountDocuments.mockResolvedValue(0);

    await getReferralInfo(mockRequest(), res, next);

    expect(mockUserCountDocuments).toHaveBeenCalledWith({ referredBy: 'user1' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        referralCode: 'ABC123',
        referralUrl: expect.stringContaining('/register?ref=ABC123'),
        referralCount: 0,
        referredCount: 0,
        totalEarned: 0,
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
