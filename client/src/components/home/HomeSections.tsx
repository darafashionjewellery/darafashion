import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Gem, Headphones, Quote, ShieldCheck, Sparkles, Gift } from 'lucide-react'
import { assets, collectionBanner } from '../../config/assets'
import { OCCASIONS } from '../../config/navigation'
import { useSite } from '../../context/SiteContext'
import { useAsync } from '../../hooks/useAsync'
import { catalogApi, siteApi, type ProductQuery } from '../../services'
import { errorMessage } from '../../services/api'
import { EMAIL_RE } from '../../lib/utils'
import type { Review } from '../../types'
import { SectionHeading, Rating } from '../ui/Elements'
import { SmartImage } from '../ui/Images'
import { ErrorState, ProductGridSkeleton, Skeleton, Spinner } from '../ui/States'
import { ProductCarousel } from '../product/ProductCarousel'
import { ProductGrid } from '../product/ProductCard'

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <SmartImage src={assets.banners.hero} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-right opacity-60 md:opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/85 to-transparent md:via-cream/60" aria-hidden />
      <div className="container-page relative flex min-h-[460px] items-center py-16 md:min-h-[560px]">
        <div className="max-w-xl">
          <p className="eyebrow mb-4">Fashion Jewellery &amp; Accessories</p>
          <h1 className="text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">Every Occasion Deserves a Little DARA</h1>
          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">Discover exquisite fashion jewellery crafted to make every moment more beautiful.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-primary">
              Shop Now
            </Link>
            <Link to="/collections" className="btn-secondary">
              Explore Collections
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ShopByCategory() {
  const { categories, catalogLoaded } = useSite()
  return (
    <section className="container-page py-16">
      <SectionHeading eyebrow="Discover" title="Shop by Category" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {!catalogLoaded
          ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square rounded-full" />)
          : categories.map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="group flex flex-col items-center text-center">
                <span className="block w-full overflow-hidden rounded-full border-4 border-cream-light shadow-card transition-shadow group-hover:shadow-lift">
                  <SmartImage src={c.image} alt="" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </span>
                <span className="mt-3 font-serif text-xl font-semibold group-hover:text-brand-dark">{c.navLabel}</span>
              </Link>
            ))}
      </div>
    </section>
  )
}

/** Loads products from the API and renders them as a carousel (or grid). */
export function ProductSection({
  eyebrow,
  title,
  subtitle,
  query,
  viewAll,
  layout = 'carousel',
  showCategory,
  tone = 'white',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  query: ProductQuery
  viewAll: string
  layout?: 'carousel' | 'grid'
  showCategory?: boolean
  tone?: 'white' | 'cream'
}) {
  const { data, loading, error, reload } = useAsync(() => catalogApi.products(query), [JSON.stringify(query)])
  if (!loading && !error && !data?.items.length) return null
  return (
    <section className={tone === 'cream' ? 'bg-cream-light py-16' : 'py-16'}>
      <div className="container-page">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} action={{ label: 'View All', to: viewAll }} align="left" />
      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : layout === 'grid' ? (
        <ProductGrid products={data!.items} showCategory={showCategory} />
      ) : (
        <ProductCarousel products={data!.items} label={title} showCategory={showCategory} />
      )}
      </div>
    </section>
  )
}

export function CollectionBanner({ slug, fallbackTitle, fallbackText, variant }: { slug: string; fallbackTitle: string; fallbackText: string; variant: 'bridal' | 'festive' }) {
  const { collections } = useSite()
  const c = collections.find((x) => x.slug === slug)
  const title = c?.name ?? fallbackTitle
  const text = c?.description ?? fallbackText

  if (variant === 'bridal') {
    return (
      <section className="container-page py-8">
        <div className="relative overflow-hidden rounded-2xl bg-cream">
          <SmartImage src={collectionBanner(slug, c?.bannerImage)} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/80 to-transparent" aria-hidden />
          <div className="relative max-w-lg px-6 py-16 sm:px-12 sm:py-24">
            <p className="eyebrow mb-3">{c?.tagline ?? 'For your most special day'}</p>
            <h2 className="text-4xl sm:text-5xl">{title}</h2>
            <p className="mt-4 text-muted">{text}</p>
            <Link to={`/collections/${slug}`} className="btn-primary mt-8">
              Explore Collection
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // Festive: visually distinct — raspberry panel with the artwork on the side.
  return (
    <section className="py-8">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-2xl bg-brand-dark md:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-14 sm:px-12">
            <p className="mb-3 text-xs font-medium tracking-[0.25em] text-white/80 uppercase">{c?.tagline ?? 'Shine brighter this season'}</p>
            <h2 className="text-4xl text-white sm:text-5xl">{title}</h2>
            <p className="mt-4 text-white/85">{text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={`/collections/${slug}`} className="btn-dark">
                Shop Festive
              </Link>
              <Link to="/occasions/festive" className="btn border border-white/60 text-white hover:bg-white/10">
                Festive Picks
              </Link>
            </div>
          </div>
          <SmartImage src={c?.image || collectionBanner(slug)} alt="" aria-hidden className="h-64 w-full object-cover md:h-full" />
        </div>
      </div>
    </section>
  )
}

export function ShopByOccasion() {
  return (
    <section className="bg-cream-light py-16">
      <div className="container-page">
        <SectionHeading eyebrow="Style it right" title="Shop by Occasion" />
        <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
          {OCCASIONS.map((o) => (
            <Link key={o.slug} to={`/occasions/${o.slug}`} className="group relative w-[60%] shrink-0 snap-start overflow-hidden rounded-card sm:w-auto">
              <SmartImage src={o.image} alt="" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 pt-12">
                <p className="font-serif text-2xl font-semibold text-white">{o.label}</p>
                <p className="text-xs text-white/85">{o.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

const REASONS = [
  { icon: Sparkles, title: 'Carefully Selected Designs', text: 'Every piece is chosen to bring something special to your collection.' },
  { icon: Gem, title: 'Quality-Focused Craftsmanship', text: 'We pay attention to finish and detail so your jewellery looks its best.' },
  { icon: Gift, title: 'For Every Occasion', text: 'From daily wear to weddings and festivals — find the right piece for the moment.' },
  { icon: Headphones, title: 'Customer Support', text: 'Questions about an order? Our team is here to help.' },
  { icon: ShieldCheck, title: 'Secure Checkout', text: 'Payments are verified securely on our servers before an order is confirmed.' },
]

export function WhyDara() {
  return (
    <section className="container-page py-16">
      <SectionHeading eyebrow="The DARA promise" title="Why Choose DARA?" />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {REASONS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col items-center rounded-card border border-line bg-white p-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
              <Icon className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-xl">{title}</h3>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Shows approved customer reviews. In development, clearly-labelled placeholders show the layout when none exist. */
export function HappyCustomers() {
  const { data, loading } = useAsync(() => catalogApi.featuredReviews(6), [])
  const reviews = data ?? []
  const placeholders = !loading && reviews.length === 0 && import.meta.env.DEV
  if (loading || (!reviews.length && !placeholders)) return null

  return (
    <section className="bg-cream py-16">
      <div className="container-page">
        <SectionHeading eyebrow="Loved by you" title="Happy Customers" action={reviews.length ? { label: 'Read all', to: '/happy-customers' } : undefined} />
        {placeholders && (
          <p className="mb-6 rounded-lg border border-dashed border-brand bg-white p-3 text-center text-xs text-brand-dark">
            Development placeholder — this section is hidden in production until approved customer reviews exist.
          </p>
        )}
        <ul className="grid gap-5 md:grid-cols-3">
          {(placeholders ? PLACEHOLDER_REVIEWS : reviews.slice(0, 3)).map((r, i) => (
            <li key={i} className="flex flex-col rounded-card bg-white p-6 shadow-card">
              <Quote className="size-6 text-brand" aria-hidden />
              <Rating value={r.rating} />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{r.body}</p>
              <p className="mt-4 text-sm font-medium">{r.displayName}</p>
              {r.product && (
                <Link to={`/product/${r.product.slug}`} className="text-xs text-brand-dark hover:underline">
                  {r.product.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const PLACEHOLDER_REVIEWS: Review[] = [1, 2, 3].map((n) => ({
  id: `placeholder-${n}`,
  rating: 5,
  title: '',
  body: `[Placeholder review ${n}] Approved customer reviews will appear here.`,
  displayName: 'Sample Customer',
  verifiedPurchase: false,
  createdAt: '',
}))

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }
    setStatus('loading')
    try {
      const res = await siteApi.subscribe(email.trim(), 'homepage')
      setStatus('success')
      setMessage(res.message)
      setEmail('')
    } catch (err) {
      setStatus('error')
      setMessage(errorMessage(err))
    }
  }

  return (
    <section className="container-page py-16">
      <div className="rounded-2xl bg-cream-light px-6 py-14 text-center sm:px-12">
        <p className="eyebrow mb-3">Newsletter</p>
        <h2 className="text-4xl">A Little DARA in Your Inbox</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">Be the first to hear about new arrivals, collections and offers.</p>
        <form onSubmit={submit} noValidate className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="input flex-1 rounded-pill"
            aria-invalid={status === 'error'}
            aria-describedby="newsletter-msg"
          />
          <button type="submit" className="btn-primary" disabled={status === 'loading'}>
            {status === 'loading' && <Spinner className="size-4" />} Subscribe
          </button>
        </form>
        <p id="newsletter-msg" role="status" className={`mt-3 min-h-5 text-sm ${status === 'error' ? 'text-danger' : 'text-sage-dark'}`}>
          {status === 'success' || status === 'error' ? message : ''}
        </p>
      </div>
    </section>
  )
}
