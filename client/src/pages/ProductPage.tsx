import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Share2, Star } from 'lucide-react'
import { catalogApi } from '../services'
import { errorMessage } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/misc'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Accordion, Breadcrumbs, Rating, SectionHeading } from '../components/ui/Elements'
import { ErrorState, PageLoader, Spinner } from '../components/ui/States'
import { ImageGallery } from '../components/product/ImageGallery'
import { PurchasePanel } from '../components/product/PurchasePanel'
import { ProductCarousel } from '../components/product/ProductCarousel'
import { occasionLabel } from '../config/navigation'
import type { ProductDetail, Variant } from '../types'
import { cn, formatDate, titleCase } from '../lib/utils'
import NotFoundPage from './NotFoundPage'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const { data: product, loading, error, status, reload } = useAsync(() => catalogApi.product(slug), [slug])
  const [variant, setVariant] = useState<Variant | null>(null)
  useDocumentTitle(product?.name)

  if (loading) return <PageLoader />
  if (status === 404) return <NotFoundPage />
  if (error || !product) return <ErrorState message={error ?? 'Product not found'} onRetry={reload} className="container-page my-10" />

  const images = variant?.images.length ? variant.images : product.images
  const specs = [
    { label: 'SKU', value: variant?.sku ?? product.sku },
    product.category && { label: 'Category', value: product.category.name },
    product.style && { label: 'Style', value: titleCase(product.style) },
    product.craftsmanship && { label: 'Craftsmanship', value: product.craftsmanship },
    product.material && { label: 'Material', value: product.material },
    product.occasions.length > 0 && { label: 'Occasion', value: product.occasions.map(occasionLabel).join(', ') },
    ...product.details,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div key={product.id}>
      <div className="container-page py-6">
        <Breadcrumbs items={[...(product.category ? [{ label: product.category.name, to: `/category/${product.category.slug}` }] : []), { label: product.name }]} />

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ImageGallery key={variant?.sku ?? 'base'} images={images} alt={product.name} />

          <div className="flex flex-col gap-5">
            <div>
              {product.category && (
                <Link to={`/category/${product.category.slug}`} className="eyebrow hover:underline">
                  {product.category.name}
                </Link>
              )}
              <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
                <span>SKU: {variant?.sku ?? product.sku}</span>
                {product.ratingCount > 0 && (
                  <a href="#reviews" className="hover:text-brand-dark">
                    <Rating value={product.ratingAverage} count={product.ratingCount} />
                  </a>
                )}
                <ShareButton name={product.name} />
              </div>
            </div>

            <PurchasePanel product={product} onVariantChange={setVariant} />

            <div className="mt-2">
              <Accordion title="Description" defaultOpen>
                <p className="leading-relaxed whitespace-pre-line">{product.description || 'Description coming soon.'}</p>
              </Accordion>
              <Accordion title="Product Information">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                  {specs.map((s) => (
                    <div key={s.label} className="contents">
                      <dt className="text-ink">{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
              {product.careInstructions.length > 0 && (
                <Accordion title="Care Instructions">
                  <ul className="list-disc space-y-1 pl-5">
                    {product.careInstructions.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </Accordion>
              )}
              <Accordion title="Shipping & Returns">
                <p>
                  Shipping options and charges are shown at checkout. See our <Link to="/shipping-policy" className="link">Shipping Policy</Link> and{' '}
                  <Link to="/returns" className="link">Return &amp; Refund Policy</Link>.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <Reviews product={product} />
      <RelatedProducts productId={product.id} />
    </div>
  )
}

function ShareButton({ name }: { name: string }) {
  const toast = useToast()
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: name, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      }
    } catch {
      /* user cancelled */
    }
  }
  return (
    <button onClick={share} className="flex items-center gap-1 hover:text-brand-dark">
      <Share2 className="size-3.5" aria-hidden /> Share
    </button>
  )
}

function RelatedProducts({ productId }: { productId: string }) {
  const { data } = useAsync(() => catalogApi.related(productId), [productId])
  if (!data?.length) return null
  return (
    <section className="container-page py-12">
      <SectionHeading title="You May Also Like" align="left" />
      <ProductCarousel products={data} label="Related products" />
    </section>
  )
}

function Reviews({ product }: { product: ProductDetail }) {
  const { user } = useAuth()
  const location = useLocation()
  const { data, loading } = useAsync(() => catalogApi.reviews(product.id), [product.id])
  const [formOpen, setFormOpen] = useState(false)

  return (
    <section id="reviews" className="border-t border-line bg-cream-light py-12">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl">Customer Reviews</h2>
            {data && data.ratingCount > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Rating value={data.ratingAverage} size="md" />
                <span className="text-sm text-muted">
                  {data.ratingAverage.toFixed(1)} out of 5 · {data.ratingCount} review{data.ratingCount === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>
          {user ? (
            <button onClick={() => setFormOpen((o) => !o)} className="btn-secondary btn-sm">
              Write a review
            </button>
          ) : (
            <Link to={`/login?redirect=${encodeURIComponent(location.pathname + '#reviews')}`} className="btn-secondary btn-sm">
              Log in to write a review
            </Link>
          )}
        </div>

        {formOpen && <ReviewForm productId={product.id} onDone={() => setFormOpen(false)} />}

        <div className="mt-8">
          {loading ? (
            <Spinner className="text-brand" />
          ) : !data?.items.length ? (
            <p className="text-sm text-muted">There are no reviews for this product yet.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {data.items.map((r) => (
                <li key={r.id} className="rounded-card bg-white p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <Rating value={r.rating} />
                    <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                  <p className="mt-2 text-sm text-muted">{r.body}</p>
                  <p className="mt-3 text-xs">
                    {r.displayName}
                    {r.verifiedPurchase && <span className="ml-2 text-sage-dark">✓ Verified purchase</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

function ReviewForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!rating) return setError('Please choose a star rating.')
    if (body.trim().length < 10) return setError('Please write at least 10 characters.')
    setSaving(true)
    setError(null)
    try {
      const res = await catalogApi.submitReview(productId, { rating, title, body })
      toast.success(res.message)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-xl space-y-4 rounded-card bg-white p-5 shadow-card">
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={rating === n}>
              <Star className={cn('size-7', n <= rating ? 'fill-accent text-accent' : 'text-beige')} />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="review-title" className="label">
          Title (optional)
        </label>
        <input id="review-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>
      <div>
        <label htmlFor="review-body" className="label">
          Your review
        </label>
        <textarea id="review-body" className="input min-h-28" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={saving} className="btn-primary">
        {saving && <Spinner className="size-4" />} Submit review
      </button>
    </form>
  )
}
