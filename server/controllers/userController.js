import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.phone) user.phone = req.body.phone;
    await user.save();
    res.status(200).json({ success: true, user });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  
  if (user && (await user.matchPassword(currentPassword))) {
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } else {
    res.status(401);
    throw new Error('Invalid current password');
  }
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);
  
  const inWishlist = user.wishlist.includes(productId);
  if (inWishlist) {
    user.wishlist.pull(productId);
  } else {
    user.wishlist.addToSet(productId);
  }
  
  await user.save();
  res.status(200).json({ success: true, inWishlist: !inWishlist });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name price images flashSale discountedPrice');
  res.status(200).json({ success: true, wishlist: user.wishlist });
});

export const getLoyaltyPoints = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, points: user.loyaltyPoints, history: user.loyaltyHistory || [] });
});

export const getReferralInfo = asyncHandler(async (req, res) => {
  const count = await User.countDocuments({ referredBy: req.user._id });
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    referralCode: user.referralCode,
    referralUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?ref=${user.referralCode}`,
    referralCount: count,
    totalEarned: count * 50 // Example 50 points
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) {
    query.role = role;
  }
  const users = await User.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-password');
  res.status(200).json({ success: true, users });
});

export const banUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.isActive = false;
    await user.save();
    res.status(200).json({ success: true, message: 'User banned successfully' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});
