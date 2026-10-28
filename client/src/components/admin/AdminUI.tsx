import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import type { OrderStatus } from '../../types'
import { ORDER_STATUS_LABELS, cn } from '../../lib/utils'

export function AdminTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-card border border-line bg-white', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          {title && <h2 className="font-sans text-sm font-semibold tracking-wider uppercase">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ label, value, hint, tone = 'default' }: { label: string; value: ReactNode; hint?: string; tone?: 'default' | 'alert' }) {
  return (
    <div className={cn('rounded-card border bg-white p-5', tone === 'alert' ? 'border-brand' : 'border-line')}>
      <p className="text-xs tracking-wider text-muted uppercase">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-56 flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="input py-2 pl-9" />
    </div>
  )
}

export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none">
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

const ORDER_TONES: Record<string, string> = {
  pending_payment: 'bg-brand-soft text-brand-dark',
  placed: 'bg-cream text-ink',
  confirmed: 'bg-cream text-ink',
  packed: 'bg-beige/40 text-ink',
  shipped: 'bg-ink/10 text-ink',
  out_for_delivery: 'bg-ink/10 text-ink',
  delivered: 'bg-sage/15 text-sage-dark',
  cancelled: 'bg-stone/20 text-muted',
}

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <Pill className={ORDER_TONES[status]}>{ORDER_STATUS_LABELS[status] ?? status}</Pill>
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-block rounded-pill px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap capitalize', className ?? 'bg-cream text-ink')}>{children}</span>
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs tracking-wider text-muted uppercase">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {empty ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-12 text-center text-muted">
                Nothing to show.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-3 border-t border-line px-4 py-3 text-sm">
      <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="text-muted">
        Page {page} of {pages}
      </span>
      <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  )
}

/** Splits a textarea value into trimmed non-empty lines. */
export const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)
/** Splits a comma-separated value into trimmed, lower-cased entries. */
export const csv = (text: string) => text.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
