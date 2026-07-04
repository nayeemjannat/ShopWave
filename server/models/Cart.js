import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1 },
        variant: { type: String },
      },
    ],

    recoveryEmailSent: { type: Boolean, default: false },

    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

cartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

cartSchema.index({ user: 1, store: 1 }, { unique: true });

cartSchema.methods.getTotalPrice = async function () {
  await this.populate('items.product');
  let total = 0;
  this.items.forEach(item => {
    if (item.product && item.product.price) {
      total += item.product.price * item.quantity;
    }
  });
  return total;
};

cartSchema.methods.clearCart = function () {
  this.items = [];
};

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
