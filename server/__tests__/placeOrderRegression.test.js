import { jest } from '@jest/globals';

/* ---------- mock setup ---------- */

const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

const mockProduct = {
  _id: 'prod1',
  name: 'Test Product',
  price: 500,
  images: ['img.jpg'],
  stock: 10,
};

jest.unstable_mockModule('mongoose', () => ({
  default: {
    startSession: jest.fn().mockResolvedValue(mockSession),
  },
}));

jest.unstable_mockModule('../models/Product.js', () => ({
  default: { findOneAndUpdate: jest.fn() },
}));

jest.unstable_mockModule('../models/Cart.js', () => ({
  default: { findOneAndDelete: jest.fn() },
}));

const ORDER_NUMBER = 'SW-1700000000000';

jest.unstable_mockModule('../models/Order.js', () => ({
  default: jest.fn(function (data) {
    const instance = {
      ...data,
      orderNumber: ORDER_NUMBER,
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({ ...data, orderNumber: ORDER_NUMBER }),
    };
    return instance;
  }),
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
  initiatePayment: jest.fn().mockResolvedValue({
    paymentUrl: 'https://sandbox.sslcommerz.com/gw/process/abc123',
    sessionKey: 'session_xyz',
  }),
  verifySSLCommerzPayment: jest.fn(),
}));

jest.unstable_mockModule('../models/Coupon.js', () => ({
  default: { findOne: jest.fn() },
}));

jest.unstable_mockModule('../models/Store.js', () => ({
  default: { findById: jest.fn() },
}));

/* ---------- imports ---------- */

const Product = (await import('../models/Product.js')).default;
const Cart = (await import('../models/Cart.js')).default;
const Order = (await import('../models/Order.js')).default;
const sendEmail = (await import('../utils/sendEmail.js')).default;
const sendWhatsApp = (await import('../utils/sendWhatsApp.js')).default;
const { initiatePayment } = await import('../utils/paymentGateway.js');
const { placeOrder } = await import('../controllers/orderController.js');
const Store = (await import('../models/Store.js')).default;

/* ---------- helpers ---------- */

function makeStoreDoc(overrides = {}) {
  return {
    _id: 'store1',
    name: 'Test Store',
    socialLinks: { whatsapp: '+8801700000000' },
    payment: {
      provider: 'sslcommerz',
      storeId: 'live_mid',
      storePassword: 'live_mpass',
      isLive: false,
      cod: { enabled: true, fee: 0 },
    },
    storeType: 'general',
    ...overrides,
  };
}

function makeReq(overrides = {}) {
  return {
    user: { _id: 'user1', name: 'Nayeem', email: 'nayeem@test.com' },
    body: {
      items: [{ product: 'prod1', quantity: 2 }],
      shippingAddress: {
        fullName: 'Nayeem',
        phone: '01700000000',
        address: 'Dhaka',
        city: 'Dhaka',
        district: 'Dhaka',
        postalCode: '1200',
      },
      paymentMethod: 'cod',
      storeId: 'store1',
      ...overrides,
    },
  };
}

/* ---------- COD flow tests ---------- */

describe('placeOrder — COD regression', () => {
  let req, res, next;

  beforeEach(() => {
    const storeDoc = makeStoreDoc();
    Product.findOneAndUpdate.mockResolvedValue(mockProduct);
    Cart.findOneAndDelete.mockResolvedValue(true);
    Store.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(storeDoc),
    });

    req = makeReq();
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('places COD order with orderStatus:pending, no paymentUrl', async () => {
    await placeOrder(req, res, next);

    const savedData = Order.mock.calls[0][0];
    expect(savedData.orderStatus).toBe('pending');
    expect(savedData.paymentStatus).toBe('pending');
    expect(savedData.paymentMethod).toBe('cod');

    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'prod1', stock: { $gte: 2 } }),
      { $inc: { stock: -2 } },
      expect.objectContaining({ session: mockSession }),
    );

    const instance = Order.mock.results[0].value;
    expect(instance.save).toHaveBeenCalledWith({ session: mockSession });
    expect(Cart.findOneAndDelete).toHaveBeenCalledWith(
      { user: 'user1', store: 'store1' },
      { session: mockSession },
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(initiatePayment).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, paymentUrl: null }),
    );
  });

  test('COD order sends email + WhatsApp notification', async () => {
    await placeOrder(req, res, next);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'nayeem@test.com', subject: 'Order Confirmation - ShopWave' }),
    );
    expect(sendWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({ to: '+8801700000000' }),
    );
  });

  test('COD order — no WhatsApp when store has no number', async () => {
    const storeDoc = makeStoreDoc({ socialLinks: {} });
    Store.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(storeDoc),
    });

    await placeOrder(req, res, next);

    expect(sendWhatsApp).not.toHaveBeenCalled();
  });
});

/* ---------- SSLCommerz flow tests ---------- */

describe('placeOrder — SSLCommerz regression', () => {
  let req, res, next;

  beforeEach(() => {
    const storeDoc = makeStoreDoc({ payment: { ...makeStoreDoc().payment, isLive: true } });
    Product.findOneAndUpdate.mockResolvedValue(mockProduct);
    Cart.findOneAndDelete.mockResolvedValue(true);
    Store.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(storeDoc),
    });

    req = makeReq({ paymentMethod: 'sslcommerz' });
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('SSLCommerz order — orderStatus:pending + paymentUrl returned', async () => {
    await placeOrder(req, res, next);

    const savedData = Order.mock.calls[0][0];
    expect(savedData.orderStatus).toBe('pending');
    expect(savedData.paymentMethod).toBe('sslcommerz');

    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'store1' }),
      expect.objectContaining({ orderId: expect.any(String) }),
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        paymentUrl: 'https://sandbox.sslcommerz.com/gw/process/abc123',
      }),
    );
  });

  test('passes store payment config (isLive, storeId, storePassword) to initiatePayment', async () => {
    await placeOrder(req, res, next);

    const storeArg = initiatePayment.mock.calls[0][0];
    expect(storeArg.payment.isLive).toBe(true);
    expect(storeArg.payment.storeId).toBe('live_mid');
    expect(storeArg.payment.storePassword).toBe('live_mpass');
  });
});

/* ---------- validation edge cases ---------- */

describe('placeOrder — validation edge cases', () => {
  let req, res, next;

  beforeEach(() => {
    Product.findOneAndUpdate.mockResolvedValue(mockProduct);
    Cart.findOneAndDelete.mockResolvedValue(true);
    Store.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeStoreDoc()),
    });

    req = makeReq();
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('empty items returns 400', async () => {
    req.body.items = [];
    await placeOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Order must include at least one item' }),
    );
  });

  test('out of stock product returns 400', async () => {
    Product.findOneAndUpdate.mockResolvedValue(null);

    await placeOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'One or more products are unavailable or out of stock' }),
    );
  });

  test('coupon query does not fail when no couponCode provided', async () => {
    await placeOrder(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    const orderData = Order.mock.calls[0][0];
    expect(orderData.couponCode).toBeUndefined();
    expect(orderData.discount).toBe(0);
    expect(orderData.totalAmount).toBe(500 * 2 + 60); // subtotal + shipping
  });
});
