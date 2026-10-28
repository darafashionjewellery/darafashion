import { z } from 'zod';
import mongoose from 'mongoose';
import { OCCASIONS } from '../models/Product.js';
import { ORDER_STATUSES } from '../models/Order.js';

export const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid id');
export const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const csv = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? [] : (Array.isArray(v) ? v : v.split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean)));

export const idParam = z.object({ id: objectId });
export const slugParam = z.object({ slug: z.string().trim().min(1).max(160) });

// Auth
const otp = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code');
const newPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password must include at least one letter and one number');
export const emailOnlySchema = z.object({ email });
export const signupSchema = z.object({ name: z.string().trim().min(2, 'Enter your name').max(100), email, password: newPassword });
export const verifyOtpSchema = z.object({ email, otp });
export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password').max(128) });
export const resetPasswordSchema = z.object({ email, otp, password: newPassword });

// Profile & addresses
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100),
  phone: z.union([phone, z.literal('')]).optional(),
});
export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default('Home'),
  fullName: z.string().trim().min(2, 'Enter the full name').max(100),
  phone,
  line1: z.string().trim().min(3, 'Enter the address').max(200),
  line2: z.string().trim().max(200).optional().default(''),
  landmark: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().min(2, 'Enter the city').max(80),
  state: z.string().trim().min(2, 'Enter the state').max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  country: z.literal('India').optional().default('India'),
  isDefault: z.boolean().optional().default(false),
});
export const addressIdParam = z.object({ addressId: objectId });

// Products
export const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: csv,
  collection: z.string().trim().toLowerCase().max(80).optional(),
  occasion: csv,
  style: csv,
  craft: csv,
  color: csv,
  material: csv,
  tag: z.enum(['new', 'bestseller', 'featured']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'relevance']).optional(),
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(24),
  facets: z.enum(['true', 'false']).optional(),
  exclude: objectId.optional(),
  ids: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : []))
    .pipe(z.array(objectId).max(100)),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
});

// Cart & wishlist
const cartLine = z.object({
  productId: objectId,
  variantSku: z.string().trim().toUpperCase().max(60).nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(10).optional().default(1),
});
export const addCartItemSchema = cartLine;
export const updateCartItemSchema = z.object({ quantity: z.coerce.number().int().min(1).max(10) });
export const mergeCartSchema = z.object({ items: z.array(cartLine).max(50) });
export const quoteSchema = z.object({ items: z.array(cartLine).max(50), shippingMethod: z.string().optional() });
export const wishlistItemSchema = z.object({ productId: objectId });
export const mergeWishlistSchema = z.object({ productIds: z.array(objectId).max(200) });

// Orders
export const createOrderSchema = z
  .object({
    addressId: objectId.optional(),
    address: addressSchema.omit({ label: true, isDefault: true }).optional(),
    saveAddress: z.boolean().optional().default(false),
    shippingMethod: z.enum(['standard', 'express']).default('standard'),
    paymentMethod: z.enum(['razorpay', 'cod']),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.addressId || v.address, { message: 'Please choose a delivery address', path: ['address'] });

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// Forms
export const newsletterSchema = z.object({ email, source: z.string().trim().max(40).optional() });
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100),
  email,
  phone: z.string().trim().max(20).optional().default(''),
  subject: z.string().trim().max(150).optional().default(''),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(3000),
});
export const jobApplicationSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100),
  email,
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(20),
  resumeUrl: z.union([z.string().trim().url('Enter a valid link'), z.literal('')]).optional().default(''),
  coverLetter: z.string().trim().max(3000).optional().default(''),
});

// Admin
const variantInput = z.object({
  sku: z.string().trim().min(1),
  label: z.string().trim().min(1),
  color: z.string().optional(),
  swatch: z.string().optional(),
  price: z.number().min(0).nullable().optional(),
  compareAtPrice: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string()).optional(),
});
export const adminProductSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(1),
  description: z.string().optional(),
  category: objectId,
  style: z.string().optional(),
  collections: z.array(z.string()).optional(),
  occasions: z.array(z.enum(OCCASIONS)).optional(),
  craftsmanship: z.string().optional(),
  colors: z.array(z.string()).optional(),
  material: z.string().optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  variants: z.array(variantInput).optional(),
  images: z.array(z.string()).optional(),
  details: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  careInstructions: z.array(z.string()).optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export const adminProductUpdateSchema = adminProductSchema.partial();
export const inventorySchema = z.object({
  stock: z.number().int().min(0).optional(),
  variants: z.array(z.object({ sku: z.string(), stock: z.number().int().min(0) })).optional(),
});
export const adminOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(300).optional(),
  trackingNumber: z.string().max(80).optional(),
  courier: z.string().max(80).optional(),
});
export const reviewModerationSchema = z.object({ status: z.enum(['approved', 'rejected']) });
