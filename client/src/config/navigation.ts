import { assets } from './assets'

export const OCCASIONS = [
  { slug: 'wedding', label: 'Wedding', description: 'Statement jewellery for every ceremony', image: assets.occasions.wedding },
  { slug: 'festive', label: 'Festive Celebrations', description: 'Shine through every festival', image: assets.occasions.festive },
  { slug: 'party', label: 'Party Wear', description: 'Bold pieces for evenings out', image: assets.occasions.party },
  { slug: 'daily', label: 'Daily Wear', description: 'Light, easy everyday styles', image: assets.occasions.daily },
  { slug: 'gifting', label: 'Gifting', description: 'Thoughtful gifts for loved ones', image: assets.occasions.gifting },
] as const

export const occasionLabel = (slug: string) => OCCASIONS.find((o) => o.slug === slug)?.label ?? slug

export type NavItem =
  | { label: string; to: string; type: 'link' }
  | { label: string; to: string; type: 'category'; categorySlug: string }
  | { label: string; to: string; type: 'occasions' }
  | { label: string; to: string; type: 'collections' }

/** Main navigation, in display order. Category dropdowns are populated from the API. */
export const MAIN_NAV: NavItem[] = [
  { label: 'Necklaces', to: '/category/necklaces', type: 'category', categorySlug: 'necklaces' },
  { label: 'Earrings', to: '/category/earrings', type: 'category', categorySlug: 'earrings' },
  { label: 'Bangles', to: '/category/bangles', type: 'category', categorySlug: 'bangles' },
  { label: 'Accessories', to: '/category/accessories', type: 'category', categorySlug: 'accessories' },
  { label: 'Collection', to: '/collections', type: 'collections' },
  { label: 'Happy Customers', to: '/happy-customers', type: 'link' },
]

export const FOOTER_HELP_LINKS = [
  { label: 'About DARA', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'FAQs', to: '/faq' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Return & Refund Policy', to: '/returns' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Careers', to: '/careers' },
]

export const PRICE_RANGES = [
  { label: 'Under ₹1,000', min: undefined, max: 999 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { label: 'Above ₹5,000', min: 5000, max: undefined },
] as const
