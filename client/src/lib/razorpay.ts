import type { RazorpayPayment } from '../types'

interface RazorpaySuccess {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
  on: (event: 'payment.failed', handler: (res: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
let loading: Promise<void> | null = null

function loadScript() {
  if (window.Razorpay) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      loading = null
      reject(new Error('Could not load the payment window. Please check your connection and try again.'))
    }
    document.body.appendChild(s)
  })
  return loading
}

export type PaymentOutcome = { status: 'success'; response: RazorpaySuccess } | { status: 'dismissed' } | { status: 'failed'; reason: string }

/**
 * Opens Razorpay Checkout. The returned response must still be verified by the server —
 * the storefront never treats this callback alone as proof of payment.
 */
export async function openRazorpay(payment: RazorpayPayment, prefill: { name?: string; email?: string; contact?: string }, description: string): Promise<PaymentOutcome> {
  await loadScript()
  return new Promise((resolve) => {
    let settled = false
    const done = (outcome: PaymentOutcome) => {
      if (!settled) {
        settled = true
        resolve(outcome)
      }
    }
    const rzp = new window.Razorpay!({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      order_id: payment.razorpayOrderId,
      name: 'DARA Fashions',
      description,
      prefill,
      theme: { color: '#880E4F' },
      handler: (response: RazorpaySuccess) => done({ status: 'success', response }),
      modal: { ondismiss: () => done({ status: 'dismissed' }) },
    })
    rzp.on('payment.failed', (res) => done({ status: 'failed', reason: res.error?.description ?? 'Payment failed' }))
    rzp.open()
  })
}
