import { jest } from '@jest/globals';

const mockUsers = [
  { _id: 'u1', name: 'Alice Admin', email: 'alice@shop.com', role: 'superAdmin', isActive: true },
  { _id: 'u2', name: 'Bob Store', email: 'bob@shop.com', role: 'storeAdmin', isActive: true },
  { _id: 'u3', name: 'Charlie Customer', email: 'charlie@user.com', role: 'customer', isActive: true },
  { _id: 'u4', name: 'Diana Customer', email: 'diana@user.com', role: 'customer', isActive: true },
];

let mockQueryResult = mockUsers;

const mockQueryChain = {
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  select: jest.fn().mockImplementation(function (fields) {
    const strip = typeof fields === 'string' && fields.startsWith('-');
    const key = strip ? fields.slice(1) : null;
    return Promise.resolve(
      strip
        ? mockQueryResult.map((u) => { const { [key]: _, ...rest } = u; return rest; })
        : mockQueryResult,
    );
  }),
};

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    find: jest.fn().mockReturnValue(mockQueryChain),
  },
}));

const User = (await import('../models/User.js')).default;
const { getAllUsers } = await import('../controllers/userController.js');

function resetQueryChain(result) {
  mockQueryResult = result ?? mockUsers;
  mockQueryChain.limit.mockReturnThis();
  mockQueryChain.skip.mockReturnThis();
}

describe('GET /api/v1/users — getAllUsers', () => {
  let req, res, next;

  beforeEach(() => {
    resetQueryChain();
    User.find.mockReturnValue(mockQueryChain);

    req = { query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /* ---------- defaults ---------- */

  test('uses defaults: page=1, limit=20, no filters', async () => {
    await getAllUsers(req, res, next);

    expect(User.find).toHaveBeenCalledWith({});
    expect(mockQueryChain.limit).toHaveBeenCalledWith(20);
    expect(mockQueryChain.skip).toHaveBeenCalledWith(0);
    expect(mockQueryChain.select).toHaveBeenCalledWith('-password');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, users: mockUsers });
  });

  /* ---------- pagination ---------- */

  test('page=3, limit=10', async () => {
    req.query = { page: '3', limit: '10' };

    await getAllUsers(req, res, next);

    expect(mockQueryChain.limit).toHaveBeenCalledWith(10);
    expect(mockQueryChain.skip).toHaveBeenCalledWith(20);
  });

  test('page=1, limit=5', async () => {
    req.query = { page: '1', limit: '5' };

    await getAllUsers(req, res, next);

    expect(mockQueryChain.limit).toHaveBeenCalledWith(5);
    expect(mockQueryChain.skip).toHaveBeenCalledWith(0);
  });

  /* ---------- search ---------- */

  test('search by name (partial match)', async () => {
    req.query = { search: 'ali' };

    await getAllUsers(req, res, next);

    expect(User.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'ali', $options: 'i' } },
        { email: { $regex: 'ali', $options: 'i' } },
      ],
    });
  });

  test('search by email domain', async () => {
    req.query = { search: 'user.com' };

    await getAllUsers(req, res, next);

    expect(User.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'user.com', $options: 'i' } },
        { email: { $regex: 'user.com', $options: 'i' } },
      ],
    });
  });

  test('search is case-insensitive', async () => {
    req.query = { search: 'ALICE' };

    await getAllUsers(req, res, next);

    expect(User.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'ALICE', $options: 'i' } },
        { email: { $regex: 'ALICE', $options: 'i' } },
      ],
    });
  });

  /* ---------- role filter ---------- */

  test('role=customer', async () => {
    req.query = { role: 'customer' };

    await getAllUsers(req, res, next);

    expect(User.find).toHaveBeenCalledWith({ role: 'customer' });
  });

  test('role=superAdmin', async () => {
    req.query = { role: 'superAdmin' };

    await getAllUsers(req, res, next);

    expect(User.find).toHaveBeenCalledWith({ role: 'superAdmin' });
  });

  test('role=storeAdmin', async () => {
    req.query = { role: 'storeAdmin' };

    await getAllUsers(req, res, next);

    expect(User.find).toHaveBeenCalledWith({ role: 'storeAdmin' });
  });

  /* ---------- combination ---------- */

  test('search + role + pagination combined', async () => {
    req.query = { search: 'bob', role: 'storeAdmin', page: '2', limit: '5' };

    await getAllUsers(req, res, next);

    expect(User.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'bob', $options: 'i' } },
        { email: { $regex: 'bob', $options: 'i' } },
      ],
      role: 'storeAdmin',
    });
    expect(mockQueryChain.limit).toHaveBeenCalledWith(5);
    expect(mockQueryChain.skip).toHaveBeenCalledWith(5);
  });

  /* ---------- password exclusion ---------- */

  test('response users never include password field', async () => {
    const usersWithPassword = [
      { _id: 'u1', name: 'Alice', email: 'alice@shop.com', role: 'superAdmin', password: 'secret123' },
    ];
    resetQueryChain(usersWithPassword);

    await getAllUsers(req, res, next);

    expect(mockQueryChain.select).toHaveBeenCalledWith('-password');

    const responseUsers = res.json.mock.calls[0][0].users;
    for (const u of responseUsers) {
      expect(u).not.toHaveProperty('password');
    }
  });

  /* ---------- empty result ---------- */

  test('no matching users returns empty array', async () => {
    resetQueryChain([]);

    await getAllUsers(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, users: [] });
  });

  /* ---------- no query params ---------- */

  test('empty query object works without crash', async () => {
    req.query = {};

    await getAllUsers(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, users: expect.any(Array) }),
    );
  });
});
