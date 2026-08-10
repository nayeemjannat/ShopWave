import { jest } from '@jest/globals';

/* ---------- mock setup ---------- */

const mockOrderFindById = jest.fn();
const mockOrderPopulateStatic = jest.fn();
const mockStoreFindOne = jest.fn();

const makeOrderChain = (resolvedValue) => ({
  populate: jest.fn().mockResolvedValue(resolvedValue),
});

const makeStoreChain = (resolvedValue) => ({
  select: jest.fn().mockResolvedValue(resolvedValue),
});

jest.unstable_mockModule('../models/Order.js', () => ({
  default: {
    findById: (...args) => mockOrderFindById(...args),
    populate: (...args) => mockOrderPopulateStatic(...args),
  },
}));

jest.unstable_mockModule('../models/Store.js', () => ({
  default: { findOne: (...args) => mockStoreFindOne(...args) },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: { findByIdAndUpdate: jest.fn(), findById: jest.fn() },
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
  default: { startSession: jest.fn() },
}));

const { getOrderById, getOrderInvoice, cancelOrder } = await import('../controllers/orderController.js');

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const expectNextError = (next, statusCode, message) =>
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode, message }));

const makeOrderDoc = (customerId, storeId = 'store1') => ({
  _id: 'orderB',
  store: storeId,
  customer: { _id: customerId, toString: () => String(customerId) },
  orderNumber: 'SW-1',
  orderStatus: 'pending',
  invoiceUrl: '',
  items: [],
  save: jest.fn().mockResolvedValue(true),
});

/* =============================================================
   PHASE 9 — data isolation
   Customer A must NEVER read Customer B's order via
   GET /api/v1/orders/:id or the invoice endpoint.
   ============================================================= */

describe('getOrderById — cross-customer isolation (Phase 9)', () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  test('Customer A reading Customer B order → 403, order NOT returned', async () => {
    const orderB = makeOrderDoc('customerB');
    mockOrderFindById.mockReturnValue(makeOrderChain(orderB));
    mockOrderPopulateStatic.mockResolvedValue(orderB);

    await getOrderById({ params: { id: 'orderB' }, user: { _id: 'customerA', role: 'customer' } }, res, next);

    expectNextError(next, 403, 'Not authorized to view this order');
    expect(res.json).not.toHaveBeenCalled();
  });

  test('own order → 200 with order', async () => {
    const myOrder = makeOrderDoc('customerA');
    mockOrderFindById.mockReturnValue(makeOrderChain(myOrder));
    mockOrderPopulateStatic.mockResolvedValue(myOrder);

    await getOrderById({ params: { id: 'orderA' }, user: { _id: 'customerA', role: 'customer' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, order: myOrder }));
    expect(next).not.toHaveBeenCalled();
  });

  test('non-existent order → 404', async () => {
    mockOrderFindById.mockReturnValue(makeOrderChain(null));

    await getOrderById({ params: { id: 'nope' }, user: { _id: 'customerA', role: 'customer' } }, res, next);

    expectNextError(next, 404, 'Order not found');
  });

  test('storeAdmin of a DIFFERENT store → 403', async () => {
    const orderB = makeOrderDoc('customerB', 'store2');
    mockOrderFindById.mockReturnValue(makeOrderChain(orderB));
    mockStoreFindOne.mockReturnValue(makeStoreChain({ _id: 'store1' }));

    await getOrderById(
      { params: { id: 'orderB' }, user: { _id: 'adminA', role: 'storeAdmin' } },
      res,
      next
    );

    expectNextError(next, 403, 'Not authorized to view this order');
  });
});

describe('getOrderInvoice — cross-customer isolation (Phase 9)', () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  test('Customer A requesting Customer B invoice → 403, invoiceUrl NOT leaked', async () => {
    const orderB = makeOrderDoc('customerB');
    orderB.invoiceUrl = 'https://cdn/secret-invoice.pdf';
    mockOrderFindById.mockReturnValue(makeOrderChain(orderB));

    await getOrderInvoice({ params: { id: 'orderB' }, user: { _id: 'customerA', role: 'customer' } }, res, next);

    expectNextError(next, 403, 'Not authorized to view this order');
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('cancelOrder — cross-customer isolation (Phase 9)', () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  test('Customer A cancelling Customer B order → 403', async () => {
    const orderB = makeOrderDoc('customerB');
    mockOrderFindById.mockResolvedValue(orderB);

    await cancelOrder({ params: { id: 'orderB' }, user: { _id: 'customerA', role: 'customer' } }, res, next);

    expectNextError(next, 403, 'Not authorized to cancel this order');
    expect(orderB.save).not.toHaveBeenCalled();
  });

  test('order owner can cancel their pending order → 200', async () => {
    const myOrder = makeOrderDoc('customerA');
    myOrder.orderStatus = 'pending';
    mockOrderFindById.mockResolvedValue(myOrder);

    await cancelOrder({ params: { id: 'orderA' }, user: { _id: 'customerA', role: 'customer' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(myOrder.save).toHaveBeenCalled();
  });
});
