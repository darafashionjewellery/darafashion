const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatPrice = (amount: number) => inr.format(amount)

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

export const titleCase = (text: string) => text.replace(/\b\w/g, (c) => c.toUpperCase())

/** localStorage helpers that never throw (private mode, blocked storage, SSR). */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage unavailable */
    }
  },
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
