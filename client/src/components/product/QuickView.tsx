import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Modal } from '../ui/Overlay'
import { ErrorState, PageLoader } from '../ui/States'
import { Rating } from '../ui/Elements'
import { ImageGallery } from './ImageGallery'
import { PurchasePanel } from './PurchasePanel'
import { useAsync } from '../../hooks/useAsync'
import { catalogApi } from '../../services'

const QuickViewContext = createContext<{ open: (slug: string) => void } | null>(null)

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null)
  const open = useCallback((s: string) => setSlug(s), [])
  const value = useMemo(() => ({ open }), [open])
  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <Modal open={!!slug} onClose={() => setSlug(null)} title="Quick view" hideTitle>
        {slug && <QuickViewBody slug={slug} onClose={() => setSlug(null)} />}
      </Modal>
    </QuickViewContext.Provider>
  )
}

function QuickViewBody({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data: product, loading, error, reload } = useAsync(() => catalogApi.product(slug), [slug])
  if (loading) return <PageLoader />
  if (error || !product) return <ErrorState message={error ?? 'Product not found'} onRetry={reload} className="m-6" />

  return (
    <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
      <ImageGallery images={product.images} alt={product.name} compact />
      <div className="flex flex-col gap-4">
        {product.category && <p className="eyebrow">{product.category.name}</p>}
        <h2 className="text-3xl leading-tight">{product.name}</h2>
        {product.ratingCount > 0 && <Rating value={product.ratingAverage} count={product.ratingCount} />}
        <PurchasePanel product={product} onAdded={onClose} />
        <Link to={`/product/${product.slug}`} onClick={onClose} className="link text-sm font-medium">
          View full details
        </Link>
      </div>
    </div>
  )
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext)
  if (!ctx) throw new Error('useQuickView must be used inside QuickViewProvider')
  return ctx
}
