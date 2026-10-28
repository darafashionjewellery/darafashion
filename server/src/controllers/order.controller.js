import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeOrder } from '../services/serializers.js';
import { createOrderFromCart, markOrderPaid, markPaymentFailed, cancelOrder } from '../services/order.service.js';
import { verifyCheckoutSignature, verifyWebhookSignature, fetchVerifiedPayment } from '../services/payment.service.js';

export async function createOrder(req, res) {
  const body = req.valid.body;
  let address;
  if (body.addressId) {
    const saved = req.user.addresses.id(body.addressId);
    if (!saved) throw ApiError.badRequest('Selected address was not found');
    address = saved.toObject();
  } else {
    address = { ...body.address, country: 'India' };
    if (body.saveAddress && req.user.addresses.length < 10) {
      req.user.addresses.push({ ...address, label: 'Home', isDefault: req.user.addresses.length === 0 });
      await req.user.save();
    }
  }
  const { _id, label, isDefault, createdAt, updatedAt, ...snapshot } = address;

  const { order, payment } = await createOrderFromCart(req.user, {
    address: snapshot,
    shippingMethod: body.shippingMethod,
    paymentMethod: body.paymentMethod,
    notes: body.notes,
  });
  res.status(201).json({ order: serializeOrder(order), payment: payment || null });
}

async function findOwnOrder(req) {
  const order = await Order.findOne({ _id: req.valid.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

export async function myOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ items: orders.map(serializeOrder) });
}

export async function getOrder(req, res) {
  res.json({ order: serializeOrder(await findOwnOrder(req)) });
}

/**
 * Called by the storefront after Razorpay Checkout succeeds. The signature is verified
 * with the secret key and the payment is re-fetched from Razorpay before marking paid.
 */
export async function verifyPayment(req, res) {
  const order = await findOwnOrder(req);
  const { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: signature } = req.valid.body;

  if (order.paymentStatus === 'paid') return res.json({ order: serializeOrder(order) });
  if (order.paymentMethod !== 'razorpay' || order.payment.razorpayOrderId !== razorpayOrderId) {
    throw ApiError.badRequest('Payment does not match this order');
  }
  if (!verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, signature })) {
    await markPaymentFailed(order, 'Invalid payment signature');
    throw ApiError.badRequest('Payment verification failed');
  }
  const { ok } = await fetchVerifiedPayment(razorpayPaymentId, { razorpayOrderId, amountInr: order.total });
  if (!ok) throw ApiError.badRequest('Payment has not been completed');

  await markOrderPaid(order, razorpayPaymentId);
  res.json({ order: serializeOrder(order) });
}

export async function cancelMyOrder(req, res) {
  const order = await findOwnOrder(req);
  if (order.paymentStatus === 'paid' || !['pending_payment', 'placed'].includes(order.status)) {
    throw ApiError.badRequest('This order can no longer be cancelled online. Please contact customer support.');
  }
  await cancelOrder(order, 'Cancelled by customer');
  res.json({ order: serializeOrder(order) });
}

/** Razorpay webhook — mounted with a raw body parser so the signature can be verified. */
export async function razorpayWebhook(req, res) {
  const raw = req.body instanceof Buffer ? req.body : Buffer.from('');
  if (!verifyWebhookSignature(raw, req.get('x-razorpay-signature'))) throw ApiError.badRequest('Invalid signature');

  const event = JSON.parse(raw.toString('utf8'));
  const paymentEntity = event.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
  if (!razorpayOrderId) return res.json({ received: true });

  const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId });
  if (!order) return res.json({ received: true });

  if (['payment.captured', 'order.paid'].includes(event.event)) {
    const amount = paymentEntity?.amount ?? event.payload?.order?.entity?.amount_paid;
    if (amount === Math.round(order.total * 100)) await markOrderPaid(order, paymentEntity?.id || order.payment.razorpayPaymentId);
  } else if (event.event === 'payment.failed') {
    await markPaymentFailed(order, paymentEntity?.error_description);
  }
  res.json({ received: true });
}
