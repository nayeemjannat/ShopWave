import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    adminNote: { type: String },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.statics.calculateAverageRating = async function (productId) {
  const obj = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  try {
    if (obj.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        ratings: {
          average: obj[0].average,
          count: obj[0].count,
        },
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        ratings: {
          average: 0,
          count: 0,
        },
      });
    }
  } catch (err) {
    console.error(err);
  }
};

reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

reviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
