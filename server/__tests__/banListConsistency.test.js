import { jest } from '@jest/globals';

/* ---------- mocks ---------- */

const mockQueryChain = {
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  select: jest.fn().mockImplementation(function (fields) {
    const strip = typeof fields === 'string' && fields.startsWith('-');
    const key = strip ? fields.slice(1) : null;
    return Promise.resolve(
      strip ? mockUsers.map((u) => { const { [key]: _, ...rest } = u; return rest; }) : mockUsers,
    );
  }),
};

let mockUsers = [
  { _id: 'u1', name: 'Alice Admin', email: 'alice@shop.com', role: 'superAdmin', isActive: true },
  { _id: 'u2', name: 'Bob Store', email: 'bob@shop.com', role: 'storeAdmin', isActive: true },
  { _id: 'u3', name: 'Charlie Customer', email: 'charlie@user.com', role: 'customer', isActive: true },
];

jest.unstable_mockModule('../models/User.js', () => ({
  default: { findById: jest.fn(), find: jest.fn() },
}));

const User = (await import('../models/User.js')).default;
const { getAllUsers } = await import('../controllers/userController.js');
const { banUser } = await import('../controllers/userController.js');

describe('Ban → List consistency: banned user shows isActive:false', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    User.find.mockReturnValue(mockQueryChain);
    req = { query: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  test('after banning Charlie, user list shows Charlie with isActive:false', async () => {
    /* --- 1. get all users BEFORE ban --- */
    mockQueryChain.select.mockImplementation(function (fields) {
      const strip = typeof fields === 'string' && fields.startsWith('-');
      const key = strip ? fields.slice(1) : null;
      return Promise.resolve(
        strip ? mockUsers.map((u) => { const { [key]: _, ...rest } = u; return rest; }) : mockUsers,
      );
    });

    let response = await captureResponse(getAllUsers, req, res, next);
    let charlie = response.users.find((u) => u._id === 'u3');
    expect(charlie.isActive).toBe(true);

    /* --- 2. ban Charlie --- */
    const charlieDoc = mockUsers.find((u) => u._id === 'u3');
    charlieDoc.isActive = false;
    charlieDoc.save = jest.fn().mockResolvedValue(true);
    User.findById.mockResolvedValue(charlieDoc);

    req.params = { id: 'u3' };
    await banUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);

    /* --- 3. get all users AFTER ban --- */
    jest.clearAllMocks();
    User.find.mockReturnValue(mockQueryChain);

    req.params = {};
    req.query = {};
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    response = await captureResponse(getAllUsers, req, res, next);
    charlie = response.users.find((u) => u._id === 'u3');
    expect(charlie.isActive).toBe(false);

    /* other users unaffected */
    expect(response.users.find((u) => u._id === 'u1').isActive).toBe(true);
    expect(response.users.find((u) => u._id === 'u2').isActive).toBe(true);
  });

  test('banned user stays false after subsequent unbanned user list fetch', async () => {
    const charlieDoc = mockUsers.find((u) => u._id === 'u3');
    charlieDoc.isActive = false;
    charlieDoc.save = jest.fn().mockResolvedValue(true);
    User.findById.mockResolvedValue(charlieDoc);

    req.params = { id: 'u3' };
    await banUser(req, res, next);

    /* fetch list twice — consistency check */
    for (let i = 0; i < 2; i++) {
      jest.clearAllMocks();
      User.find.mockReturnValue(mockQueryChain);
      req.params = {};
      req.query = {};
      res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

      const response = await captureResponse(getAllUsers, req, res, next);
      expect(response.users.find((u) => u._id === 'u3').isActive).toBe(false);
    }
  });
});

/* helper: calls controller, returns json payload */
async function captureResponse(fn, req, res, next) {
  await fn(req, res, next);
  return res.json.mock.calls[0][0];
}
