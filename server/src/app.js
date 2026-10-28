import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { razorpayWebhook } from './controllers/order.controller.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import { UPLOAD_DIR } from './services/upload.service.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (env.trustProxy) app.set('trust proxy', env.trustProxy);

  app.use(helmet());

  // Uploaded images (admin → products / categories / collections). File names are unique,
  // so they can be cached for a long time. Cross-origin is allowed so a storefront on a
  // different domain can display them.
  app.use(
    '/uploads',
    helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
    express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, fallthrough: false }),
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin)),
      credentials: true,
    }),
  );
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Webhook needs the raw body for signature verification, so it is mounted before express.json().
  app.post('/api/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook);

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
