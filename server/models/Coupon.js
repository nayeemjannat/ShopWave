import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['flat', 'percent'], required: true },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxUses: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ store: 1, code: 1 }, { unique: true });

couponSchema.methods.isValid = function (userId, cartTotal) {
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  if (this.expiresAt && Date.now() > new Date(this.expiresAt).getTime()) return { valid: false, message: 'Coupon has expired' };
  if (this.usedCount >= this.maxUses) return { valid: false, message: 'Coupon usage limit reached' };
  if (cartTotal < this.minOrder) return { valid: false, message: `Minimum order amount of ${this.minOrder} required` };
  if (this.usedBy.some((id) => id.toString() === userId?.toString())) {
    return { valid: false, message: 'You have already used this coupon' };
  }
  
  return { valid: true };
};

couponSchema.methods.apply = function (cartTotal) {
  if (this.discountType === 'flat') {
    return Math.min(this.value, cartTotal);
  } else if (this.discountType === 'percent') {
    return cartTotal * (this.value / 100);
  }
  return 0;
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
