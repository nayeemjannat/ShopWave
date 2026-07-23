import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

/* ---------- shared fixtures ---------- */

const ORIGINAL_DEMO = {
  _id: 'demo123',
  slug: 'demo',
  name: 'ShopWave Demo',
  storeType: 'electronics',
  config: {
    primaryColor: '#4B44B0',
    secondaryColor: '#1B9C75',
    fontFamily: 'Inter',
    logo: '',
    bannerImages: [],
    socialLinks: {},
    activeModules: ['wishlist', 'cart', 'comparison', 'flashSale', 'reviews', 'loyaltyPoints'],
    currency: 'BDT',
    language: 'en',
  },
  payment: {
    provider: 'sslcommerz',
    storeId: 'demo_store_id',
    storePassword: 'demo_store_password',
    isLive: false,
    cod: { enabled: true, fee: 20 },
  },
  isActive: true,
  save: jest.fn().mockResolvedValue(true),
};

/* Store mock — needs to be callable (new Store()) AND have static methods */
function MockStore(data) {
  return {
    ...data,
    _id: data?.slug === 'demo' ? 'demo123' : 'newstore_' + Date.now(),
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnValue(data || {}),
  };
}
MockStore.findById = jest.fn();
MockStore.findOne = jest.fn();
MockStore.findByIdAndUpdate = jest.fn();

function MockUser(data) {
  return {
    ...data,
    _id: 'newuser_' + Date.now(),
    save: jest.fn().mockResolvedValue(true),
    generateReferralCode: jest.fn().mockReturnValue('REFCODE'),
  };
}
MockUser.findById = jest.fn();
MockUser.findOne = jest.fn();

jest.unstable_mockModule('../models/Store.js', () => ({ default: MockStore }));
jest.unstable_mockModule('../models/User.js', () => ({ default: MockUser }));

const Store = (await import('../models/Store.js')).default;
const User = (await import('../models/User.js')).default;

const { createStoreWithAdmin, updatePaymentCredentials } = await import('../controllers/storeController.js');

/* =============================================================
   Regression: creating a new store does NOT touch existing stores
   POST /api/v1/store
   ============================================================= */

describe('Regression — store creation isolation', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockResolvedValue(null);

    req = {
      user: { _id: 'super1', role: 'superAdmin' },
      body: {
        name: 'Brand New Store',
        storeType: 'clothing',
        ownerName: 'New Owner',
        ownerEmail: 'new@owner.com',
        ownerPassword: 'Pass@1234',
      },
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('demo store data remains intact after creating a new store', async () => {
    /* simulate demo in DB */
    Store.findOne.mockImplementation((q) => {
      if (q?.slug === 'demo') return Promise.resolve({ ...ORIGINAL_DEMO });
      return Promise.resolve(null);
    });

    const demoBefore = await Store.findOne({ slug: 'demo' });

    await createStoreWithAdmin(req, res, next);

    const demoAfter = await Store.findOne({ slug: 'demo' });

    expect(demoBefore.storeType).toBe('electronics');
    expect(demoAfter.storeType).toBe('electronics');
    expect(demoAfter.config.primaryColor).toBe('#4B44B0');
    expect(demoAfter.config.activeModules).toEqual(
      expect.arrayContaining(['wishlist', 'cart', 'comparison']),
    );
    /* demo's payment untouched */
    expect(demoAfter.payment.storeId).toBe('demo_store_id');
    expect(demoAfter.payment.isLive).toBe(false);

    /* new store created successfully */
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Store.findOne for demo is never called by createStoreWithAdmin', async () => {
    await createStoreWithAdmin(req, res, next);

    /* controller only calls User.findOne for email check, not Store.findOne */
    const storeFindOneCalls = Store.findOne.mock.calls;
    const demoQueries = storeFindOneCalls.filter(([q]) => q?.slug === 'demo');
    expect(demoQueries.length).toBe(0);
  });
});

/* =============================================================
   Regression: updatePaymentCredentials is scoped to ONE store
   PUT /api/v1/store/:id/payment
   ============================================================= */

describe('Regression — payment update isolation', () => {
  let req, res, next;
  let demoStore, fashionStore;

  beforeEach(() => {
    jest.clearAllMocks();

    demoStore = {
      ...ORIGINAL_DEMO,
      save: jest.fn().mockResolvedValue(true),
    };
    fashionStore = {
      _id: 'fashion456',
      name: 'Fashion Hub',
      slug: 'fashion-hub',
      storeType: 'clothing',
      payment: {
        provider: 'sslcommerz',
        storeId: 'fashion_old_id',
        storePassword: 'fashion_old_pass',
        isLive: false,
        cod: { enabled: true, fee: 10 },
      },
      config: { primaryColor: '#FF0000', currency: 'BDT' },
      save: jest.fn().mockResolvedValue(true),
    };

    Store.findById.mockImplementation((id) => {
      if (id === 'demo123') return Promise.resolve(demoStore);
      if (id === 'fashion456') return Promise.resolve(fashionStore);
      return Promise.resolve(null);
    });

    req = { params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('updating fashion payment — demo store config untouched', async () => {
    req.params.id = 'fashion456';
    req.body = { storeId: 'fashion_live_id', storePassword: 'fashion_live_pass', isLive: true };

    await updatePaymentCredentials(req, res, next);

    /* fashion updated */
    expect(fashionStore.payment.storeId).toBe('fashion_live_id');
    expect(fashionStore.payment.isLive).toBe(true);

    /* demo completely untouched */
    expect(demoStore.payment.storeId).toBe('demo_store_id');
    expect(demoStore.payment.isLive).toBe(false);
    expect(demoStore.config.primaryColor).toBe('#4B44B0');
    expect(demoStore.config.activeModules).toContain('wishlist');

    /* Store.findById was called only for the target store */
    expect(Store.findById).toHaveBeenCalledWith('fashion456');
    expect(Store.findById).not.toHaveBeenCalledWith('demo123');
  });

  test('updating demo payment — fashion store untouched', async () => {
    req.params.id = 'demo123';
    req.body = { storeId: 'demo_new_mid', storePassword: 'demo_new_pass', isLive: true };

    await updatePaymentCredentials(req, res, next);

    expect(demoStore.payment.storeId).toBe('demo_new_mid');
    expect(demoStore.payment.isLive).toBe(true);

    expect(fashionStore.payment.storeId).toBe('fashion_old_id');
    expect(fashionStore.payment.isLive).toBe(false);
  });
});
