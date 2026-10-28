import { Link } from 'react-router'
import { AlertTriangle, Inbox, Star } from 'lucide-react'
import { adminApi } from '../../services/admin'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/misc'
import { AdminTitle, OrderStatusPill, Panel, StatCard, Table } from '../../components/admin/AdminUI'
import { ErrorState, PageLoader } from '../../components/ui/States'
import { SmartImage } from '../../components/ui/Images'
import { ORDER_STATUS_LABELS, formatDate, formatPrice } from '../../lib/utils'

const PIPELINE = ['pending_payment', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']

export default function AdminDashboard() {
  useDocumentTitle('Admin Dashboard')
  const { data, loading, error, reload } = useAsync(() => adminApi.stats(), [])
  if (loading) return <PageLoader />
  if (error || !data) return <ErrorState message={error ?? 'Could not load the dashboard'} onRetry={reload} />

  const toFulfil = (data.orders.byStatus.placed ?? 0) + (data.orders.byStatus.confirmed ?? 0) + (data.orders.byStatus.packed ?? 0)

  return (
    <div className="space-y-6">
      <AdminTitle title="Dashboard" subtitle="Overview of your store" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (30 days)" value={formatPrice(data.revenue.last30Days)} hint={`${data.revenue.last30DaysOrders} orders · ${formatPrice(data.revenue.total)} all time`} />
        <StatCard label="Orders to fulfil" value={toFulfil} hint={`${data.orders.total} orders in total`} tone={toFulfil ? 'alert' : 'default'} />
        <StatCard label="Customers" value={data.customers} />
        <StatCard label="Products" value={data.products.active} hint={data.products.hidden ? `${data.products.hidden} hidden` : 'All visible'} />
      </div>

      {(data.pendingReviews > 0 || data.newMessages > 0 || data.lowStock.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {data.pendingReviews > 0 && (
            <Link to="/admin/reviews" className="flex items-center gap-2 rounded-pill bg-white px-4 py-2 text-sm shadow-card hover:text-brand-dark">
              <Star className="size-4 text-brand" aria-hidden /> {data.pendingReviews} review{data.pendingReviews === 1 ? '' : 's'} awaiting approval
            </Link>
          )}
          {data.newMessages > 0 && (
            <Link to="/admin/inbox" className="flex items-center gap-2 rounded-pill bg-white px-4 py-2 text-sm shadow-card hover:text-brand-dark">
              <Inbox className="size-4 text-brand" aria-hidden /> {data.newMessages} new message{data.newMessages === 1 ? '' : 's'}
            </Link>
          )}
          {data.lowStock.length > 0 && (
            <Link to="/admin/products?stock=low" className="flex items-center gap-2 rounded-pill bg-white px-4 py-2 text-sm shadow-card hover:text-brand-dark">
              <AlertTriangle className="size-4 text-brand" aria-hidden /> {data.lowStock.length} product{data.lowStock.length === 1 ? '' : 's'} low on stock
            </Link>
          )}
        </div>
      )}

      <Panel title="Orders by status">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-8">
          {PIPELINE.map((s) => (
            <Link key={s} to={`/admin/orders?status=${s}`} className="bg-white p-4 hover:bg-cream-light">
              <p className="text-[11px] tracking-wider text-muted uppercase">{ORDER_STATUS_LABELS[s]}</p>
              <p className="mt-1 text-2xl font-medium">{data.orders.byStatus[s] ?? 0}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title="Recent orders" actions={<Link to="/admin/orders" className="text-sm link">View all</Link>}>
          <Table head={['Order', 'Customer', 'Date', 'Total', 'Status']} empty={!data.recentOrders.length}>
            {data.recentOrders.map((o) => (
              <tr key={o.id} className="hover:bg-cream-light">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/admin/orders/${o.id}`} className="hover:text-brand-dark">
                    #{o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p>{o.shippingAddress.fullName}</p>
                  <p className="text-xs text-muted">{o.email}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatPrice(o.total)}</td>
                <td className="px-4 py-3">
                  <OrderStatusPill status={o.status} />
                </td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Low stock" actions={<Link to="/admin/products?stock=low" className="text-sm link">Manage</Link>}>
          {data.lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.lowStock.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-cream-light">
                    <SmartImage src={p.images[0]} alt="" className="size-10 rounded object-cover" />
                    <span className="flex-1 text-sm">
                      {p.name}
                      <span className="block text-xs text-muted">{p.sku}</span>
                    </span>
                    <span className={p.totalStock <= 0 ? 'text-sm font-medium text-danger' : 'text-sm font-medium text-brand-dark'}>{p.totalStock <= 0 ? 'Out' : `${p.totalStock} left`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
