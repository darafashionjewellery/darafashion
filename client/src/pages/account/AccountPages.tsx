import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { MapPin, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { accountApi, orderApi } from '../../services'
import { errorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/misc'
import { AddressBlock, AddressForm } from '../../components/account/AddressForm'
import { TotalsTable } from '../../components/checkout/OrderSummary'
import { Field } from '../../components/ui/Elements'
import { SmartImage } from '../../components/ui/Images'
import { EmptyState, ErrorState, PageLoader, Spinner } from '../../components/ui/States'
import type { Address, Order, OrderStatus } from '../../types'
import { ORDER_STATUS_LABELS, cn, formatDate, formatPrice } from '../../lib/utils'
import NotFoundPage from '../NotFoundPage'

const safeRedirect = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : null)

export function ProfilePage() {
  useDocumentTitle('My Profile')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const welcome = params.get('welcome') === '1'
  const redirect = safeRedirect(params.get('redirect'))
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({})
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (name.trim().length < 2) errs.name = 'Enter your name'
    if (phone && !/^[6-9]\d{9}$/.test(phone)) errs.phone = 'Enter a valid 10-digit mobile number'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      const updated = await accountApi.updateProfile({ name: name.trim(), phone })
      setUser(updated)
      toast.success('Profile saved')
      if (welcome) navigate(redirect && redirect !== '/account' ? redirect : '/', { replace: true })
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl">{welcome ? 'Create Your Account' : 'My Profile'}</h1>
      <p className="mt-2 text-sm text-muted">{welcome ? 'Welcome to DARA! Tell us a little about yourself to finish setting up.' : 'Manage your personal details.'}</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Field label="Email" name="email" value={user?.email ?? ''} disabled hint="Your email is used to log in." />
        <Field label="Full name" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} error={errors.phone} hint="Optional — used for delivery updates." />
        {errors.form && (
          <p className="text-sm text-danger" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Spinner className="size-4" />} {welcome ? 'Create Account' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

export function AddressesPage() {
  useDocumentTitle('My Addresses')
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const addresses = user?.addresses ?? []

  const remove = async (a: Address) => {
    if (!window.confirm('Delete this address?')) return
    try {
      setUser(await accountApi.deleteAddress(a.id))
      toast.show('Address deleted')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">My Addresses</h1>
        {!editing && (
          <button onClick={() => setEditing('new')} className="btn-secondary btn-sm">
            <Plus className="size-4" aria-hidden /> Add address
          </button>
        )}
      </div>

      {editing && (
        <div className="card mt-6 p-5">
          <h2 className="mb-4 text-xl">{editing === 'new' ? 'New address' : 'Edit address'}</h2>
          <AddressForm
            initial={editing === 'new' ? { fullName: user?.name, phone: user?.phone } : editing}
            submitLabel="Save address"
            serverError={error}
            onCancel={() => {
              setEditing(null)
              setError(null)
            }}
            onSubmit={async (values) => {
              try {
                const updated = editing === 'new' ? (await accountApi.addAddress(values)).user : await accountApi.updateAddress(editing.id, values)
                setUser(updated)
                setEditing(null)
                setError(null)
                toast.success('Address saved')
              } catch (err) {
                setError(errorMessage(err))
              }
            }}
          />
        </div>
      )}

      {!addresses.length && !editing ? (
        <EmptyState icon={<MapPin className="size-10" />} title="No saved addresses" message="Add an address to check out faster." className="mt-6" />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="card flex flex-col p-5">
              <span className="mb-2 inline-block self-start rounded-pill bg-cream px-2 py-0.5 text-[10px] tracking-wider uppercase">
                {a.label}
                {a.isDefault && ' · Default'}
              </span>
              <AddressBlock address={a} />
              <div className="mt-4 flex gap-4 text-sm">
                <button onClick={() => setEditing(a)} className="flex items-center gap-1 text-ink hover:text-brand-dark">
                  <Pencil className="size-4" aria-hidden /> Edit
                </button>
                <button onClick={() => remove(a)} className="flex items-center gap-1 text-muted hover:text-danger">
                  <Trash2 className="size-4" aria-hidden /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const ORDER_TABS: { label: string; match: (s: OrderStatus) => boolean }[] = [
  { label: 'All', match: () => true },
  { label: 'Processing', match: (s) => ['pending_payment', 'placed', 'confirmed', 'packed'].includes(s) },
  { label: 'Shipped', match: (s) => ['shipped', 'out_for_delivery'].includes(s) },
  { label: 'Delivered', match: (s) => s === 'delivered' },
  { label: 'Cancelled', match: (s) => s === 'cancelled' },
]

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === 'delivered' ? 'bg-sage/15 text-sage-dark' : status === 'cancelled' ? 'bg-stone/20 text-muted' : status === 'pending_payment' ? 'bg-brand-soft text-brand-dark' : 'bg-cream text-ink'
  return <span className={cn('rounded-pill px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase', tone)}>{ORDER_STATUS_LABELS[status]}</span>
}

export function OrdersPage() {
  useDocumentTitle('My Orders')
  const { data, loading, error, reload } = useAsync(() => orderApi.mine(), [])
  const [tab, setTab] = useState(0)
  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={reload} />
  const orders = (data ?? []).filter((o) => ORDER_TABS[tab].match(o.status))

  return (
    <div>
      <h1 className="text-3xl">My Orders</h1>
      <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto" role="tablist">
        {ORDER_TABS.map((t, i) => (
          <button key={t.label} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={cn('shrink-0 rounded-pill px-4 py-1.5 text-sm', tab === i ? 'bg-ink text-white' : 'bg-cream-light text-muted hover:text-ink')}>
            {t.label}
          </button>
        ))}
      </div>
      {!orders.length ? (
        <EmptyState icon={<Package className="size-10" />} title="No orders here yet" message={tab === 0 ? 'When you place an order, it will appear here.' : 'No orders in this category.'} action={tab === 0 ? { label: 'Start Shopping', to: '/shop' } : undefined} className="mt-6" />
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderRow({ order }: { order: Order }) {
  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <p className="font-medium">Order #{order.orderNumber}</p>
          <p className="text-xs text-muted">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex -space-x-3">
          {order.items.slice(0, 3).map((i, idx) => (
            <SmartImage key={idx} src={i.image} alt="" className="size-14 rounded-md border-2 border-white object-cover" />
          ))}
        </div>
        <p className="flex-1 text-sm text-muted">
          {order.items.length} item{order.items.length === 1 ? '' : 's'} · {formatPrice(order.total)}
        </p>
        <Link to={`/account/orders/${order.id}`} className="btn-secondary btn-sm">
          {['shipped', 'out_for_delivery'].includes(order.status) ? 'Track Order' : 'View Details'}
        </Link>
      </div>
    </li>
  )
}

const TRACK_STEPS: OrderStatus[] = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

export function OrderDetailPage() {
  const { id = '' } = useParams()
  useDocumentTitle('Order details')
  const toast = useToast()
  const { data: order, loading, error, status, reload, setData } = useAsync(() => orderApi.get(id), [id])
  const [cancelling, setCancelling] = useState(false)

  if (loading) return <PageLoader />
  if (status === 404) return <NotFoundPage />
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={reload} />

  const currentStep = TRACK_STEPS.indexOf(order.status)
  const canCancel = order.paymentStatus !== 'paid' && ['pending_payment', 'placed'].includes(order.status)

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return
    setCancelling(true)
    try {
      setData(await orderApi.cancel(order.id))
      toast.show('Order cancelled')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/account/orders" className="text-sm link">
            ← All orders
          </Link>
          <h1 className="mt-2 text-3xl">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== 'cancelled' && order.status !== 'pending_payment' && (
        <section className="card p-5" aria-label="Order tracking">
          <h2 className="mb-5 text-xl">Tracking</h2>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-6 sm:gap-2">
            {TRACK_STEPS.map((s, i) => {
              const reached = currentStep >= i
              return (
                <li key={s} className="flex items-center gap-3 sm:flex-col sm:text-center">
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs', reached ? 'bg-brand text-white' : 'bg-cream text-muted')}>{i + 1}</span>
                  <span className={cn('text-xs', reached ? 'text-ink' : 'text-muted')}>{ORDER_STATUS_LABELS[s]}</span>
                </li>
              )
            })}
          </ol>
          {(order.courier || order.trackingNumber) && (
            <p className="mt-5 text-sm">
              {order.courier && <>Courier: <span className="font-medium">{order.courier}</span> · </>}
              {order.trackingNumber && <>Tracking number: <span className="font-medium">{order.trackingNumber}</span></>}
            </p>
          )}
        </section>
      )}

      {order.status === 'pending_payment' && (
        <p className="rounded-lg bg-brand-soft p-4 text-sm">
          {order.paymentStatus === 'failed' ? 'The payment for this order failed.' : 'We are waiting for payment confirmation for this order.'} If money was deducted, it will be confirmed automatically or refunded by the payment provider.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <h2 className="mb-4 text-xl">Items</h2>
          <ul className="divide-y divide-line">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex gap-4 py-3">
                <SmartImage src={i.image} alt="" className="size-16 rounded-md object-cover" />
                <div className="flex-1 text-sm">
                  <Link to={`/product/${i.slug}`} className="font-medium hover:text-brand-dark">
                    {i.name}
                  </Link>
                  {i.variantLabel && <p className="text-xs text-muted">{i.variantLabel}</p>}
                  <p className="text-xs text-muted">
                    Qty {i.quantity} × {formatPrice(i.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatPrice(i.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 text-xl">Payment</h2>
            <p className="mb-4 text-sm text-muted">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'} · <span className="capitalize">{order.paymentStatus}</span>
            </p>
            <TotalsTable totals={{ subtotal: order.subtotal, savings: 0, shippingFee: order.shippingFee, total: order.total }} shippingLabel={order.shippingMethod?.label} />
          </section>
          <section className="card p-5">
            <h2 className="mb-3 text-xl">Delivery Address</h2>
            <AddressBlock address={order.shippingAddress} />
          </section>
          {order.statusHistory.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 text-xl">History</h2>
              <ul className="space-y-2 text-sm">
                {[...order.statusHistory].reverse().map((h, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{ORDER_STATUS_LABELS[h.status] ?? h.status}</span>
                    <span className="text-muted"> · {formatDate(h.at)}</span>
                    {h.note && <p className="text-xs text-muted">{h.note}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {canCancel && (
            <button onClick={cancel} disabled={cancelling} className="btn-secondary w-full">
              {cancelling && <Spinner className="size-4" />} Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
