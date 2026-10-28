import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronDown, ChevronRight, Minus, Plus, Star } from 'lucide-react'
import { cn, formatPrice } from '../../lib/utils'

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/" className="hover:text-brand-dark">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden />
            {item.to ? (
              <Link to={item.to} className="hover:text-brand-dark">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function SectionHeading({ eyebrow, title, subtitle, action, align = 'center' }: { eyebrow?: string; title: string; subtitle?: string; action?: { label: string; to: string }; align?: 'center' | 'left' }) {
  return (
    <div className={cn('mb-8 flex flex-col gap-2', align === 'center' ? 'items-center text-center' : 'items-start sm:flex-row sm:items-end sm:justify-between')}>
      <div className={cn(align === 'center' && 'flex flex-col items-center')}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-muted">{subtitle}</p>}
        {align === 'center' && <span className="mt-3 block h-px w-16 bg-brand" aria-hidden />}
      </div>
      {action && (
        <Link to={action.to} className="group mt-2 inline-flex items-center gap-1 text-sm font-medium tracking-wider text-ink uppercase hover:text-brand-dark">
          {action.label}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}

export function Price({ price, compareAtPrice, discountPercent, size = 'md' }: { price: number; compareAtPrice?: number | null; discountPercent?: number; size?: 'sm' | 'md' | 'lg' }) {
  const showCompare = compareAtPrice && compareAtPrice > price
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn('font-medium text-ink', size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-sm')}>{formatPrice(price)}</span>
      {showCompare && (
        <>
          <span className={cn('text-muted line-through', size === 'lg' ? 'text-base' : 'text-xs')}>
            <span className="sr-only">Original price </span>
            {formatPrice(compareAtPrice)}
          </span>
          {!!discountPercent && <span className={cn('font-medium text-sage-dark', size === 'lg' ? 'text-sm' : 'text-xs')}>{discountPercent}% off</span>}
        </>
      )}
    </div>
  )
}

export function Rating({ value, count, size = 'sm' }: { value: number; count?: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn(size === 'sm' ? 'size-3.5' : 'size-4', i < Math.round(value) ? 'fill-accent text-accent' : 'text-beige')} aria-hidden />
      ))}
      {count !== undefined && <span className="ml-1 text-xs text-muted">({count})</span>}
    </div>
  )
}

export function QuantitySelector({ value, onChange, max = 10, disabled, size = 'md' }: { value: number; onChange: (v: number) => void; max?: number; disabled?: boolean; size?: 'sm' | 'md' }) {
  const btn = cn('flex items-center justify-center text-ink transition-colors hover:text-brand-dark disabled:text-stone disabled:cursor-not-allowed', size === 'sm' ? 'size-8' : 'size-10')
  return (
    <div className="inline-flex items-center rounded-pill border border-line" role="group" aria-label="Quantity">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <span className={cn('min-w-8 text-center font-medium', size === 'sm' ? 'text-sm' : '')} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line">
      <button type="button" className="flex w-full items-center justify-between py-4 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="text-sm font-medium tracking-wider uppercase">{title}</span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && <div className="pb-5 text-sm text-muted">{children}</div>}
    </div>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Field({ label, error, hint, id, className, ...props }: FieldProps) {
  const inputId = id ?? `f-${props.name}`
  return (
    <div className={className}>
      <label htmlFor={inputId} className="label">
        {label}
        {props.required && <span className="text-brand-dark"> *</span>}
      </label>
      <input id={inputId} className={cn('input', error && 'input-error')} aria-invalid={!!error} aria-describedby={error ? `${inputId}-err` : undefined} {...props} />
      {error ? (
        <p id={`${inputId}-err`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="bg-cream-light py-10 sm:py-14">
      <div className="container-page text-center">
        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-3 max-w-2xl text-muted">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
