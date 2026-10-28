import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  domain: env.cookie.domain,
  path: '/',
});

export function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: `${env.sessionDays}d` });
  res.cookie(env.cookie.name, token, { ...cookieOptions(), maxAge: env.sessionDays * 24 * 60 * 60 * 1000 });
}

export function clearSessionCookie(res) {
  res.clearCookie(env.cookie.name, cookieOptions());
}

async function resolveUser(req) {
  const token = req.cookies?.[env.cookie.name];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    return await User.findById(payload.sub);
  } catch {
    return null;
  }
}

export const optionalAuth = async (req, _res, next) => {
  req.user = await resolveUser(req);
  next();
};

export const requireAuth = async (req, _res, next) => {
  req.user = await resolveUser(req);
  if (!req.user) return next(ApiError.unauthorized());
  next();
};

export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(ApiError.forbidden());
  next();
};
