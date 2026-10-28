import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useDocumentTitle } from '../hooks/misc'
import { EmptyState, PageLoader } from '../components/ui/States'
import { QuantitySelector } from '../components/ui/Elements'
import { SmartImage } from '../components/ui/Images'
import { TotalsTable } from '../components/checkout/OrderSummary'
import type { CartLine } from '../types'
import { cn, formatPrice } from '../lib/utils'

export default function CartPage() {
  useDocumentTitle('Shopping Bag')
  const cart = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (cart.loading && !cart.lines.length) return <PageLoader />
  if (!cart.lines.length || !cart.totals) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ShoppingBag className="size-10" />} title="Your bag is empty" message="Discover something beautiful to add." action={{ label: 'Start Shopping', to: '/shop' }} />
      </div>
    )
  }

  const { totals } = cart
  const remainingForFree = totals.freeShippingThreshold - totals.subtotal
  const checkout = () => navigate(user ? '/checkout' : '/login?redirect=/checkout')

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl">
        Your Bag <span className="font-sans text-lg font-normal text-muted">({totals.itemCount})</span>
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {remainingForFree > 0 && totals.freeShippingThreshold > 0 && (
            <p className="mb-4 flex items-center gap-2 rounded-lg bg-cream-light p-3 text-sm">
              <Truck className="size-4 text-brand-dark" aria-hidden />
              Add {formatPrice(remainingForFree)} more for free standard shipping.
            </p>
          )}
          {totals.hasIssues && (
            <p className="mb-4 rounded-lg border border-danger/30 bg-brand-soft p-3 text-sm text-danger" role="alert">
              Some items need your attention before checkout.
            </p>
          )}
          <ul className="divide-y divide-line border-y border-line">
            {cart.lines.map((line) => (
              <CartRow key={`${line.productId}-${line.variantSku}`} line={line} />
            ))}
          </ul>
          <Link to="/shop" className="mt-6 inline-block text-sm link">
            ← Continue shopping
          </Link>
        </div>

        <aside className="h-fit rounded-card bg-cream-light p-6 lg:sticky lg:top-36" aria-label="Price details">
          <h2 className="mb-4 text-2xl">Price Details</h2>
          <TotalsTable totals={totals} shippingLabel={totals.shippingMethod.label} />
          <p className="mt-2 text-xs text-muted">Shipping method can be changed at checkout.</p>
          <button onClick={checkout} disabled={totals.hasIssues} className="btn-primary mt-6 w-full">
            Proceed to Checkout
          </button>
          {!user && (
            <p className="mt-3 text-center text-xs text-muted">
              Please log in to check out. New here?{' '}
              <Link to="/signup?redirect=/checkout" className="link">
                Create an account
              </Link>
            </p>
          )}
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck className="size-4 text-sage-dark" aria-hidden /> Secure checkout
          </p>
        </aside>
      </div>
    </div>
  )
}

function CartRow({ line }: { line: CartLine }) {
  const cart = useCart()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const slug = line.product?.slug
  return (
    <li className={cn('flex gap-4 py-5', busy && 'opacity-60')}>
      <Link to={slug ? `/product/${slug}` : '#'} className="w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
        <SmartImage src={line.image} alt={line.product?.name ?? 'Product'} className="aspect-[4/5] w-full object-cover" />
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-3">
          <div>
            {slug ? (
              <Link to={`/product/${slug}`} className="font-medium hover:text-brand-dark">
                {line.product?.name}
              </Link>
            ) : (
              <p className="font-medium">Unavailable item</p>
            )}
            {line.variantLabel && <p className="text-xs text-muted">Finish: {line.variantLabel}</p>}
            {line.unitPrice !== undefined && <p className="mt-1 text-sm text-muted">{formatPrice(line.unitPrice)} each</p>}
          </div>
          {line.lineTotal !== undefined && <p className="font-medium">{formatPrice(line.lineTotal)}</p>}
        </div>
        {line.issue && (
          <p className="text-xs font-medium text-danger" role="alert">
            {line.issue}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          {line.available ? (
            <QuantitySelector size="sm" value={line.quantity} max={line.maxQuantity ?? 10} disabled={busy} onChange={(q) => run(() => cart.updateQuantity(line, q))} />
          ) : (
            <span />
          )}
          <button onClick={() => run(() => cart.removeItem(line))} disabled={busy} className="flex items-center gap-1 text-xs text-muted hover:text-danger">
            <Trash2 className="size-4" aria-hidden /> Remove
          </button>
        </div>
      </div>
    </li>
  )
}
