import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['customer', 'storeAdmin', 'superAdmin'], default: 'customer' },
    avatar: { type: String, default: '' },
    googleId: { type: String, sparse: true },
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyHistory: [{
      action: { type: String },
      points: { type: Number },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      date: { type: Date, default: Date.now }
    }],
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    phone: { type: String },
    resetPasswordOtp: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateReferralCode = function () {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const User = mongoose.model('User', userSchema);
export default User;
