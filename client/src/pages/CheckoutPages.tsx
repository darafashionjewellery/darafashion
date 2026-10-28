import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Banknote, Check, CreditCard, Plus, ShieldCheck } from 'lucide-react'
import { accountApi, cartApi, orderApi } from '../services'
import { errorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useSite } from '../context/SiteContext'
import { useDocumentTitle } from '../hooks/misc'
import { AddressBlock, AddressForm } from '../components/account/AddressForm'
import { OrderSummary } from '../components/checkout/OrderSummary'
import { EmptyState, ErrorState, PageLoader, Spinner } from '../components/ui/States'
import { openRazorpay } from '../lib/razorpay'
import type { CartResponse } from '../types'
import { cn, formatPrice } from '../lib/utils'

const STATE_KEY = 'dara_checkout'
const readState = (): { addressId?: string } => {
  try {
    return JSON.parse(sessionStorage.getItem(STATE_KEY) || '{}')
  } catch {
    return {}
  }
}
const writeState = (s: { addressId?: string }) => {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

function Steps({ current }: { current: 1 | 2 }) {
  const steps = ['Contact & Address', 'Shipping & Payment']
  return (
    <ol className="mb-8 flex items-center gap-3 text-xs tracking-wider uppercase sm:gap-6">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        return (
          <li key={label} className="flex items-center gap-2" aria-current={n === current ? 'step' : undefined}>
            <span className={cn('flex size-7 items-center justify-center rounded-full text-sm', n === current ? 'bg-brand text-white' : done ? 'bg-ink text-white' : 'bg-cream text-muted')}>
              {done ? <Check className="size-4" /> : n}
            </span>
            <span className={cn(n === current ? 'text-ink' : 'text-muted')}>{label}</span>
            {n < steps.length && <span className="hidden h-px w-10 bg-line sm:block" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}

export function CheckoutAddressPage() {
  useDocumentTitle('Checkout')
  const { user, setUser } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const addresses = user?.addresses ?? []
  const [selected, setSelected] = useState<string | undefined>(() => {
    const saved = readState().addressId
    return addresses.find((a) => a.id === saved)?.id ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id
  })
  const [adding, setAdding] = useState(addresses.length === 0)
  const [error, setError] = useState<string | null>(null)

  if (cart.loading && !cart.lines.length) return <PageLoader />
  if (!cart.lines.length || !cart.totals) return <Navigate to="/cart" replace />

  const proceed = () => {
    if (!selected) return setError('Please choose a delivery address.')
    writeState({ addressId: selected })
    navigate('/checkout/payment')
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-4xl">Checkout</h1>
      <Steps current={1} />
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="card p-5">
            <h2 className="text-2xl">Contact Information</h2>
            <p className="mt-2 text-sm text-muted">
              Order updates will be sent to <span className="font-medium text-ink">{user?.email}</span>
            </p>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 text-2xl">Delivery Address</h2>
            {addresses.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Saved addresses">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={selected === a.id}
                    onClick={() => {
                      setSelected(a.id)
                      setError(null)
                    }}
                    className={cn('rounded-card border p-4 text-left transition-colors', selected === a.id ? 'border-brand bg-brand-soft/50' : 'border-line hover:border-beige')}
                  >
                    <span className="mb-2 inline-block rounded-pill bg-white px-2 py-0.5 text-[10px] tracking-wider uppercase">
                      {a.label}
                      {a.isDefault && ' · Default'}
                    </span>
                    <AddressBlock address={a} />
                  </button>
                ))}
              </div>
            )}

            {adding ? (
              <div className={cn(addresses.length > 0 && 'mt-6 border-t border-line pt-6')}>
                <h3 className="mb-4 font-sans text-sm font-medium tracking-wider uppercase">New address</h3>
                <AddressForm
                  initial={{ fullName: user?.name ?? '', phone: user?.phone ?? '' }}
                  submitLabel="Save address"
                  serverError={error}
                  onCancel={addresses.length ? () => setAdding(false) : undefined}
                  onSubmit={async (address) => {
                    try {
                      const res = await accountApi.addAddress(address)
                      setUser(res.user)
                      setSelected(res.addressId)
                      setAdding(false)
                      setError(null)
                    } catch (err) {
                      setError(errorMessage(err))
                    }
                  }}
                />
              </div>
            ) : (
              <button onClick={() => setAdding(true)} className="btn-ghost mt-4 px-0">
                <Plus className="size-4" aria-hidden /> Add a new address
              </button>
            )}
          </section>

          {!adding && error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Link to="/cart" className="text-sm link">
              ← Back to bag
            </Link>
            <button onClick={proceed} disabled={adding || !selected} className="btn-primary">
              Continue to Shipping
            </button>
          </div>
        </div>
        <OrderSummary lines={cart.lines} totals={cart.totals} />
      </div>
    </div>
  )
}

export function CheckoutPaymentPage() {
  useDocumentTitle('Checkout — Payment')
  const { user } = useAuth()
  const cart = useCart()
  const { config, configLoaded } = useSite()
  const navigate = useNavigate()
  const address = user?.addresses.find((a) => a.id === readState().addressId)

  const [shippingMethod, setShippingMethod] = useState('standard')
  const [quote, setQuote] = useState<CartResponse | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | null>(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Server-calculated totals for the selected shipping method.
  useEffect(() => {
    let cancelled = false
    setQuoteError(null)
    cartApi
      .get(shippingMethod)
      .then((res) => !cancelled && setQuote(res))
      .catch((err) => !cancelled && setQuoteError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [shippingMethod, cart.lines])

  useEffect(() => {
    if (!configLoaded || paymentMethod) return
    if (config.payments.razorpay) setPaymentMethod('razorpay')
    else if (config.payments.cod) setPaymentMethod('cod')
  }, [configLoaded, config.payments, paymentMethod])

  if (!address) return <Navigate to="/checkout" replace />
  if (!cart.loading && !cart.lines.length) return <Navigate to="/cart" replace />
  if (quoteError) return <ErrorState message={quoteError} className="container-page my-10" />
  if (!quote || !configLoaded) return <PageLoader />

  const noPayments = !config.payments.razorpay && !config.payments.cod

  // Navigate before refreshing the (now empty) bag so the "empty bag" redirect never fires.
  const finish = (orderId: string) => {
    sessionStorage.removeItem(STATE_KEY)
    navigate(`/order-confirmation/${orderId}`, { replace: true })
    cart.refresh()
  }

  const placeOrder = async () => {
    if (!paymentMethod) return setError('Please choose a payment method.')
    setPlacing(true)
    setError(null)
    try {
      const { addressId } = readState()
      const { order, payment } = await orderApi.create({ addressId, shippingMethod, paymentMethod })

      if (paymentMethod === 'cod' || !payment) {
        finish(order.id)
        return
      }

      const outcome = await openRazorpay(payment, { name: address.fullName, email: user?.email, contact: address.phone }, `Order ${order.orderNumber}`)
      if (outcome.status === 'success') {
        await orderApi.verifyPayment(order.id, outcome.response)
        finish(order.id)
      } else if (outcome.status === 'dismissed') {
        setError('Payment was not completed. Your bag is saved — you can try again.')
      } else {
        setError(`${outcome.reason}. Your bag is saved — please try again.`)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-4xl">Checkout</h1>
      <Steps current={2} />
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="card flex items-start justify-between gap-4 p-5">
            <div>
              <h2 className="mb-2 text-2xl">Delivering to</h2>
              <AddressBlock address={address} />
            </div>
            <Link to="/checkout" className="text-sm link">
              Change
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 text-2xl">Shipping Method</h2>
            <div className="space-y-3" role="radiogroup" aria-label="Shipping method">
              {quote.totals.shippingOptions.map((o) => (
                <label key={o.id} className={cn('flex cursor-pointer items-center gap-4 rounded-card border p-4', shippingMethod === o.id ? 'border-brand bg-brand-soft/50' : 'border-line')}>
                  <input type="radio" name="shipping" className="size-4 accent-brand-dark" checked={shippingMethod === o.id} onChange={() => setShippingMethod(o.id)} />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{o.label}</span>
                    <span className="text-xs text-muted">{o.description}</span>
                  </span>
                  <span className="text-sm font-medium">{o.fee === 0 ? 'Free' : formatPrice(o.fee)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 text-2xl">Payment Method</h2>
            {noPayments ? (
              <EmptyState title="Payments are not available yet" message="Online payments have not been configured for this store. Please contact us to place your order." className="py-8" />
            ) : (
              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                {config.payments.razorpay && (
                  <label className={cn('flex cursor-pointer items-center gap-4 rounded-card border p-4', paymentMethod === 'razorpay' ? 'border-brand bg-brand-soft/50' : 'border-line')}>
                    <input type="radio" name="payment" className="size-4 accent-brand-dark" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                    <CreditCard className="size-5 text-brand-dark" aria-hidden />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">Pay Online</span>
                      <span className="text-xs text-muted">UPI, cards, net banking and wallets via Razorpay</span>
                    </span>
                  </label>
                )}
                {config.payments.cod && (
                  <label className={cn('flex cursor-pointer items-center gap-4 rounded-card border p-4', paymentMethod === 'cod' ? 'border-brand bg-brand-soft/50' : 'border-line')}>
                    <input type="radio" name="payment" className="size-4 accent-brand-dark" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <Banknote className="size-5 text-brand-dark" aria-hidden />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">Cash on Delivery</span>
                      <span className="text-xs text-muted">Pay when your order arrives</span>
                    </span>
                  </label>
                )}
              </div>
            )}
          </section>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-brand-soft p-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Link to="/checkout" className="text-sm link">
              ← Back
            </Link>
            <button onClick={placeOrder} disabled={placing || noPayments || quote.totals.hasIssues} className="btn-primary">
              {placing && <Spinner className="size-4" />}
              {paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatPrice(quote.totals.total)}`}
            </button>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="size-4 text-sage-dark" aria-hidden /> Your order is confirmed only after the payment is verified by our server.
          </p>
        </div>
        <OrderSummary lines={quote.items} totals={quote.totals} />
      </div>
    </div>
  )
}
