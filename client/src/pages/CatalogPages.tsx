import { Link, useParams, useSearchParams } from 'react-router'
import { ListingPage } from './ListingPage'
import NotFoundPage from './NotFoundPage'
import { useSite } from '../context/SiteContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/misc'
import { catalogApi } from '../services'
import { assets, collectionBanner } from '../config/assets'
import { OCCASIONS } from '../config/navigation'
import { PageLoader, ErrorState } from '../components/ui/States'
import { PageHeader } from '../components/ui/Elements'
import { SmartImage } from '../components/ui/Images'

export const ShopAllPage = () => <ListingPage title="Shop All" subtitle="Discover our complete range of fashion jewellery and accessories." breadcrumbs={[{ label: 'Shop All' }]} />

export const NewArrivalsPage = () => (
  <ListingPage title="New Arrivals" subtitle="Fresh styles for your next celebration." scope={{ tag: 'new' }} breadcrumbs={[{ label: 'New Arrivals' }]} />
)

export const BestSellersPage = () => (
  <ListingPage title="Best Sellers" subtitle="Our most-loved designs." scope={{ tag: 'bestseller' }} breadcrumbs={[{ label: 'Best Sellers' }]} />
)

export function CategoryPage() {
  const { slug = '' } = useParams()
  const { categories, catalogLoaded } = useSite()
  if (!catalogLoaded) return <PageLoader />
  const category = categories.find((c) => c.slug === slug)
  if (!category) return <NotFoundPage />
  return (
    <ListingPage
      key={slug}
      title={category.navLabel}
      subtitle={category.description}
      scope={{ category: slug }}
      banner={category.bannerImage || undefined}
      breadcrumbs={[{ label: 'Shop', to: '/shop' }, { label: category.navLabel }]}
    />
  )
}

/** Collection listing. `slug` prop is used by fixed routes such as /bridal and /wedding-store. */
export function CollectionPage({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams()
  const slug = fixedSlug ?? params.slug ?? ''
  const { data, loading, error, status, reload } = useAsync(() => catalogApi.collection(slug), [slug])
  if (loading) return <PageLoader />
  if (status === 404) return <NotFoundPage />
  if (error || !data) return <ErrorState message={error ?? 'Unable to load this collection'} onRetry={reload} className="container-page my-10" />
  return (
    <ListingPage
      key={slug}
      title={data.name}
      subtitle={data.description}
      scope={{ collection: slug }}
      banner={collectionBanner(slug, data.bannerImage)}
      breadcrumbs={[{ label: 'Collections', to: '/collections' }, { label: data.name }]}
    />
  )
}

export function OccasionPage() {
  const { slug = '' } = useParams()
  const occasion = OCCASIONS.find((o) => o.slug === slug)
  if (!occasion) return <NotFoundPage />
  return (
    <ListingPage
      key={slug}
      title={occasion.label}
      subtitle={occasion.description}
      scope={{ occasion: slug }}
      breadcrumbs={[{ label: 'Occasions', to: '/occasions' }, { label: occasion.label }]}
    />
  )
}

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  return <ListingPage key={q} title={q ? `Results for “${q}”` : 'Search'} search={q || undefined} breadcrumbs={[{ label: 'Search' }]} />
}

export function CollectionsIndexPage() {
  useDocumentTitle('Collections')
  const { collections, catalogLoaded } = useSite()
  const extra = [
    { slug: 'new-arrivals', to: '/new-arrivals', name: 'New Arrivals', tagline: 'Fresh styles, just in', image: assets.banners.everyday },
    { slug: 'best-sellers', to: '/best-sellers', name: 'Best Sellers', tagline: 'Our most-loved designs', image: assets.banners.hero },
  ]
  const cards = [...collections.map((c) => ({ slug: c.slug, to: `/collections/${c.slug}`, name: c.name, tagline: c.tagline, image: c.image })), ...extra]
  return (
    <>
      <PageHeader title="Collections" subtitle="Curated edits for every mood, moment and celebration." />
      <div className="container-page py-12">
        {!catalogLoaded ? (
          <PageLoader />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <Link key={c.slug} to={c.to} className="group relative overflow-hidden rounded-card">
                <SmartImage src={c.image} alt="" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-6 pt-16">
                  <p className="font-serif text-3xl font-semibold text-white">{c.name}</p>
                  <p className="text-sm text-white/85">{c.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export function OccasionsIndexPage() {
  useDocumentTitle('Shop by Occasion')
  return (
    <>
      <PageHeader title="Shop by Occasion" subtitle="Find the right piece for every moment." />
      <div className="container-page grid grid-cols-2 gap-4 py-12 sm:gap-6 lg:grid-cols-5">
        {OCCASIONS.map((o) => (
          <Link key={o.slug} to={`/occasions/${o.slug}`} className="group relative overflow-hidden rounded-card">
            <SmartImage src={o.image} alt="" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-4 pt-12">
              <p className="font-serif text-2xl font-semibold text-white">{o.label}</p>
              <p className="text-xs text-white/85">{o.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
