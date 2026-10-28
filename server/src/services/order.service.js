import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { nextSequence } from '../models/misc.js';
import { env, razorpayEnabled } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { priceLines, computeTotals } from './pricing.service.js';
import { reserveStock, releaseStock } from './stock.service.js';
import { createRazorpayOrder } from './payment.service.js';
import { sendOrderConfirmationEmail } from './email.service.js';

const stockLines = (order) => order.items.map((i) => ({ productId: i.product, variantSku: i.variantSku, quantity: i.quantity, name: i.name }));

export async function createOrderFromCart(user, { address, shippingMethod, paymentMethod, notes }) {
  if (paymentMethod === 'cod' && !env.codEnabled) throw ApiError.badRequest('Cash on Delivery is not available.');
  if (paymentMethod === 'razorpay' && !razorpayEnabled()) throw ApiError.badRequest('Online payment is not available right now.');

  const cart = await Cart.findOne({ user: user._id });
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your bag is empty.');

  const lines = await priceLines(cart.items);
  const problem = lines.find((l) => !l.available || l.issue);
  if (problem) throw ApiError.conflict(`${problem.product?.name || 'An item'}: ${problem.issue || 'unavailable'}. Please review your bag.`);

  const totals = computeTotals(lines, shippingMethod);

  // A customer retrying checkout should not keep stock locked by an abandoned online-payment order.
  const abandoned = await Order.find({ user: user._id, status: 'pending_payment', paymentStatus: { $ne: 'paid' } });
  for (const old of abandoned) await cancelOrder(old, 'Superseded by a new checkout attempt');

  await reserveStock(lines.map((l) => ({ productId: l.productId, variantSku: l.variantSku, quantity: l.quantity, name: l.product.name })));

  const isCod = paymentMethod === 'cod';
  const orderNumber = `DARA${10000 + (await nextSequence('order'))}`;
  let order;
  try {
    order = await Order.create({
      orderNumber,
      user: user._id,
      email: user.email,
      items: lines.map((l) => ({
        product: l.productId,
        name: l.product.name,
        slug: l.product.slug,
        sku: l.product.sku,
        variantSku: l.variantSku,
        variantLabel: l.variantLabel,
        image: l.image,
        unitPrice: l.unitPrice,
        compareAtPrice: l.compareAtPrice ?? undefined,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
      shippingAddress: address,
      shippingMethod: { id: totals.shippingMethod.id, label: totals.shippingMethod.label, description: totals.shippingMethod.description },
      subtotal: totals.subtotal,
      shippingFee: totals.shippingFee,
      total: totals.total,
      paymentMethod,
      status: isCod ? 'placed' : 'pending_payment',
      statusHistory: [{ status: isCod ? 'placed' : 'pending_payment', note: isCod ? 'Order placed (Cash on Delivery)' : 'Awaiting payment' }],
      notes: notes || '',
    });
  } catch (err) {
    await releaseStock(lines.map((l) => ({ productId: l.productId, variantSku: l.variantSku, quantity: l.quantity })));
    throw err;
  }

  if (isCod) {
    await Cart.updateOne({ user: user._id }, { $set: { items: [] } });
    sendOrderConfirmationEmail(order);
    return { order };
  }

  try {
    const rzp = await createRazorpayOrder({ amountInr: order.total, receipt: order.orderNumber, notes: { orderId: order._id.toString() } });
    order.payment.razorpayOrderId = rzp.id;
    await order.save();
    return { order, payment: { provider: 'razorpay', keyId: env.razorpay.keyId, razorpayOrderId: rzp.id, amount: rzp.amount, currency: rzp.currency } };
  } catch (err) {
    await cancelOrder(order, 'Payment could not be initiated');
    throw err instanceof ApiError ? err : new ApiError(502, 'Could not start the payment. Please try again.');
  }
}

/** Idempotently marks an order paid. Safe to call from both the checkout callback and the webhook. */
export async function markOrderPaid(order, razorpayPaymentId) {
  if (order.paymentStatus === 'paid') return order;
  order.paymentStatus = 'paid';
  order.payment.razorpayPaymentId = razorpayPaymentId;
  order.payment.paidAt = new Date();
  if (order.status === 'pending_payment') {
    order.status = 'placed';
    order.statusHistory.push({ status: 'placed', note: 'Payment received' });
  } else if (order.status === 'cancelled') {
    order.statusHistory.push({ status: 'cancelled', note: 'Payment received after cancellation — refund required' });
  }
  await order.save();
  await Cart.updateOne({ user: order.user }, { $set: { items: [] } });
  sendOrderConfirmationEmail(order);
  return order;
}

export async function markPaymentFailed(order, reason) {
  if (order.paymentStatus === 'paid') return order;
  order.paymentStatus = 'failed';
  order.payment.failureReason = reason || 'Payment failed';
  await order.save();
  return order;
}

export async function cancelOrder(order, note = 'Cancelled') {
  if (order.status === 'cancelled') return order;
  if (!order.stockReleased) {
    await releaseStock(stockLines(order));
    order.stockReleased = true;
  }
  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note });
  await order.save();
  return order;
}
