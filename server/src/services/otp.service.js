import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { OtpVerification } from '../models/OtpVerification.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOtpEmail } from './email.service.js';

const hashOtp = (email, otp) => crypto.createHmac('sha256', env.otpSecret).update(`${email}:${otp}`).digest('hex');

const generateOtp = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

function assertCooldown(record) {
  const cooldownMs = env.otp.resendCooldownSeconds * 1000;
  const elapsed = Date.now() - record.lastSentAt.getTime();
  if (elapsed < cooldownMs) {
    const retryAfter = Math.ceil((cooldownMs - elapsed) / 1000);
    throw ApiError.tooMany(`Please wait ${retryAfter}s before requesting a new code.`, { retryAfter });
  }
}

/**
 * Creates (or replaces) the OTP for an email and sends it. Enforces the resend cooldown.
 * `pending` holds sign-up details until the email is verified.
 */
export async function issueOtp(email, { purpose, pending }) {
  const now = Date.now();
  const existing = await OtpVerification.findOne({ email });
  if (existing) assertCooldown(existing);

  const otp = generateOtp();
  await OtpVerification.findOneAndUpdate(
    { email },
    {
      email,
      purpose,
      pending: pending ?? { name: '', passwordHash: '' },
      otpHash: hashOtp(email, otp),
      expiresAt: new Date(now + env.otp.ttlSeconds * 1000),
      attempts: 0,
      lastSentAt: new Date(now),
      purgeAt: new Date(now + 60 * 60 * 1000),
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  try {
    await sendOtpEmail(email, otp, purpose);
  } catch (err) {
    // Remove the OTP so the user is not locked out by the cooldown when sending failed.
    await OtpVerification.deleteOne({ email });
    console.error('OTP email failed:', err.message);
    throw new ApiError(503, 'We could not send the verification email. Please try again shortly.');
  }

  return { expiresIn: env.otp.ttlSeconds, resendIn: env.otp.resendCooldownSeconds };
}

/** Sends a fresh code for an in-progress sign-up or reset, keeping its pending details. */
export async function resendOtp(email, purpose) {
  const record = await OtpVerification.findOne({ email, purpose });
  if (!record) throw ApiError.badRequest('This request has expired. Please start again.');
  assertCooldown(record);
  return issueOtp(email, { purpose, pending: record.pending?.toObject?.() ?? record.pending });
}

/** Validates an OTP for the given purpose. On success the OTP is deleted (single use) and its record returned. */
export async function verifyOtp(email, otp, purpose) {
  const record = await OtpVerification.findOne({ email, purpose });
  if (!record) throw ApiError.badRequest('No active code for this email. Please request a new one.');

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    throw ApiError.badRequest('This code has expired. Please request a new one.');
  }
  if (record.attempts >= env.otp.maxAttempts) {
    await record.deleteOne();
    throw ApiError.tooMany('Too many incorrect attempts. Please request a new code.');
  }

  const expected = Buffer.from(record.otpHash, 'hex');
  const actual = Buffer.from(hashOtp(email, otp), 'hex');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    // Atomic increment so parallel guesses cannot bypass the attempt limit.
    const updated = await OtpVerification.findOneAndUpdate({ _id: record._id }, { $inc: { attempts: 1 } }, { returnDocument: 'after' });
    const remaining = Math.max(0, env.otp.maxAttempts - (updated?.attempts ?? env.otp.maxAttempts));
    if (remaining === 0) {
      await OtpVerification.deleteOne({ _id: record._id });
      throw ApiError.tooMany('Too many incorrect attempts. Please request a new code.');
    }
    throw ApiError.badRequest(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, { remaining });
  }

  // Single use: only one concurrent request can delete the document.
  const { deletedCount } = await OtpVerification.deleteOne({ _id: record._id, otpHash: record.otpHash });
  if (!deletedCount) throw ApiError.badRequest('This code has already been used. Please request a new one.');
  return record;
}
