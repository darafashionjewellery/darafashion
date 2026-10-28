import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { issueOtp, resendOtp, verifyOtp } from '../services/otp.service.js';
import { burnPasswordCheck, hashPassword, verifyPassword } from '../services/password.service.js';
import { setSessionCookie, clearSessionCookie } from '../middleware/auth.js';

function startSession(res, user) {
  if (env.adminEmails.includes(user.email)) user.role = 'admin';
  user.lastLoginAt = new Date();
  setSessionCookie(res, user);
  return user.save();
}

/** Step 1 of sign-up: validate details and email a verification code. No account exists until the code is verified. */
export async function signup(req, res) {
  const { name, email, password } = req.valid.body;
  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists. Please log in, or use "Forgot password".');
  }
  const result = await issueOtp(email, { purpose: 'signup', pending: { name, passwordHash: await hashPassword(password) } });
  res.json({ message: 'We have sent a 6-digit code to your email.', ...result });
}

/** Step 2 of sign-up: verify the code, create the account and log in. */
export async function verifySignup(req, res) {
  const { email, otp } = req.valid.body;
  const record = await verifyOtp(email, otp, 'signup');
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists. Please log in.');

  const user = new User({ email, name: record.pending.name, passwordHash: record.pending.passwordHash });
  await startSession(res, user);
  res.status(201).json({ user: user.toPublic() });
}

export async function resendSignupOtp(req, res) {
  const result = await resendOtp(req.valid.body.email, 'signup');
  res.json({ message: 'A new code has been sent.', ...result });
}

/** Password login — no email is sent. */
export async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    await burnPasswordCheck(password);
    throw ApiError.unauthorized('Incorrect email or password.');
  }
  if (!user.passwordHash) {
    throw ApiError.unauthorized('This account does not have a password yet. Use "Forgot password" to set one.');
  }
  if (!(await verifyPassword(password, user.passwordHash))) throw ApiError.unauthorized('Incorrect email or password.');

  await startSession(res, user);
  res.json({ user: user.toPublic() });
}

/** Sends a reset code only when the account exists, but always answers the same way. */
export async function forgotPassword(req, res) {
  const { email } = req.valid.body;
  const message = 'If an account exists for this email, we have sent a 6-digit code to reset your password.';
  if (!(await User.exists({ email }))) return res.json({ message, expiresIn: env.otp.ttlSeconds, resendIn: env.otp.resendCooldownSeconds });
  const result = await issueOtp(email, { purpose: 'reset' });
  res.json({ message, ...result });
}

export async function resetPassword(req, res) {
  const { email, otp, password } = req.valid.body;
  await verifyOtp(email, otp, 'reset');
  const user = await User.findOne({ email });
  if (!user) throw ApiError.badRequest('Account not found.');
  user.passwordHash = await hashPassword(password);
  await startSession(res, user);
  res.json({ user: user.toPublic() });
}

export async function me(req, res) {
  res.json({ user: req.user ? req.user.toPublic() : null });
}

export async function logout(_req, res) {
  clearSessionCookie(res);
  res.json({ message: 'Logged out' });
}
