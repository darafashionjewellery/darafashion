import { api } from './api'
import type {
  Address,
  AddressInput,
  CartResponse,
  Category,
  Collection,
  Job,
  Order,
  ProductDetail,
  ProductList,
  Product,
  RazorpayPayment,
  Review,
  SiteConfig,
  User,
} from '../types'

export type ProductQuery = Record<string, string | number | undefined>
type OtpSent = { message: string; expiresIn: number; resendIn: number }

export const catalogApi = {
  products: (params: ProductQuery) => api.get<ProductList>('/products', { params }).then((r) => r.data),
  product: (idOrSlug: string) => api.get<{ product: ProductDetail }>(`/products/${encodeURIComponent(idOrSlug)}`).then((r) => r.data.product),
  related: (id: string) => api.get<{ items: Product[] }>(`/products/${id}/related`).then((r) => r.data.items),
  categories: () => api.get<{ items: Category[] }>('/categories').then((r) => r.data.items),
  collections: () => api.get<{ items: Collection[] }>('/collections').then((r) => r.data.items),
  collection: (slug: string) => api.get<{ collection: Collection }>(`/collections/${slug}`).then((r) => r.data.collection),
  reviews: (productId: string) =>
    api.get<{ items: Review[]; ratingAverage: number; ratingCount: number }>(`/products/${productId}/reviews`).then((r) => r.data),
  submitReview: (productId: string, body: { rating: number; title: string; body: string }) =>
    api.post<{ message: string }>(`/products/${productId}/reviews`, body).then((r) => r.data),
  featuredReviews: (limit = 12) => api.get<{ items: Review[] }>('/reviews', { params: { limit } }).then((r) => r.data.items),
}

export const authApi = {
  login: (email: string, password: string) => api.post<{ user: User }>('/auth/login', { email, password }).then((r) => r.data.user),
  signup: (body: { name: string; email: string; password: string }) => api.post<OtpSent>('/auth/signup', body).then((r) => r.data),
  verifySignup: (email: string, otp: string) => api.post<{ user: User }>('/auth/signup/verify', { email, otp }).then((r) => r.data.user),
  resendSignup: (email: string) => api.post<OtpSent>('/auth/signup/resend', { email }).then((r) => r.data),
  forgotPassword: (email: string) => api.post<OtpSent>('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (body: { email: string; otp: string; password: string }) => api.post<{ user: User }>('/auth/reset-password', body).then((r) => r.data.user),
  me: () => api.get<{ user: User | null }>('/auth/me').then((r) => r.data.user),
  logout: () => api.post('/auth/logout'),
}

export const accountApi = {
  updateProfile: (body: { name: string; phone?: string }) => api.patch<{ user: User }>('/account/profile', body).then((r) => r.data.user),
  addAddress: (body: AddressInput) => api.post<{ user: User; addressId: string }>('/account/addresses', body).then((r) => r.data),
  updateAddress: (id: string, body: AddressInput) => api.put<{ user: User }>(`/account/addresses/${id}`, body).then((r) => r.data.user),
  deleteAddress: (id: string) => api.delete<{ user: User }>(`/account/addresses/${id}`).then((r) => r.data.user),
}

type LineInput = { productId: string; variantSku: string | null; quantity: number }

export const cartApi = {
  get: (shippingMethod?: string) => api.get<CartResponse>('/cart', { params: { shippingMethod } }).then((r) => r.data),
  add: (line: LineInput) => api.post<CartResponse>('/cart/items', line).then((r) => r.data),
  update: (itemId: string, quantity: number) => api.patch<CartResponse>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  remove: (itemId: string) => api.delete<CartResponse>(`/cart/items/${itemId}`).then((r) => r.data),
  merge: (items: LineInput[]) => api.post<CartResponse>('/cart/merge', { items }).then((r) => r.data),
  quote: (items: LineInput[], shippingMethod?: string) => api.post<CartResponse>('/cart/quote', { items, shippingMethod }).then((r) => r.data),
}

export const wishlistApi = {
  get: () => api.get<{ items: Product[]; productIds: string[] }>('/wishlist').then((r) => r.data),
  add: (productId: string) => api.post<{ items: Product[]; productIds: string[] }>('/wishlist/items', { productId }).then((r) => r.data),
  remove: (productId: string) => api.delete<{ items: Product[]; productIds: string[] }>(`/wishlist/items/${productId}`).then((r) => r.data),
  merge: (productIds: string[]) => api.post<{ items: Product[]; productIds: string[] }>('/wishlist/merge', { productIds }).then((r) => r.data),
}

export interface CreateOrderBody {
  addressId?: string
  address?: Omit<AddressInput, 'label' | 'isDefault'>
  saveAddress?: boolean
  shippingMethod: string
  paymentMethod: 'razorpay' | 'cod'
  notes?: string
}

export const orderApi = {
  create: (body: CreateOrderBody) => api.post<{ order: Order; payment: RazorpayPayment | null }>('/orders', body).then((r) => r.data),
  mine: () => api.get<{ items: Order[] }>('/orders/my').then((r) => r.data.items),
  get: (id: string) => api.get<{ order: Order }>(`/orders/${id}`).then((r) => r.data.order),
  verifyPayment: (id: string, body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post<{ order: Order }>(`/orders/${id}/verify-payment`, body).then((r) => r.data.order),
  cancel: (id: string) => api.post<{ order: Order }>(`/orders/${id}/cancel`).then((r) => r.data.order),
}

export const siteApi = {
  config: () => api.get<SiteConfig>('/site/config').then((r) => r.data),
  subscribe: (email: string, source?: string) => api.post<{ message: string }>('/newsletter/subscribe', { email, source }).then((r) => r.data),
  contact: (body: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
    api.post<{ message: string }>('/contact', body).then((r) => r.data),
  jobs: () => api.get<{ items: Job[] }>('/careers').then((r) => r.data.items),
  job: (slug: string) => api.get<{ job: Job }>(`/careers/${slug}`).then((r) => r.data.job),
  apply: (slug: string, body: { name: string; email: string; phone: string; resumeUrl?: string; coverLetter?: string }) =>
    api.post<{ message: string }>(`/careers/${slug}/apply`, body).then((r) => r.data),
}

export type { Address }
