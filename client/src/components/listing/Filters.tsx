import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Facets, FacetOption } from '../../types'
import { PRICE_RANGES, occasionLabel } from '../../config/navigation'
import { cn, titleCase } from '../../lib/utils'

export const MULTI_FILTERS = ['category', 'style', 'occasion', 'craft', 'color', 'material'] as const
export type MultiFilter = (typeof MULTI_FILTERS)[number]

export const FILTER_LABELS: Record<MultiFilter, string> = {
  category: 'Category',
  style: 'Style',
  occasion: 'Occasion',
  craft: 'Craftsmanship',
  color: 'Colour',
  material: 'Material',
}

export const optionLabel = (key: MultiFilter, option: FacetOption, styleLabels?: Map<string, string>) =>
  key === 'occasion'
    ? occasionLabel(option.value)
    : key === 'category'
      ? option.label
      : key === 'style'
        ? (styleLabels?.get(option.value) ?? titleCase(option.label))
        : titleCase(option.label)

export const readList = (params: URLSearchParams, key: string) => (params.get(key) ?? '').split(',').filter(Boolean)

interface FilterPanelProps {
  facets: Facets | undefined
  params: URLSearchParams
  hidden: MultiFilter[]
  onToggle: (key: MultiFilter, value: string) => void
  onPrice: (min?: number, max?: number) => void
  onInStock: (value: boolean) => void
  styleLabels?: Map<string, string>
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-4">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between text-left">
        <span className="text-xs font-semibold tracking-[0.18em] uppercase">{title}</span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  )
}

function Check({ checked, onChange, label, count, type = 'checkbox', name }: { checked: boolean; onChange: () => void; label: string; count?: number; type?: 'checkbox' | 'radio'; name?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-muted hover:text-ink">
      <input type={type} name={name} checked={checked} onChange={onChange} className="size-4 accent-brand-dark" />
      <span className={cn('flex-1', checked && 'text-ink')}>{label}</span>
      {count !== undefined && <span className="text-xs text-stone">{count}</span>}
    </label>
  )
}

/** Filter sidebar content (also rendered inside the mobile filter drawer). */
export function FilterPanel({ facets, params, hidden, onToggle, onPrice, onInStock, styleLabels }: FilterPanelProps) {
  const minPrice = params.get('minPrice')
  const maxPrice = params.get('maxPrice')
  const priceKey = `${minPrice ?? ''}-${maxPrice ?? ''}`

  return (
    <div>
      {MULTI_FILTERS.filter((k) => !hidden.includes(k)).map((key) => {
        const selected = readList(params, key)
        const options = facets?.[key] ?? []
        // Keep selected values visible even if they currently have zero matches.
        const merged = [...options, ...selected.filter((v) => !options.some((o) => o.value === v)).map((v) => ({ value: v, label: v, count: 0 }))]
        if (!merged.length) return null
        return (
          <Section key={key} title={FILTER_LABELS[key]} defaultOpen={key !== 'material'}>
            {merged.map((o) => (
              <Check key={o.value} checked={selected.includes(o.value)} onChange={() => onToggle(key, o.value)} label={optionLabel(key, o, styleLabels)} count={o.count} />
            ))}
          </Section>
        )
      })}

      <Section title="Price">
        <Check type="radio" name="price" checked={priceKey === '-'} onChange={() => onPrice()} label="Any price" />
        {PRICE_RANGES.map((r) => (
          <Check key={r.label} type="radio" name="price" checked={priceKey === `${r.min ?? ''}-${r.max ?? ''}`} onChange={() => onPrice(r.min, r.max)} label={r.label} />
        ))}
      </Section>

      <Section title="Availability">
        <Check checked={params.get('inStock') === 'true'} onChange={() => onInStock(params.get('inStock') !== 'true')} label="In stock only" count={facets?.inStockCount} />
      </Section>
    </div>
  )
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - nums[i - 1] > 1 && <span className="text-muted">…</span>}
          <button
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={cn('size-9 rounded-full text-sm', n === page ? 'bg-ink text-white' : 'hover:bg-cream')}
          >
            {n}
          </button>
        </span>
      ))}
      <button className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  )
}
