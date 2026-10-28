import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { CheckCircle2, Clock } from 'lucide-react'
import { orderApi } from '../services'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/misc'
import { ErrorState, PageLoader } from '../components/ui/States'
import { SmartImage } from '../components/ui/Images'
import { TotalsTable } from '../components/checkout/OrderSummary'
import { AddressBlock } from '../components/account/AddressForm'
import { formatPrice } from '../lib/utils'

export default function OrderConfirmationPage() {
  const { id = '' } = useParams()
  useDocumentTitle('Order confirmed')
  const { data: order, loading, error, reload, setData } = useAsync(() => orderApi.get(id), [id])
  const polls = useRef(0)
  const pending = order?.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid'

  // While the payment webhook is in flight, re-check every 5s for up to a minute.
  useEffect(() => {
    if (!pending || polls.current >= 12) return
    const t = setTimeout(() => {
      polls.current += 1
      orderApi.get(id).then(setData).catch(() => {})
    }, 5000)
    return () => clearTimeout(t)
  }, [pending, order, id, setData])

  if (loading) return <PageLoader />
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={reload} className="container-page my-10" />

  const awaitingPayment = order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid'

  return (
    <div className="bg-cream-light py-12">
      <div className="container-page max-w-3xl">
        <div className="rounded-2xl bg-white p-8 text-center shadow-card sm:p-12">
          {awaitingPayment ? <Clock className="mx-auto size-14 text-brand" aria-hidden /> : <CheckCircle2 className="mx-auto size-14 text-sage-dark" aria-hidden />}
          <h1 className="mt-4 text-4xl">{awaitingPayment ? 'Confirming your payment' : 'Thank You!'}</h1>
          <p className="mt-2 text-muted">
            {awaitingPayment
              ? 'We are waiting for confirmation from the payment provider. This page will update once it is verified.'
              : 'Your order has been placed successfully.'}
          </p>
          <p className="mt-6 text-lg">
            Order <span className="font-medium">#{order.orderNumber}</span>
          </p>
          <p className="text-sm text-muted">A confirmation has been sent to {order.email}.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`/account/orders/${order.id}`} className="btn-primary">
              View Order Details
            </Link>
            <Link to="/shop" className="btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section className="card p-5">
            <h2 className="mb-4 text-xl">Items</h2>
            <ul className="space-y-3">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <SmartImage src={i.image} alt="" className="size-12 rounded-md object-cover" />
                  <span className="flex-1">
                    {i.name}
                    {i.variantLabel && <span className="block text-xs text-muted">{i.variantLabel}</span>}
                    <span className="block text-xs text-muted">Qty {i.quantity}</span>
                  </span>
                  <span>{formatPrice(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              <TotalsTable totals={{ subtotal: order.subtotal, savings: 0, shippingFee: order.shippingFee, total: order.total }} shippingLabel={order.shippingMethod?.label} />
            </div>
          </section>
          <section className="card p-5">
            <h2 className="mb-4 text-xl">Delivering to</h2>
            <AddressBlock address={order.shippingAddress} />
            <p className="mt-4 text-sm text-muted">
              Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} · <span className="capitalize">{order.paymentStatus}</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
