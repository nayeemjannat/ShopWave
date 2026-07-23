import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const mockToken = 'jwt.test.token';

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jest.fn().mockReturnValue(mockToken) },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: { findOne: jest.fn() },
}));

const User = (await import('../models/User.js')).default;
const { login } = await import('../controllers/authController.js');

function makeUser(overrides = {}) {
  return {
    _id: 'user1',
    name: 'Test User',
    email: 'user@test.com',
    role: 'customer',
    isActive: true,
    avatar: '',
    loyaltyPoints: 10,
    matchPassword: jest.fn(),
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

const mockQueryChain = {
  select: jest.fn().mockImplementation(function () { return this; }),
};

describe('POST /api/v1/auth/login — login controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockReturnValue(mockQueryChain);
    req = { body: { email: 'user@test.com', password: 'correct-password' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  /* ---------- happy path ---------- */

  test('active user logs in successfully → 200 + token + user', async () => {
    const user = makeUser();
    user.matchPassword.mockResolvedValue(true);
    mockQueryChain.select.mockReturnValue(user);

    await login(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'user@test.com' });
    expect(mockQueryChain.select).toHaveBeenCalledWith('+password');
    expect(user.matchPassword).toHaveBeenCalledWith('correct-password');
    expect(user.save).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith('token', mockToken, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, token: mockToken }),
    );
  });

  /* ---------- banned user ---------- */

  test('banned user (isActive:false) is blocked → 403 "Account is deactivated"', async () => {
    const user = makeUser({ isActive: false });
    user.matchPassword.mockResolvedValue(true);
    mockQueryChain.select.mockReturnValue(user);

    await login(req, res, next);

    expect(user.matchPassword).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Account is deactivated. Contact support.' }),
    );
  });

  /* ---------- invalid credentials ---------- */

  test('wrong password → 401 "Invalid credentials"', async () => {
    const user = makeUser();
    user.matchPassword.mockResolvedValue(false);
    mockQueryChain.select.mockReturnValue(user);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid credentials' }),
    );
  });

  test('non-existent email → 401 "Invalid credentials"', async () => {
    mockQueryChain.select.mockReturnValue(null);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid credentials' }),
    );
  });
});
