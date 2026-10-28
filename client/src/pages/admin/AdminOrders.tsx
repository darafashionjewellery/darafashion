import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { adminApi } from '../../services/admin'
import { errorMessage } from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce, useDocumentTitle } from '../../hooks/misc'
import { useToast } from '../../context/ToastContext'
import { AdminTitle, OrderStatusPill, Pager, Panel, Pill, SearchInput, Select, Table } from '../../components/admin/AdminUI'
import { AddressBlock } from '../../components/account/AddressForm'
import { TotalsTable } from '../../components/checkout/OrderSummary'
import { SmartImage } from '../../components/ui/Images'
import { ErrorState, PageLoader, Spinner } from '../../components/ui/States'
import type { Order, OrderStatus } from '../../types'
import { ORDER_STATUS_LABELS, formatDate, formatPrice } from '../../lib/utils'

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]
const PAYMENT_TONES: Record<string, string> = { paid: 'bg-sage/15 text-sage-dark', pending: 'bg-cream text-ink', failed: 'bg-brand-soft text-danger', refunded: 'bg-stone/20 text-muted' }

export function AdminOrdersPage() {
  useDocumentTitle('Orders — Admin')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const debounced = useDebounce(q, 300)
  const status = params.get('status') ?? ''
  const paymentStatus = params.get('payment') ?? ''
  const page = Number(params.get('page')) || 1

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  const { data, loading, error, reload } = useAsync(
    () => adminApi.orders({ q: debounced || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, page, limit: 25 }),
    [debounced, status, paymentStatus, page],
  )

  return (
    <div>
      <AdminTitle title="Orders" subtitle={data ? `${data.total} order${data.total === 1 ? '' : 's'}` : undefined} />
      <Panel>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search order no., email, name, phone" />
          <Select label="Order status" value={status} onChange={(v) => setParam('status', v)} options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))]} />
          <Select
            label="Payment status"
            value={paymentStatus}
            onChange={(v) => setParam('payment', v)}
            options={[{ value: '', label: 'All payments' }, ...['pending', 'paid', 'failed', 'refunded'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]}
          />
        </div>
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} className="m-4" />
        ) : (
          <>
            <Table head={['Order', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status']} empty={!data?.items.length}>
              {data?.items.map((o) => (
                <tr key={o.id} className="hover:bg-cream-light">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/admin/orders/${o.id}`} className="hover:text-brand-dark">
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p>{o.shippingAddress.fullName}</p>
                    <p className="text-xs text-muted">{o.email}</p>
                  </td>
                  <td className="px-4 py-3">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3">
                    <Pill className={PAYMENT_TONES[o.paymentStatus]}>{o.paymentMethod === 'cod' ? 'COD' : 'Online'} · {o.paymentStatus}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusPill status={o.status} />
                  </td>
                </tr>
              ))}
            </Table>
            <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} onChange={(p) => setParam('page', String(p))} />
          </>
        )}
      </Panel>
    </div>
  )
}

export function AdminOrderDetailPage() {
  const { id = '' } = useParams()
  useDocumentTitle('Order — Admin')
  const { data: order, loading, error, reload, setData } = useAsync(() => adminApi.order(id), [id])

  if (loading) return <PageLoader />
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={reload} />

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/orders" className="text-sm link">
          ← All orders
        </Link>
        <AdminTitle title={`Order #${order.orderNumber}`} subtitle={`Placed ${formatDate(order.createdAt)} · ${order.email}`} actions={<OrderStatusPill status={order.status} />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-line">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-4 px-5 py-3">
                  <SmartImage src={i.image} alt="" className="size-14 rounded object-cover" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-muted">
                      SKU {i.variantSku ?? i.sku}
                      {i.variantLabel && ` · ${i.variantLabel}`}
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {i.quantity} × {formatPrice(i.unitPrice)}
                  </p>
                  <p className="w-24 text-right text-sm font-medium">{formatPrice(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <TotalsTable totals={{ subtotal: order.subtotal, savings: 0, shippingFee: order.shippingFee, total: order.total }} shippingLabel={order.shippingMethod?.label} />
            </div>
          </Panel>

          <Panel title="Status history">
            <ol className="space-y-3 px-5 py-4 text-sm">
              {[...order.statusHistory].reverse().map((h, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                  <div>
                    <p>
                      <span className="font-medium">{ORDER_STATUS_LABELS[h.status] ?? h.status}</span> <span className="text-muted">· {new Date(h.at).toLocaleString('en-IN')}</span>
                    </p>
                    {h.note && <p className="text-xs text-muted">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <StatusForm order={order} onSaved={setData} />
          <Panel title="Payment">
            <dl className="space-y-2 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Method</dt>
                <dd>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Status</dt>
                <dd>
                  <Pill className={PAYMENT_TONES[order.paymentStatus]}>{order.paymentStatus}</Pill>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{order.shippingMethod?.label}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Ship to">
            <div className="px-5 py-4">
              <AddressBlock address={order.shippingAddress} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function StatusForm({ order, onSaved }: { order: Order; onSaved: (o: Order) => void }) {
  const toast = useToast()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [note, setNote] = useState('')
  const [trackingNumber, setTracking] = useState(order.trackingNumber)
  const [courier, setCourier] = useState(order.courier)
  const [saving, setSaving] = useState(false)
  const locked = order.status === 'cancelled'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'cancelled' && order.status !== 'cancelled' && !window.confirm('Cancel this order? Stock will be returned to inventory.')) return
    setSaving(true)
    try {
      const updated = await adminApi.updateOrderStatus(order.id, { status, note: note || undefined, trackingNumber, courier })
      onSaved(updated)
      setNote('')
      toast.success('Order updated')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel title="Update order">
      <form onSubmit={submit} className="space-y-4 px-5 py-4">
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" className="input" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} disabled={locked}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {locked && <p className="mt-1 text-xs text-muted">Cancelled orders cannot be reopened.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="courier" className="label">
              Courier
            </label>
            <input id="courier" className="input" value={courier} onChange={(e) => setCourier(e.target.value)} />
          </div>
          <div>
            <label htmlFor="tracking" className="label">
              Tracking no.
            </label>
            <input id="tracking" className="input" value={trackingNumber} onChange={(e) => setTracking(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="note" className="label">
            Note (shown to customer)
          </label>
          <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Optional" />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="size-4" />} Save
        </button>
      </form>
    </Panel>
  )
}
