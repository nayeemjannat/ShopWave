import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail, { passwordResetTemplate } from '../utils/sendEmail.js';
import asyncHandler from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = new User({ name, email, password });
  user.referralCode = user.generateReferralCode();
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.status(201).json({
    success: true,
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, loyaltyPoints: user.loyaltyPoints }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  user.lastLogin = Date.now();
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.status(200).json({
    success: true,
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, loyaltyPoints: user.loyaltyPoints }
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name price images');
  res.status(200).json({ success: true, user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordOtp = otp;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: user.email,
    subject: 'Password Reset OTP',
    html: passwordResetTemplate(otp)
  });

  res.status(200).json({ success: true, message: 'OTP sent to email' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await User.findOne({ email, resetPasswordOtp: otp, resetPasswordExpire: { $gt: Date.now() } });
  
  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.password = password;
  user.resetPasswordOtp = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful' });
});
