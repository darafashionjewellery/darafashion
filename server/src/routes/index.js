import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth.js';
import { otpIpLimiter, otpEmailLimiter, verifyLimiter, formLimiter, loginLimiter } from '../middleware/rateLimit.js';
import * as v from '../validators/index.js';
import * as auth from '../controllers/auth.controller.js';
import * as account from '../controllers/account.controller.js';
import * as products from '../controllers/product.controller.js';
import * as cart from '../controllers/cart.controller.js';
import * as wishlist from '../controllers/wishlist.controller.js';
import * as orders from '../controllers/order.controller.js';
import * as site from '../controllers/site.controller.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.get('/site/config', site.getConfig);

// Auth: password login; email OTP only for sign-up verification and password reset
router.post('/auth/signup', otpIpLimiter, otpEmailLimiter, validate({ body: v.signupSchema }), auth.signup);
router.post('/auth/signup/verify', verifyLimiter, validate({ body: v.verifyOtpSchema }), auth.verifySignup);
router.post('/auth/signup/resend', otpIpLimiter, otpEmailLimiter, validate({ body: v.emailOnlySchema }), auth.resendSignupOtp);
router.post('/auth/login', loginLimiter, validate({ body: v.loginSchema }), auth.login);
router.post('/auth/forgot-password', otpIpLimiter, otpEmailLimiter, validate({ body: v.emailOnlySchema }), auth.forgotPassword);
router.post('/auth/reset-password', verifyLimiter, validate({ body: v.resetPasswordSchema }), auth.resetPassword);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', optionalAuth, auth.me);

// Account
router.patch('/account/profile', requireAuth, validate({ body: v.profileSchema }), account.updateProfile);
router.post('/account/addresses', requireAuth, validate({ body: v.addressSchema }), account.addAddress);
router.put('/account/addresses/:addressId', requireAuth, validate({ params: v.addressIdParam, body: v.addressSchema }), account.updateAddress);
router.delete('/account/addresses/:addressId', requireAuth, validate({ params: v.addressIdParam }), account.deleteAddress);

// Catalogue
router.get('/categories', products.listCategories);
router.get('/collections', products.listCollections);
router.get('/collections/:slug', products.getCollection);
router.get('/products', validate({ query: v.productQuerySchema }), products.listProducts);
router.get('/products/:id', products.getProduct);
router.get('/products/:id/related', products.relatedProducts);
router.get('/products/:id/reviews', products.productReviews);
router.post('/products/:id/reviews', requireAuth, formLimiter, validate({ body: v.reviewSchema }), products.createReview);
router.get('/reviews', products.featuredReviews);

// Cart
router.post('/cart/quote', validate({ body: v.quoteSchema }), cart.quote);
router.get('/cart', requireAuth, cart.getMyCart);
router.post('/cart/items', requireAuth, validate({ body: v.addCartItemSchema }), cart.addItem);
router.patch('/cart/items/:id', requireAuth, validate({ params: v.idParam, body: v.updateCartItemSchema }), cart.updateItem);
router.delete('/cart/items/:id', requireAuth, validate({ params: v.idParam }), cart.removeItem);
router.post('/cart/merge', requireAuth, validate({ body: v.mergeCartSchema }), cart.mergeCart);

// Wishlist
router.get('/wishlist', requireAuth, wishlist.getMyWishlist);
router.post('/wishlist/items', requireAuth, validate({ body: v.wishlistItemSchema }), wishlist.addToWishlist);
router.delete('/wishlist/items/:id', requireAuth, validate({ params: v.idParam }), wishlist.removeFromWishlist);
router.post('/wishlist/merge', requireAuth, validate({ body: v.mergeWishlistSchema }), wishlist.mergeWishlist);

// Orders & payments
router.post('/orders', requireAuth, validate({ body: v.createOrderSchema }), orders.createOrder);
router.get('/orders/my', requireAuth, orders.myOrders);
router.get('/orders/:id', requireAuth, validate({ params: v.idParam }), orders.getOrder);
router.post('/orders/:id/verify-payment', requireAuth, validate({ params: v.idParam, body: v.verifyPaymentSchema }), orders.verifyPayment);
router.post('/orders/:id/cancel', requireAuth, validate({ params: v.idParam }), orders.cancelMyOrder);

// Forms
router.post('/newsletter/subscribe', formLimiter, validate({ body: v.newsletterSchema }), site.subscribe);
router.post('/contact', formLimiter, validate({ body: v.contactSchema }), site.submitContact);
router.get('/careers', site.listJobs);
router.get('/careers/:slug', validate({ params: v.slugParam }), site.getJob);
router.post('/careers/:slug/apply', formLimiter, validate({ params: v.slugParam, body: v.jobApplicationSchema }), site.applyToJob);

router.use('/admin', requireAuth, requireAdmin, adminRoutes);

export default router;
