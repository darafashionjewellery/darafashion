import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Search, X } from 'lucide-react'
import { catalogApi } from '../../services'
import { useDebounce } from '../../hooks/misc'
import type { Product } from '../../types'
import { formatPrice, cn } from '../../lib/utils'
import { SmartImage } from '../ui/Images'
import { Spinner } from '../ui/States'

/** Search input with live suggestions. Enter goes to the full results page. */
export function SearchBox({ autoFocus, onNavigate, className }: { autoFocus?: boolean; onNavigate?: () => void; className?: string }) {
  const navigate = useNavigate()
  const listId = useId()
  const [term, setTerm] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const debounced = useDebounce(term.trim(), 250)

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)
    catalogApi
      .products({ q: debounced, limit: 6 })
      .then((res) => !cancelled && setResults(res.items))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debounced])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = term.trim()
    if (!q) return
    setFocused(false)
    onNavigate?.()
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const showPanel = focused && debounced.length >= 2

  return (
    <form role="search" onSubmit={submit} className={cn('relative', className)}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search jewellery
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id={`${listId}-input`}
        type="search"
        value={term}
        autoFocus={autoFocus}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search earrings, necklaces, bangles…"
        autoComplete="off"
        aria-controls={listId}
        aria-expanded={showPanel}
        className="w-full rounded-pill border border-line bg-cream-light py-2.5 pr-10 pl-11 text-sm placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none"
      />
      {term && (
        <button type="button" onClick={() => setTerm('')} aria-label="Clear search" className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink">
          <X className="size-4" />
        </button>
      )}

      {showPanel && (
        <div id={listId} className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-card border border-line bg-white shadow-lift">
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted">
              <Spinner className="size-4" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-muted">No matches for “{debounced}”.</p>
          ) : (
            <ul>
              <li className="px-4 pt-3 pb-1 text-[11px] tracking-wider text-muted uppercase">Top results</li>
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/product/${p.slug}`}
                    onClick={() => {
                      setFocused(false)
                      onNavigate?.()
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-cream-light"
                  >
                    <SmartImage src={p.images[0]} alt="" className="size-12 rounded-md object-cover" />
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span className="text-sm font-medium">{formatPrice(p.price)}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button type="submit" className="w-full border-t border-line px-4 py-3 text-left text-sm font-medium text-brand-dark hover:bg-cream-light">
                  View all results for “{term.trim()}”
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </form>
  )
}
