import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending_payment', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot at time of purchase so later catalogue edits do not change past orders.
    name: { type: String, required: true },
    slug: String,
    sku: { type: String, required: true },
    variantSku: { type: String, default: null },
    variantLabel: { type: String, default: '' },
    image: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    compareAtPrice: Number,
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    items: { type: [orderItemSchema], validate: [(v) => v.length > 0, 'Order must contain items'] },
    shippingAddress: { type: shippingAddressSchema, required: true },
    shippingMethod: { id: String, label: String, description: String },

    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },

    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    payment: {
      razorpayOrderId: { type: String, index: true },
      razorpayPaymentId: String,
      paidAt: Date,
      failureReason: String,
    },

    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment' },
    statusHistory: { type: [{ status: String, note: String, at: { type: Date, default: Date.now } }], default: [] },
    trackingNumber: { type: String, default: '' },
    courier: { type: String, default: '' },
    stockReleased: { type: Boolean, default: false },
    notes: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
