import { api } from './api'
import type { Order, OrderStatus } from '../types'
import type {
  AdminApplication,
  AdminCategory,
  AdminCollection,
  AdminCustomer,
  AdminJob,
  AdminMessage,
  AdminProduct,
  AdminProductInput,
  AdminReview,
  AdminStats,
  AdminSubscriber,
  Paged,
  ReviewStatus,
} from '../types/admin'

type Params = Record<string, string | number | undefined>
export type UploadFolder = 'products' | 'categories' | 'collections' | 'banners'

/** Client for /api/admin — every call requires an admin session. */
export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),
  customers: (params: Params) => api.get<Paged<AdminCustomer>>('/admin/customers', { params }).then((r) => r.data),

  products: (params: Params) => api.get<Paged<AdminProduct>>('/admin/products', { params }).then((r) => r.data),
  product: (id: string) => api.get<{ product: AdminProduct }>(`/admin/products/${id}`).then((r) => r.data.product),
  createProduct: (body: AdminProductInput) => api.post<{ product: AdminProduct }>('/admin/products', body).then((r) => r.data.product),
  updateProduct: (id: string, body: Partial<AdminProductInput>) => api.patch<{ product: AdminProduct }>(`/admin/products/${id}`, body).then((r) => r.data.product),
  /** Hides a product from the store but keeps it (reversible). */
  hideProduct: (id: string) => api.patch(`/admin/products/${id}`, { isActive: false }),
  /** Permanently deletes a product (past orders keep their own copy). */
  deleteProduct: (id: string) => api.delete<{ message: string }>(`/admin/products/${id}`).then((r) => r.data),
  /** Uploads an image to the server; it is resized, converted to WebP and served from /uploads/... */
  uploadImage: (file: File, folder: UploadFolder) => {
    const body = new FormData()
    body.append('file', file)
    return api.post<{ url: string; width: number; height: number; size: number }>('/admin/uploads', body, { params: { folder }, timeout: 120000 }).then((r) => r.data)
  },
  updateInventory: (id: string, body: { stock?: number; variants?: { sku: string; stock: number }[] }) =>
    api.patch<{ stock: number; variants: { sku: string; stock: number }[] }>(`/admin/products/${id}/inventory`, body).then((r) => r.data),

  orders: (params: Params) => api.get<Paged<Order>>('/admin/orders', { params }).then((r) => r.data),
  order: (id: string) => api.get<{ order: Order }>(`/admin/orders/${id}`).then((r) => r.data.order),
  updateOrderStatus: (id: string, body: { status: OrderStatus; note?: string; trackingNumber?: string; courier?: string }) =>
    api.patch<{ order: Order }>(`/admin/orders/${id}/status`, body).then((r) => r.data.order),

  categories: () => api.get<{ items: AdminCategory[] }>('/admin/categories').then((r) => r.data.items),
  saveCategory: (body: Partial<AdminCategory>, id?: string) =>
    (id ? api.patch<{ item: AdminCategory }>(`/admin/categories/${id}`, body) : api.post<{ item: AdminCategory }>('/admin/categories', body)).then((r) => r.data.item),
  /** Permanently deletes a category. Refused while products still use it. */
  deleteCategory: (id: string) => api.delete<{ message: string }>(`/admin/categories/${id}`).then((r) => r.data),

  collections: () => api.get<{ items: AdminCollection[] }>('/admin/collections').then((r) => r.data.items),
  saveCollection: (body: Partial<AdminCollection>, id?: string) =>
    (id ? api.patch<{ item: AdminCollection }>(`/admin/collections/${id}`, body) : api.post<{ item: AdminCollection }>('/admin/collections', body)).then((r) => r.data.item),
  /** Permanently deletes a collection; products tagged with it are kept and untagged. */
  deleteCollection: (id: string) => api.delete<{ message: string }>(`/admin/collections/${id}`).then((r) => r.data),

  reviews: (status?: ReviewStatus) => api.get<{ items: AdminReview[] }>('/admin/reviews', { params: { status } }).then((r) => r.data.items),
  moderateReview: (id: string, status: 'approved' | 'rejected') => api.patch(`/admin/reviews/${id}`, { status }),

  jobs: () => api.get<{ items: AdminJob[] }>('/admin/jobs').then((r) => r.data.items),
  saveJob: (body: Partial<AdminJob>, id?: string) =>
    (id ? api.patch<{ item: AdminJob }>(`/admin/jobs/${id}`, body) : api.post<{ item: AdminJob }>('/admin/jobs', body)).then((r) => r.data.item),
  applications: () => api.get<{ items: AdminApplication[] }>('/admin/job-applications').then((r) => r.data.items),
  updateApplication: (id: string, status: AdminApplication['status']) => api.patch(`/admin/job-applications/${id}`, { status }),

  messages: () => api.get<{ items: AdminMessage[] }>('/admin/contact-messages').then((r) => r.data.items),
  updateMessage: (id: string, status: AdminMessage['status']) => api.patch(`/admin/contact-messages/${id}`, { status }),
  subscribers: () => api.get<{ items: AdminSubscriber[] }>('/admin/newsletter').then((r) => r.data.items),
}
