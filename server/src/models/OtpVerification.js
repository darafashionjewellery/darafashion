import mongoose from 'mongoose';

/**
 * One active OTP per email, used only for sign-up email verification and password resets
 * (login itself uses the password, so it never sends email). Documents are removed by the
 * TTL index after `purgeAt`.
 */
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ['signup', 'reset'], default: 'signup' },
    otpHash: { type: String, required: true },
    // Pending sign-up details, kept until the email is verified. Only the password hash is stored.
    pending: {
      name: { type: String, default: '' },
      passwordHash: { type: String, default: '' },
    },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    purgeAt: { type: Date, required: true },
  },
  { timestamps: true },
);

otpSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export const OtpVerification = mongoose.model('OtpVerification', otpSchema);
