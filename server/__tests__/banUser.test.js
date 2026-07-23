import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret-for-ban-user-test';

import jwt from 'jsonwebtoken';

/* ---------- shared mocks ---------- */

const mockQueryChain = {
  select: jest.fn().mockResolvedValue(null),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findById: jest.fn().mockReturnValue(mockQueryChain),
  },
}));

const User = (await import('../models/User.js')).default;
const { banUser } = await import('../controllers/userController.js');
const { protect } = await import('../middleware/auth.js');

/* =============================================================
   banUser controller
   ============================================================= */

describe('PUT /api/v1/users/:id/ban — banUser controller', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    mockUser = {
      _id: 'customer1',
      name: 'Test Customer',
      email: 'customer@test.com',
      role: 'customer',
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
    };
    /* banUser controller does User.findById(id) — no .select() chaining */
    User.findById.mockResolvedValue(mockUser);
    req = { params: { id: 'customer1' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('bans customer — sets isActive:false, returns success:true', async () => {
    await banUser(req, res, next);

    expect(mockUser.isActive).toBe(false);
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User banned successfully' });
  });

  test('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    req.params.id = 'nonexistent';

    await banUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found' }));
  });
});

/* =============================================================
   protect middleware — banned user (isActive:false) blocked
   Uses chainable mock (findById → .select())
   ============================================================= */

describe('protect middleware — banned user authentication', () => {
  let req, res, next;
  let validToken;

  beforeAll(() => {
    validToken = jwt.sign({ id: 'user1' }, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    /* protect calls User.findById(id).select('-password') — needs chain */
    mockQueryChain.select.mockResolvedValue(null);
    User.findById.mockReturnValue(mockQueryChain);

    req = { headers: { authorization: `Bearer ${validToken}` } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('returns 401 when user.isActive is false', async () => {
    mockQueryChain.select.mockResolvedValue({ _id: 'user1', isActive: false, role: 'customer' });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, user not found or inactive',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when user document not found', async () => {
    mockQueryChain.select.mockResolvedValue(null);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, user not found or inactive',
    });
  });

  test('allows active user through (isActive:true)', async () => {
    mockQueryChain.select.mockResolvedValue({ _id: 'user1', isActive: true, role: 'customer' });

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 when no token provided', async () => {
    req.headers = {};

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, no token',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
