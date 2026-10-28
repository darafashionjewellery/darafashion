export interface CategoryRef {
  id?: string
  name: string
  slug: string
}

export interface Variant {
  sku: string
  label: string
  color?: string
  swatch?: string
  price: number
  compareAtPrice: number | null
  discountPercent: number
  images: string[]
  inStock: boolean
  lowStock: number | null
}

export interface Product {
  id: string
  slug: string
  name: string
  sku: string
  price: number
  compareAtPrice: number | null
  discountPercent: number
  images: string[]
  category: CategoryRef | null
  style: string
  colors: string[]
  isNewArrival: boolean
  isBestSeller: boolean
  ratingAverage: number
  ratingCount: number
  hasVariants: boolean
  variants: Variant[]
  inStock: boolean
  lowStock: number | null
}

export interface ProductDetail extends Product {
  description: string
  collections: string[]
  occasions: string[]
  craftsmanship: string
  material: string
  details: { label: string; value: string }[]
  careInstructions: string[]
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

export interface Facets {
  category: FacetOption[]
  style: FacetOption[]
  occasion: FacetOption[]
  craft: FacetOption[]
  color: FacetOption[]
  material: FacetOption[]
  price: { min: number; max: number }
  inStockCount: number
}

export interface ProductList {
  items: Product[]
  total: number
  page: number
  pages: number
  limit: number
  popularityAvailable: boolean
  facets?: Facets
}

export interface Category {
  id: string
  name: string
  slug: string
  navLabel: string
  description: string
  image: string
  bannerImage: string
  styles: string[]
  showInNav: boolean
  productCount: number
}

export interface Collection {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  image: string
  bannerImage: string
  isFeatured: boolean
}

export interface Address {
  id: string
  label: string
  fullName: string
  phone: string
  line1: string
  line2: string
  landmark: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

export type AddressInput = Omit<Address, 'id' | 'country'>

export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'customer' | 'admin'
  addresses: Address[]
  profileComplete: boolean
  createdAt: string
}

export interface CartLine {
  id: string | null
  productId: string
  variantSku: string | null
  quantity: number
  available: boolean
  issue: string | null
  maxQuantity?: number
  unitPrice?: number
  compareAtPrice?: number | null
  lineTotal?: number
  variantLabel?: string
  image?: string
  product?: { id: string; name: string; slug: string; sku: string; category: CategoryRef | null }
}

export interface ShippingOption {
  id: string
  label: string
  description: string
  fee: number
}

export interface CartTotals {
  itemCount: number
  subtotal: number
  savings: number
  shippingMethod: ShippingOption
  shippingFee: number
  total: number
  shippingOptions: ShippingOption[]
  freeShippingThreshold: number
  hasIssues: boolean
}

export interface CartResponse {
  items: CartLine[]
  totals: CartTotals
}

export type OrderStatus = 'pending_payment' | 'placed' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  slug: string
  sku: string
  variantSku: string | null
  variantLabel: string
  image: string
  unitPrice: number
  compareAtPrice: number | null
  quantity: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  email: string
  items: OrderItem[]
  shippingAddress: Omit<Address, 'id' | 'label' | 'isDefault'>
  shippingMethod: { id: string; label: string; description: string }
  subtotal: number
  discountTotal: number
  shippingFee: number
  total: number
  currency: string
  paymentMethod: 'razorpay' | 'cod'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  status: OrderStatus
  statusHistory: { status: OrderStatus; note: string; at: string }[]
  trackingNumber: string
  courier: string
  createdAt: string
}

export interface RazorpayPayment {
  provider: 'razorpay'
  keyId: string
  razorpayOrderId: string
  amount: number
  currency: string
}

export interface Review {
  id: string
  displayName: string
  rating: number
  title: string
  body: string
  verifiedPurchase: boolean
  createdAt: string
  product?: { name: string; slug: string; image: string }
}

export interface SiteConfig {
  announcements: string[]
  contact: { email: string; phone: string; whatsapp: string; address: string; hours: string }
  social: { instagram: string; facebook: string; youtube: string; pinterest: string }
  shipping: { freeShippingThreshold: number; methods: (ShippingOption & { freeAboveThreshold: boolean })[] }
  payments: { razorpay: boolean; razorpayKeyId: string | null; cod: boolean }
}

export interface Job {
  id: string
  title: string
  slug: string
  department: string
  location: string
  type: string
  summary: string
  description?: string
  responsibilities?: string[]
  requirements?: string[]
  createdAt: string
}
