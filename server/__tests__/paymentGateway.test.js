import { jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('getStoreCredentials (Go Live flag logic)', () => {
  test('when isLive=true, returns store-specific credentials', async () => {
    process.env.SSLCOMMERZ_STORE_ID = 'sandbox_id';
    process.env.SSLCOMMERZ_STORE_PASSWORD = 'sandbox_pass';

    const { getStoreCredentials } = await import('../utils/paymentGateway.js');
    const store = {
      payment: { storeId: 'live_merchant', storePassword: 'live_secret', isLive: true },
    };

    const result = getStoreCredentials(store);

    expect(result.storeId).toBe('live_merchant');
    expect(result.storePassword).toBe('live_secret');
    expect(result.isLive).toBe(true);
  });

  test('when isLive=false, returns sandbox credentials from env', async () => {
    process.env.SSLCOMMERZ_STORE_ID = 'sandbox_abc';
    process.env.SSLCOMMERZ_STORE_PASSWORD = 'sandbox_xyz';

    const { getStoreCredentials } = await import('../utils/paymentGateway.js');
    const store = {
      payment: { storeId: 'live_merchant', storePassword: 'live_secret', isLive: false },
    };

    const result = getStoreCredentials(store);

    expect(result.storeId).toBe('sandbox_abc');
    expect(result.storePassword).toBe('sandbox_xyz');
    expect(result.isLive).toBe(false);
  });

  test('when isLive=false and no sandbox env, returns undefined', async () => {
    delete process.env.SSLCOMMERZ_STORE_ID;
    delete process.env.SSLCOMMERZ_STORE_PASSWORD;

    const { getStoreCredentials } = await import('../utils/paymentGateway.js');
    const store = {
      payment: { storeId: 'live_merchant', storePassword: 'live_secret', isLive: false },
    };

    const result = getStoreCredentials(store);

    expect(result.storeId).toBeUndefined();
    expect(result.storePassword).toBeUndefined();
    expect(result.isLive).toBe(false);
  });
});
