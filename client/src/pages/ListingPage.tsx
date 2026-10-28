import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { catalogApi, type ProductQuery } from '../services'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/misc'
import { useSite } from '../context/SiteContext'
import { Breadcrumbs } from '../components/ui/Elements'
import { SmartImage } from '../components/ui/Images'
import { Drawer } from '../components/ui/Overlay'
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/ui/States'
import { ProductGrid } from '../components/product/ProductCard'
import { FILTER_LABELS, FilterPanel, MULTI_FILTERS, Pagination, optionLabel, readList, type MultiFilter } from '../components/listing/Filters'
import { formatPrice } from '../lib/utils'

export interface ListingScope {
  category?: string
  collection?: string
  occasion?: string
  tag?: 'new' | 'bestseller' | 'featured'
}

interface ListingPageProps {
  title: string
  subtitle?: string
  scope?: ListingScope
  banner?: string
  breadcrumbs?: { label: string; to?: string }[]
  /** Free-text search term (search results page). */
  search?: string
  intro?: ReactNode
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popularity', needsData: true },
]

const PAGE_SIZE = 24

/**
 * Shared listing used by Shop All, categories, collections, occasions, new arrivals,
 * best sellers and search. Filters, sort and page live in the URL query string.
 */
export function ListingPage({ title, subtitle, scope = {}, banner, breadcrumbs, search, intro }: ListingPageProps) {
  useDocumentTitle(title)
  const [params, setParams] = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { categories } = useSite()
  const styleLabels = useMemo(() => new Map(categories.flatMap((c) => c.styles.map((s) => [s.toLowerCase(), s] as const))), [categories])

  // Filters that are fixed by the page itself are hidden from the sidebar.
  const hidden: MultiFilter[] = [...(scope.category ? (['category'] as const) : []), ...(scope.occasion ? (['occasion'] as const) : [])]

  const query = useMemo<ProductQuery>(() => {
    const q: ProductQuery = { facets: 'true', limit: PAGE_SIZE, page: Number(params.get('page')) || 1, sort: params.get('sort') || 'newest' }
    for (const key of MULTI_FILTERS) {
      const values = readList(params, key)
      if (values.length) q[key] = values.join(',')
    }
    for (const key of ['minPrice', 'maxPrice', 'inStock'] as const) {
      const v = params.get(key)
      if (v) q[key] = v
    }
    if (scope.category) q.category = scope.category
    if (scope.occasion) q.occasion = scope.occasion
    if (scope.collection) q.collection = scope.collection
    if (scope.tag) q.tag = scope.tag
    if (search) q.q = search
    return q
  }, [params, scope.category, scope.occasion, scope.collection, scope.tag, search])

  const { data, loading, error, reload } = useAsync(() => catalogApi.products(query), [JSON.stringify(query)])

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    mutate(next)
    next.delete('page')
    setParams(next, { replace: false })
  }

  const toggle = (key: MultiFilter, value: string) =>
    update((p) => {
      const values = readList(p, key)
      const nextValues = values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
      if (nextValues.length) p.set(key, nextValues.join(','))
      else p.delete(key)
    })

  const setPrice = (min?: number, max?: number) =>
    update((p) => {
      p.delete('minPrice')
      p.delete('maxPrice')
      if (min !== undefined) p.set('minPrice', String(min))
      if (max !== undefined) p.set('maxPrice', String(max))
    })

  const setInStock = (on: boolean) => update((p) => (on ? p.set('inStock', 'true') : p.delete('inStock')))
  const setSort = (sort: string) => update((p) => p.set('sort', sort))
  const clearAll = () => update((p) => [...MULTI_FILTERS, 'minPrice', 'maxPrice', 'inStock'].forEach((k) => p.delete(k)))
  const setPage = (page: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(page))
    setParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Active filter chips
  const chips: { label: string; onRemove: () => void }[] = []
  for (const key of MULTI_FILTERS) {
    if (hidden.includes(key)) continue
    for (const value of readList(params, key)) {
      const opt = data?.facets?.[key].find((o) => o.value === value) ?? { value, label: value, count: 0 }
      chips.push({ label: `${FILTER_LABELS[key]}: ${optionLabel(key, opt, styleLabels)}`, onRemove: () => toggle(key, value) })
    }
  }
  if (params.get('minPrice') || params.get('maxPrice')) {
    const min = params.get('minPrice')
    const max = params.get('maxPrice')
    chips.push({ label: `Price: ${min ? formatPrice(Number(min)) : '₹0'} – ${max ? formatPrice(Number(max)) : 'above'}`, onRemove: () => setPrice() })
  }
  if (params.get('inStock') === 'true') chips.push({ label: 'In stock', onRemove: () => setInStock(false) })

  const sortOptions = SORT_OPTIONS.filter((o) => !o.needsData || data?.popularityAvailable)
  const panel = <FilterPanel facets={data?.facets} params={params} hidden={hidden} onToggle={toggle} onPrice={setPrice} onInStock={setInStock} styleLabels={styleLabels} />

  return (
    <div>
      {banner ? (
        <section className="relative overflow-hidden bg-cream">
          <SmartImage src={banner} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-cream/80 via-cream/50 to-transparent" aria-hidden />
          <div className="container-page relative py-12 sm:py-20">
            {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
            <h1 className="mt-4 text-4xl sm:text-6xl">{title}</h1>
            {subtitle && <p className="mt-3 max-w-lg text-muted">{subtitle}</p>}
          </div>
        </section>
      ) : (
        <div className="container-page pt-6">
          {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
          <h1 className="mt-4 text-4xl sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>
      )}

      <div className="container-page pt-6 pb-8">
        {intro}

        {/* Category quick links (Kushals-style chips) */}
        {!scope.category && !search && categories.length > 0 && (
          <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {categories.map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="shrink-0 rounded-pill border border-line px-4 py-2 text-xs tracking-wider whitespace-nowrap uppercase hover:border-brand hover:text-brand-dark">
                {c.navLabel}
              </Link>
            ))}
          </div>
        )}

        <div className="flex gap-10">
          <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filters">
            <div className="sticky top-36">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <p className="font-serif text-xl font-semibold">Filter</p>
                {chips.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-brand-dark hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              {panel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted" aria-live="polite">
                {loading ? 'Loading…' : `${data?.total ?? 0} ${data?.total === 1 ? 'product' : 'products'}`}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setDrawerOpen(true)} className="btn-secondary btn-sm lg:hidden">
                  <SlidersHorizontal className="size-4" aria-hidden /> Filter{chips.length ? ` (${chips.length})` : ''}
                </button>
                <label htmlFor="sort" className="sr-only">
                  Sort by
                </label>
                <select id="sort" value={params.get('sort') || 'newest'} onChange={(e) => setSort(e.target.value)} className="rounded-pill border border-line bg-white py-2 pr-8 pl-4 text-sm focus:border-brand focus:outline-none">
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      Sort: {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button key={c.label} onClick={c.onRemove} className="flex items-center gap-1.5 rounded-pill bg-cream px-3 py-1.5 text-xs hover:bg-brand-soft" aria-label={`Remove filter ${c.label}`}>
                    {c.label} <X className="size-3" aria-hidden />
                  </button>
                ))}
                <button onClick={clearAll} className="px-2 text-xs text-brand-dark hover:underline">
                  Clear all
                </button>
              </div>
            )}

            {loading ? (
              <ProductGridSkeleton />
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : !data?.items.length ? (
              <EmptyState
                icon={<SearchX className="size-10" />}
                title={search ? `No results for “${search}”` : 'No products found'}
                message={chips.length ? 'Try removing some filters to see more designs.' : 'New designs are added regularly — please check back soon.'}
              >
                {chips.length > 0 ? (
                  <button onClick={clearAll} className="btn-primary mt-2">
                    Clear filters
                  </button>
                ) : (
                  <Link to="/shop" className="btn-primary mt-2">
                    Shop All
                  </Link>
                )}
              </EmptyState>
            ) : (
              <>
                <ProductGrid products={data.items} showCategory={!scope.category} />
                <Pagination page={data.page} pages={data.pages} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filter & Sort" side="right">
        <div className="px-5 pb-28">{panel}</div>
        <div className="fixed right-0 bottom-0 flex w-[88%] max-w-sm gap-3 border-t border-line bg-white p-4">
          <button onClick={clearAll} className="btn-secondary flex-1" disabled={!chips.length}>
            Clear
          </button>
          <button onClick={() => setDrawerOpen(false)} className="btn-primary flex-1">
            Show {data?.total ?? ''} results
          </button>
        </div>
      </Drawer>
    </div>
  )
}
