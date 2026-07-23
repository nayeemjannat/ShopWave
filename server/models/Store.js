import mongoose from 'mongoose';
import slugify from 'slugify';

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeType: { type: String, required: true, enum: ['electronics', 'clothing', 'beauty', 'grocery', 'digital', 'multi'] },

    config: {
      primaryColor: { type: String, default: '#534AB7' },
      secondaryColor: { type: String, default: '#1D9E75' },
      fontFamily: { type: String, default: 'Inter' },
      logo: { type: String },
      bannerImages: [{ type: String }],
      socialLinks: {
        type: {
          facebook: { type: String },
          instagram: { type: String },
          whatsapp: { type: String },
        },
        default: {},
      },
      activeModules: [{ type: String }],
      currency: { type: String, default: 'BDT' },
      language: { type: String, enum: ['en', 'bn'], default: 'en' },
    },

    payment: {
      provider: { type: String, enum: ['sslcommerz', 'shurjopay', 'bkash'], default: 'sslcommerz' },
      storeId: { type: String },
      storePassword: { type: String },
      isLive: { type: Boolean, default: false },
      cod: {
        enabled: { type: Boolean, default: true },
        fee: { type: Number, default: 0 },
      },
    },

    subscription: {
      plan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
      status: { type: String, enum: ['active', 'expired', 'suspended'], default: 'active' },
      expiresAt: { type: Date },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Store = mongoose.model('Store', storeSchema);
export default Store;
