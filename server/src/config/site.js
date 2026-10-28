import { env, razorpayEnabled } from './env.js';

const num = (value, fallback) => (value === undefined || value === '' || Number.isNaN(Number(value)) ? fallback : Number(value));
const list = (value, fallback) => (value ? value.split('|').map((v) => v.trim()).filter(Boolean) : fallback);

/**
 * Business-configurable storefront settings. Everything can be overridden with
 * environment variables so content changes do not need a code change.
 * Contact details and social links stay empty until DARA provides real ones.
 */
export const siteConfig = {
  announcements: list(process.env.ANNOUNCEMENTS, [
    'Discover the Latest Jewellery Trends',
    'New Arrivals — Explore the Collection',
    'Celebrate Every Occasion with DARA',
  ]),
  contact: {
    email: process.env.CONTACT_EMAIL || '',
    phone: process.env.CONTACT_PHONE || '',
    whatsapp: process.env.CONTACT_WHATSAPP || '',
    address: process.env.CONTACT_ADDRESS || '',
    hours: process.env.CONTACT_HOURS || '',
  },
  social: {
    instagram: process.env.SOCIAL_INSTAGRAM || '',
    facebook: process.env.SOCIAL_FACEBOOK || '',
    youtube: process.env.SOCIAL_YOUTUBE || '',
    pinterest: process.env.SOCIAL_PINTEREST || '',
  },
  // Placeholder defaults — set real values via env before launch.
  shipping: {
    freeShippingThreshold: num(process.env.SHIPPING_FREE_THRESHOLD, 999),
    methods: [
      {
        id: 'standard',
        label: 'Standard Shipping',
        description: process.env.SHIPPING_STANDARD_ETA || '3–7 business days',
        fee: num(process.env.SHIPPING_STANDARD_FEE, 79),
        freeAboveThreshold: true,
      },
      {
        id: 'express',
        label: 'Express Shipping',
        description: process.env.SHIPPING_EXPRESS_ETA || '1–3 business days',
        fee: num(process.env.SHIPPING_EXPRESS_FEE, 199),
        freeAboveThreshold: false,
      },
    ],
  },
};

export function publicSiteConfig() {
  return {
    ...siteConfig,
    payments: {
      razorpay: razorpayEnabled(),
      razorpayKeyId: razorpayEnabled() ? env.razorpay.keyId : null,
      cod: env.codEnabled,
    },
  };
}
