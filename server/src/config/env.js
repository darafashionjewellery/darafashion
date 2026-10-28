import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const bool = (value, fallback = false) =>
  value === undefined || value === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
const num = (value, fallback) => (value === undefined || value === '' || Number.isNaN(Number(value)) ? fallback : Number(value));
const list = (value) => (value ? value.split(',').map((v) => v.trim()).filter(Boolean) : []);

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const jwtSecret = process.env.JWT_SECRET || (isProd ? '' : 'dev-only-insecure-jwt-secret-change-me');
if (isProd && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production');
}

export const env = {
  nodeEnv,
  isProd,
  isTest,
  port: num(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI || '',
  clientUrls: list(process.env.CLIENT_URL || 'http://localhost:5173'),
  trustProxy: num(process.env.TRUST_PROXY, 0),

  jwtSecret,
  otpSecret: process.env.OTP_SECRET || jwtSecret,
  sessionDays: num(process.env.SESSION_DAYS, 7),
  cookie: {
    name: 'dara_session',
    secure: bool(process.env.COOKIE_SECURE, isProd),
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  otp: {
    ttlSeconds: 5 * 60,
    maxAttempts: 5,
    resendCooldownSeconds: num(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
  },

  email: {
    // "brevo" sends through the Brevo transactional email API (BREVO_API_KEY).
    // "smtp" works with Amazon SES SMTP, Resend SMTP or any other SMTP provider.
    // "console" prints OTP emails to the server log for local development and is refused in production.
    transport: process.env.EMAIL_TRANSPORT || (process.env.BREVO_API_KEY ? 'brevo' : isProd ? 'smtp' : 'console'),
    from: process.env.EMAIL_FROM || 'DARA Fashions <no-reply@localhost>',
    brevo: {
      apiKey: process.env.BREVO_API_KEY || '',
      senderEmail: process.env.BREVO_SENDER_EMAIL || '',
      senderName: process.env.BREVO_SENDER_NAME || 'DARA Fashions',
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: num(process.env.SMTP_PORT, 587),
      secure: bool(process.env.SMTP_SECURE, false),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  codEnabled: bool(process.env.ENABLE_COD, false),

  adminEmails: list(process.env.ADMIN_EMAILS).map((e) => e.toLowerCase()),
};

export const razorpayEnabled = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);
