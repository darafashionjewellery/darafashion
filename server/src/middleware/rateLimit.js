import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (opts) =>
  rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res, _next, options) => res.status(options.statusCode).json({ message: options.message }),
    skip: () => env.isTest,
    ...opts,
  });

export const apiLimiter = make({ windowMs: 60 * 1000, limit: 300, message: 'Too many requests, please slow down.' });

export const otpIpLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: 'Too many OTP requests from this network. Please try again later.',
});

export const otpEmailLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return email ? `email:${email}` : ipKeyGenerator(req.ip);
  },
  message: 'Too many OTP requests for this email. Please try again later.',
});

export const verifyLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Too many verification attempts. Please try again later.',
});

// Failed logins per email + network. Successful logins do not count.
export const loginLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login:${String(req.body?.email || '').trim().toLowerCase()}:${ipKeyGenerator(req.ip)}`,
  message: 'Too many failed login attempts. Please wait 15 minutes or reset your password.',
});

export const formLimiter = make({ windowMs: 60 * 60 * 1000, limit: 20, message: 'Too many submissions. Please try again later.' });
