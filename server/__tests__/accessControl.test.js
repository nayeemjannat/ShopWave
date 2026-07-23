import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

import jwt from 'jsonwebtoken';

jest.unstable_mockModule('../models/User.js', () => ({
  default: { findById: jest.fn() },
}));

const User = (await import('../models/User.js')).default;
const { protect } = await import('../middleware/auth.js');

/* =============================================================
   authorize middleware — direct unit test
   ============================================================= */

const { authorize } = await import('../middleware/auth.js');

describe('authorize middleware — role enforcement', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  /* ---------- superAdmin-only routes (e.g. POST /api/v1/store) ---------- */

  test('superAdmin → allowed through', () => {
    req.user = { role: 'superAdmin' };

    authorize('superAdmin')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('storeAdmin → 403 Forbidden', () => {
    req.user = { role: 'storeAdmin' };

    authorize('superAdmin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: insufficient permissions',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('customer → 403 Forbidden', () => {
    req.user = { role: 'customer' };

    authorize('superAdmin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('no user on req → 403 Forbidden', () => {
    req.user = null;

    authorize('superAdmin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  /* ---------- multi-role routes (e.g. PUT /api/v1/store/config) ---------- */

  test('storeAdmin + superAdmin route — storeAdmin allowed', () => {
    req.user = { role: 'storeAdmin' };

    authorize('storeAdmin', 'superAdmin')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('storeAdmin + superAdmin route — customer blocked', () => {
    req.user = { role: 'customer' };

    authorize('storeAdmin', 'superAdmin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

/* =============================================================
   protect + authorize integration — full middleware chain
   POST /api/v1/store requires protect → authorize('superAdmin')
   ============================================================= */

describe('protect + authorize integration — POST /api/v1/store', () => {
  let req, res, next;
  const mockQueryChain = { select: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue(mockQueryChain);
    req = {
      headers: { authorization: `Bearer ${jwt.sign({ id: 'u1' }, process.env.JWT_SECRET)}` },
      user: null,
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  function storeAdminToken() {
    req.headers.authorization = `Bearer ${jwt.sign({ id: 'storeadmin1' }, process.env.JWT_SECRET)}`;
    mockQueryChain.select.mockResolvedValue({
      _id: 'storeadmin1',
      role: 'storeAdmin',
      isActive: true,
    });
  }

  function superAdminToken() {
    req.headers.authorization = `Bearer ${jwt.sign({ id: 'super1' }, process.env.JWT_SECRET)}`;
    mockQueryChain.select.mockResolvedValue({
      _id: 'super1',
      role: 'superAdmin',
      isActive: true,
    });
  }

  function customerToken() {
    req.headers.authorization = `Bearer ${jwt.sign({ id: 'cust1' }, process.env.JWT_SECRET)}`;
    mockQueryChain.select.mockResolvedValue({
      _id: 'cust1',
      role: 'customer',
      isActive: true,
    });
  }

  /* --- storeAdmin tries to create a store --- */

  test('storeAdmin → rejected at authorize (never reaches controller)', async () => {
    storeAdminToken();

    await protect(req, res, next);
    // protect calls next() on success
    if (next.mock.calls.length > 0) {
      // simulate authorize('superAdmin') running after protect
      authorize('superAdmin')(req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: insufficient permissions',
    });
  });

  test('customer → rejected at authorize', async () => {
    customerToken();

    await protect(req, res, next);
    if (next.mock.calls.length > 0) {
      authorize('superAdmin')(req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('superAdmin → passes both protect and authorize', async () => {
    superAdminToken();

    await protect(req, res, next);
    // protect succeeded — next was called
    const protectCalledNext = next.mock.calls.length > 0;
    expect(protectCalledNext).toBe(true);

    // simulate authorize
    authorize('superAdmin')(req, res, next); // calls next() again

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(2);
  });

  /* --- no token --- */

  test('no token → rejected at protect before authorize', async () => {
    req.headers = {};

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, no token',
    });
  });
});

/* =============================================================
   CRITICAL: PUT /api/v1/store/:id/payment
   Payment credentials — must NEVER be accessible by non-superAdmin
   ============================================================= */

describe('PUT /api/v1/store/:id/payment — payment credential protection', () => {
  let req, res, next;
  const mockQueryChain = { select: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue(mockQueryChain);
    req = {
      headers: { authorization: `Bearer ${jwt.sign({ id: 'cust1' }, process.env.JWT_SECRET)}` },
      params: { id: 'store123' },
      body: { storeId: 'evil_mid', storePassword: 'evil_pass', isLive: true },
      user: null,
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('customer token → 403 Forbidden, payment data never reaches controller', async () => {
    mockQueryChain.select.mockResolvedValue({ _id: 'cust1', role: 'customer', isActive: true });

    await protect(req, res, next);
    if (next.mock.calls.length > 0) {
      authorize('superAdmin')(req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: insufficient permissions',
    });
    expect(req.body.storeId).toBe('evil_mid'); // body parsed but never processed
  });

  test('storeAdmin token → 403 Forbidden, same protection', async () => {
    mockQueryChain.select.mockResolvedValue({ _id: 'sadmin1', role: 'storeAdmin', isActive: true });
    req.headers.authorization = `Bearer ${jwt.sign({ id: 'sadmin1' }, process.env.JWT_SECRET)}`;

    await protect(req, res, next);
    if (next.mock.calls.length > 0) {
      authorize('superAdmin')(req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('superAdmin token → allowed through both layers', async () => {
    mockQueryChain.select.mockResolvedValue({ _id: 'super1', role: 'superAdmin', isActive: true });
    req.headers.authorization = `Bearer ${jwt.sign({ id: 'super1' }, process.env.JWT_SECRET)}`;

    await protect(req, res, next);
    if (next.mock.calls.length > 0) {
      authorize('superAdmin')(req, res, next);
    }

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});

/* =============================================================
   CRITICAL: GET /api/v1/users — user list (private customer data)
   Must NEVER leak to storeAdmin or customer
   ============================================================= */

describe('GET /api/v1/users — user list data leak protection', () => {
  let req, res, next;
  const mockQueryChain = { select: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue(mockQueryChain);
    req = { headers: {}, user: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('storeAdmin token → 403 Forbidden, user list not exposed', async () => {
    req.headers.authorization = `Bearer ${jwt.sign({ id: 'sadmin1' }, process.env.JWT_SECRET)}`;
    mockQueryChain.select.mockResolvedValue({ _id: 'sadmin1', role: 'storeAdmin', isActive: true });

    await protect(req, res, next);
    if (next.mock.calls.length > 0) {
      authorize('superAdmin')(req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Forbidden: insufficient permissions',
    });
  });

  test('customer token → 403 Forbidden', async () => {
    req.headers.authorization = `Bearer ${jwt.sign({ id: 'cust1' }, process.env.JWT_SECRET)}`;
    mockQueryChain.select.mockResolvedValue({ _id: 'cust1', role: 'customer', isActive: true });

    await protect(req, res, next);
    if (next.mock.calls.length > 0) {
      authorize('superAdmin')(req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('superAdmin token → allowed through both layers', async () => {
    req.headers.authorization = `Bearer ${jwt.sign({ id: 'super1' }, process.env.JWT_SECRET)}`;
    mockQueryChain.select.mockResolvedValue({ _id: 'super1', role: 'superAdmin', isActive: true });

    await protect(req, res, next);
    if (next.mock.calls.length > 0) {
      authorize('superAdmin')(req, res, next);
    }

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('no token → rejected at protect before authorize runs', async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, no token',
    });
  });
});

/* =============================================================
   CRITICAL: PUT /api/v1/users/:id/ban — unauthenticated request
   No token = blocked at protect(), never reaches authorize()
   ============================================================= */

describe('PUT /api/v1/users/:id/ban — no-token rejection', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {}, params: { id: 'user1' }, user: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('no Authorization header → 401 at protect middleware', async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, no token',
    });
    expect(next).not.toHaveBeenCalled();
    /* authorize never ran — user.isActive never touched */
  });

  test('empty Bearer token → 401 at protect middleware', async () => {
    req.headers.authorization = 'Bearer ';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, no token',
    });
  });

  test('malformed Authorization header → 401 at protect (jwt verify fails)', async () => {
    req.headers.authorization = 'Bearer not-a-valid-jwt';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, invalid token',
    });
  });
});

/* =============================================================
   CRITICAL: Expired / tampered JWT — any protected route
   jwt.verify() in protect middleware must reject both
   ============================================================= */

describe('Expired / tampered JWT — signature rejection', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {}, user: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('expired token → 401 "invalid token"', async () => {
    const expired = jwt.sign({ id: 'user1', role: 'superAdmin' }, process.env.JWT_SECRET, { expiresIn: '0s' });
    /* wait 1ms so the token is definitely expired */
    await new Promise((r) => setTimeout(r, 10));
    req.headers.authorization = `Bearer ${expired}`;

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('tampered payload (customer → superAdmin role edit) → signature invalid', async () => {
    /* sign a valid customer token */
    const legit = jwt.sign({ id: 'user1', role: 'customer' }, process.env.JWT_SECRET);
    /* manually decode + modify payload + re-encode with WRONG secret → signature mismatch */
    const parts = legit.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    payload.role = 'superAdmin';                          /* privilege escalation attempt */
    const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tampered = [parts[0], tamperedPayload, parts[2]].join('.'); /* original sig, won't match */

    req.headers.authorization = `Bearer ${tampered}`;

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('legit active token still passes protect', async () => {
    const valid = jwt.sign({ id: 'user1' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${valid}`;

    const chain = { select: jest.fn().mockResolvedValue({ _id: 'user1', isActive: true, role: 'customer' }) };
    User.findById.mockReturnValue(chain);

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
