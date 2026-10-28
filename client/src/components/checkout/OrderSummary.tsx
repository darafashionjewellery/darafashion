import type { ReactNode } from 'react'
import type { CartLine, CartTotals } from '../../types'
import { formatPrice } from '../../lib/utils'
import { SmartImage } from '../ui/Images'

export function TotalsTable({ totals, shippingLabel }: { totals: Pick<CartTotals, 'subtotal' | 'savings' | 'shippingFee' | 'total'>; shippingLabel?: string }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd>{formatPrice(totals.subtotal)}</dd>
      </div>
      {totals.savings > 0 && (
        <div className="flex justify-between text-sage-dark">
          <dt>You save</dt>
          <dd>−{formatPrice(totals.savings)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Shipping{shippingLabel ? ` (${shippingLabel})` : ''}</dt>
        <dd>{totals.shippingFee === 0 ? 'Free' : formatPrice(totals.shippingFee)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
        <dt>Total</dt>
        <dd>{formatPrice(totals.total)}</dd>
      </div>
    </dl>
  )
}

/** Compact order summary used on both checkout steps. */
export function OrderSummary({ lines, totals, children }: { lines: CartLine[]; totals: CartTotals; children?: ReactNode }) {
  return (
    <aside className="rounded-card bg-cream-light p-5 lg:sticky lg:top-36" aria-label="Order summary">
      <h2 className="mb-4 text-2xl">Order Summary</h2>
      <ul className="mb-5 space-y-3">
        {lines.map((l) => (
          <li key={`${l.productId}-${l.variantSku}`} className="flex gap-3">
            <div className="relative">
              <SmartImage src={l.image} alt="" className="size-16 rounded-md object-cover" />
              <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">{l.quantity}</span>
            </div>
            <div className="flex-1 text-sm">
              <p className="leading-snug">{l.product?.name}</p>
              {l.variantLabel && <p className="text-xs text-muted">{l.variantLabel}</p>}
            </div>
            <p className="text-sm">{formatPrice(l.lineTotal ?? 0)}</p>
          </li>
        ))}
      </ul>
      <TotalsTable totals={totals} shippingLabel={totals.shippingMethod.label} />
      {children}
    </aside>
  )
}
