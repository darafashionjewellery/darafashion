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
  let payment = await getClient().payments.fetch(razorpayPaymentId);
  const matches = payment.order_id === razorpayOrderId && payment.amount === Math.round(amountInr * 100) && payment.currency === 'INR';
  // Accounts without auto-capture leave payments "authorized"; Razorpay refunds those unless captured.
  if (matches && payment.status === 'authorized') payment = await getClient().payments.capture(payment.id, payment.amount, 'INR');
  return { ok: matches && payment.status === 'captured', payment };
}

/** Finds a captured payment for a Razorpay order, e.g. when the checkout callback never reached us. */
export async function findCapturedPayment(razorpayOrderId, amountInr) {
  const { items = [] } = await getClient().orders.fetchPayments(razorpayOrderId);
  return items.find((p) => p.status === 'captured' && p.amount === Math.round(amountInr * 100) && p.currency === 'INR') || null;
}
