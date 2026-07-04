import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema(
  {
    active: { type: Boolean, default: false },
    discountPct: { type: Number, min: 0, max: 100 },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

flashSaleSchema.virtual('isActive').get(function () {
  return this.active;
});

flashSaleSchema.virtual('endDate').get(function () {
  return this.endsAt;
});

flashSaleSchema.virtual('salePrice').get(function () {
  const parent = this.parent();
  if (parent && this.active && this.discountPct) {
    return parent.price * (1 - this.discountPct / 100);
  }
  return parent ? parent.price : 0;
});

const productSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number },
    images: [{ type: String }],
    category: { type: String, required: true },
    brand: { type: String },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    dynamicFields: { type: mongoose.Schema.Types.Mixed },

    variants: [
      {
        name: { type: String },
        value: { type: String },
        price: { type: Number },
        stock: { type: Number },
      },
    ],

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    flashSale: { type: flashSaleSchema, default: () => ({}) },

    tags: [{ type: String }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ store: 1, category: 1 });
productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ name: 'text', nameBn: 'text', tags: 'text' });

productSchema.virtual('discountedPrice').get(function () {
  if (this.flashSale && this.flashSale.active && this.flashSale.discountPct) {
    return this.price * (1 - this.flashSale.discountPct / 100);
  }
  return this.price;
});

productSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});

const Product = mongoose.model('Product', productSchema);
export default Product;
