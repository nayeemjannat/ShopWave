import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

/* ---------- mock setup ---------- */

const mockUserFindOne = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
const mockNewUserSave = jest.fn();

jest.unstable_mockModule('../models/User.js', () => {
  const User = jest.fn(function (data) {
    return {
      ...data,
      save: (...args) => mockNewUserSave(...args),
      generateReferralCode: () => 'NEWCODE8',
    };
  });
  User.findOne = (...args) => mockUserFindOne(...args);
  User.findByIdAndUpdate = (...args) => mockUserFindByIdAndUpdate(...args);
  return { default: User };
});

jest.unstable_mockModule('../utils/sendEmail.js', () => ({
  default: jest.fn().mockResolvedValue(true),
  passwordResetTemplate: jest.fn().mockReturnValue('<html></html>'),
}));

const User = (await import('../models/User.js')).default;
const { register } = await import('../controllers/authController.js');

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

/* =============================================================
   PHASE 8 — referral bonus on registration
   New user registering with a referral code credits the
   referrer 50 loyalty points + history entry.
   ============================================================= */

describe('register — referral bonus (Phase 8)', () => {
  let res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    next = jest.fn();
    mockUserFindOne.mockResolvedValue(null);
    mockNewUserSave.mockResolvedValue(true);
  });

  test('registration with referralCode in body → referrer credited 50 pts', async () => {
    const referrer = { _id: 'ref1', referralCode: 'ABC12345' };
    mockUserFindOne
      .mockResolvedValueOnce(null)                     // email not registered
      .mockResolvedValueOnce(referrer);                // referral code found

    await register(
      { body: { name: 'Nayeem', email: 'n@test.com', password: 'secret123', referralCode: 'ABC12345' }, query: {} },
      res,
      next
    );

    expect(mockUserFindOne).toHaveBeenNthCalledWith(2, { referralCode: 'ABC12345' });
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      'ref1',
      expect.objectContaining({
        $inc: { loyaltyPoints: 50 },
        $push: {
          loyaltyHistory: expect.objectContaining({ action: 'Referral bonus', points: 50 }),
        },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  test('registration via query ?ref= also credits referrer', async () => {
    const referrer = { _id: 'ref1', referralCode: 'ABC12345' };
    mockUserFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(referrer);

    await register(
      { body: { name: 'Nayeem', email: 'n2@test.com', password: 'secret123' }, query: { ref: 'ABC12345' } },
      res,
      next
    );

    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      'ref1',
      expect.objectContaining({ $inc: { loyaltyPoints: 50 } })
    );
  });

  test('invalid referral code → 400, no bonus credited', async () => {
    mockUserFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);                     // code not found

    await register(
      { body: { name: 'Nayeem', email: 'n3@test.com', password: 'secret123', referralCode: 'BADCODE' }, query: {} },
      res,
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: 'Invalid referral code',
    }));
    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('registration without referral → no bonus, no referrer lookup for code', async () => {
    mockUserFindOne.mockResolvedValueOnce(null);

    await register(
      { body: { name: 'Nayeem', email: 'n4@test.com', password: 'secret123' }, query: {} },
      res,
      next
    );

    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
    expect(mockUserFindOne).toHaveBeenCalledTimes(1);   // only email check
    expect(res.status).toHaveBeenCalledWith(201);
  });
});