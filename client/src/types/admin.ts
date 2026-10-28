import type { Order } from './index'

export interface AdminVariant {
  sku: string
  label: string
  color: string
  swatch: string
  price: number | null
  compareAtPrice: number | null
  stock: number
  images: string[]
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  sku: string
  description: string
  category: { id: string; name: string; slug: string } | null
  style: string
  collections: string[]
  occasions: string[]
  craftsmanship: string
  colors: string[]
  material: string
  tags: string[]
  price: number
  compareAtPrice: number | null
  stock: number
  variants: AdminVariant[]
  totalStock: number
  images: string[]
  details: { label: string; value: string }[]
  careInstructions: string[]
  isNewArrival: boolean
  isBestSeller: boolean
  isFeatured: boolean
  isActive: boolean
  salesCount: number
  ratingAverage: number
  ratingCount: number
  createdAt: string
  updatedAt: string
}

/** Body accepted by POST/PATCH /admin/products. */
export interface AdminProductInput {
  name: string
  slug?: string
  sku: string
  description?: string
  category: string
  style?: string
  collections?: string[]
  occasions?: string[]
  craftsmanship?: string
  colors?: string[]
  material?: string
  tags?: string[]
  price: number
  compareAtPrice?: number | null
  stock?: number
  variants?: (Omit<AdminVariant, 'price' | 'compareAtPrice'> & { price?: number | null; compareAtPrice?: number | null })[]
  images?: string[]
  details?: { label: string; value: string }[]
  careInstructions?: string[]
  isNewArrival?: boolean
  isBestSeller?: boolean
  isFeatured?: boolean
  isActive?: boolean
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pages: number
}

export interface AdminStats {
  orders: { total: number; byStatus: Record<string, number> }
  revenue: { total: number; orders: number; last30Days: number; last30DaysOrders: number }
  customers: number
  products: { active: number; hidden: number }
  lowStock: AdminProduct[]
  pendingReviews: number
  newMessages: number
  recentOrders: Order[]
}

export interface AdminCustomer {
  id: string
  email: string
  name: string
  phone: string
  role: 'customer' | 'admin'
  addresses: number
  orders: number
  spent: number
  lastOrderAt: string | null
  lastLoginAt: string | null
  createdAt: string
}

/** Raw category document from /admin/categories. */
export interface AdminCategory {
  _id: string
  name: string
  slug: string
  navLabel?: string
  description: string
  image: string
  bannerImage: string
  styles: string[]
  sortOrder: number
  showInNav: boolean
  isActive: boolean
}

export interface AdminCollection {
  _id: string
  name: string
  slug: string
  tagline: string
  description: string
  image: string
  bannerImage: string
  sortOrder: number
  isFeatured: boolean
  isActive: boolean
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface AdminReview {
  _id: string
  product: { _id: string; name: string; slug: string } | null
  displayName: string
  rating: number
  title: string
  body: string
  verifiedPurchase: boolean
  status: ReviewStatus
  createdAt: string
}

export interface AdminJob {
  _id: string
  title: string
  slug: string
  department: string
  location: string
  type: string
  summary: string
  description: string
  responsibilities: string[]
  requirements: string[]
  isOpen: boolean
  createdAt: string
}

export interface AdminApplication {
  _id: string
  job: { _id: string; title: string; slug: string } | null
  name: string
  email: string
  phone: string
  resumeUrl: string
  coverLetter: string
  status: 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'
  createdAt: string
}

export interface AdminMessage {
  _id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: 'new' | 'read' | 'resolved'
  createdAt: string
}

export interface AdminSubscriber {
  _id: string
  email: string
  source: string
  status: 'subscribed' | 'unsubscribed'
  createdAt: string
}
