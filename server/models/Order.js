import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String },
        image: { type: String },
        price: { type: Number },
        quantity: { type: Number },
        variant: { type: String },
      },
    ],

    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      district: { type: String },
      postalCode: { type: String },
    },

    paymentMethod: { type: String, enum: ['sslcommerz', 'cod'] },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String },

    orderStatus: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },

    statusTimeline: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],

    couponCode: { type: String },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    invoiceUrl: { type: String },

    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = 'SW-' + Date.now();
  }

  if (!this.isNew && this.isModified('orderStatus')) {
    this.statusTimeline.push({
      status: this.orderStatus,
      timestamp: Date.now(),
      note: `Order marked as ${this.orderStatus}`,
    });
  }

  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
