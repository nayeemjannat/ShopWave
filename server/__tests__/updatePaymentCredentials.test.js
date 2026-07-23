import { jest } from '@jest/globals';

const mockSave = jest.fn();
const mockStoreData = () => ({
  _id: 'store123',
  name: 'Test Store',
  payment: {
    provider: 'sslcommerz',
    storeId: '',
    storePassword: '',
    isLive: false,
    cod: { enabled: true, fee: 0 },
  },
  save: mockSave,
});

jest.unstable_mockModule('../models/Store.js', () => ({
  default: { findById: jest.fn() },
}));

const Store = (await import('../models/Store.js')).default;
const { updatePaymentCredentials } = await import('../controllers/storeController.js');

describe('updatePaymentCredentials (Go Live flow)', () => {
  let req, res, next, mockStore;

  beforeEach(() => {
    mockStore = mockStoreData();
    mockSave.mockResolvedValue(true);
    Store.findById.mockResolvedValue(mockStore);

    req = { params: { id: 'store123' }, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sets isLive=true and updates provider credentials', async () => {
    req.body = {
      provider: 'sslcommerz',
      storeId: 'live_merchant_id',
      storePassword: 'live_merchant_pass',
      isLive: true,
      cod: { enabled: true, fee: 0 },
    };

    await updatePaymentCredentials(req, res, next);

    expect(mockStore.payment.isLive).toBe(true);
    expect(mockStore.payment.storeId).toBe('live_merchant_id');
    expect(mockStore.payment.storePassword).toBe('live_merchant_pass');
    expect(mockStore.payment.provider).toBe('sslcommerz');
    expect(mockStore.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Payment credentials updated.',
    });
  });

  test('sets isLive=false (sandbox mode) with credentials', async () => {
    req.body = {
      provider: 'sslcommerz',
      storeId: 'live_merchant_id',
      storePassword: 'live_merchant_pass',
      isLive: false,
      cod: { enabled: true, fee: 0 },
    };

    await updatePaymentCredentials(req, res, next);

    expect(mockStore.payment.isLive).toBe(false);
    expect(mockStore.payment.storeId).toBe('live_merchant_id');
    expect(mockStore.payment.storePassword).toBe('live_merchant_pass');
    expect(mockStore.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('preserves existing provider when not sent in body', async () => {
    mockStore.payment.provider = 'sslcommerz';
    req.body = {
      storeId: 'merchant_1',
      storePassword: 'pass_1',
      isLive: true,
    };

    await updatePaymentCredentials(req, res, next);

    expect(mockStore.payment.provider).toBe('sslcommerz');
    expect(mockStore.payment.isLive).toBe(true);
  });

  test('handles partial cod update — only enabled:false', async () => {
    req.body = {
      storeId: 'mid',
      storePassword: 'mpass',
      isLive: true,
      cod: { enabled: false },
    };

    await updatePaymentCredentials(req, res, next);

    expect(mockStore.payment.cod.enabled).toBe(false);
    expect(mockStore.payment.cod.fee).toBe(0);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns 404 if store not found', async () => {
    Store.findById.mockResolvedValue(null);
    req.body = {
      storeId: 'mid',
      storePassword: 'mpass',
      isLive: true,
    };

    await updatePaymentCredentials(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Store not found' }));
  });
});
