import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env, razorpayEnabled } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let client;
const getClient = () => {
  if (!razorpayEnabled()) throw new ApiError(503, 'Online payments are not configured yet.');
  client = client || new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
};

export async function createRazorpayOrder({ amountInr, receipt, notes }) {
  const order = await getClient().orders.create({ amount: Math.round(amountInr * 100), currency: 'INR', receipt, notes });
  return { id: order.id, amount: order.amount, currency: order.currency };
}

const safeEqualHex = (a, b) => {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

/** Verifies the checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (!env.razorpay.keySecret) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}

/** Verifies a webhook body signature using the webhook secret (raw body required). */
export function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}

/** Confirms with Razorpay that the payment belongs to the order, matches the amount and is successful. */
export async function fetchVerifiedPayment(razorpayPaymentId, { razorpayOrderId, amountInr }) {
  const payment = await getClient().payments.fetch(razorpayPaymentId);
  const ok =
    payment.order_id === razorpayOrderId &&
    payment.amount === Math.round(amountInr * 100) &&
    payment.currency === 'INR' &&
    ['captured', 'authorized'].includes(payment.status);
  return { ok, payment };
}
