import { useState } from 'react'
import { Link } from 'react-router'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { catalogApi } from '../services'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/misc'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useQuickView } from '../components/product/QuickView'
import { EmptyState, ErrorState, ProductGridSkeleton, Spinner } from '../components/ui/States'
import { PageHeader, Price } from '../components/ui/Elements'
import { SmartImage } from '../components/ui/Images'
import type { Product } from '../types'

export default function WishlistPage() {
  useDocumentTitle('My Wishlist')
  const wishlist = useWishlist()
  const { user } = useAuth()
  const key = wishlist.ids.join(',')
  const { data, loading, error, reload } = useAsync(
    () => (wishlist.ids.length ? catalogApi.products({ ids: key, limit: 48 }).then((r) => r.items) : Promise.resolve([] as Product[])),
    [key],
  )
  // Preserve wishlist order (most recently saved first).
  const items = (data ?? []).slice().sort((a, b) => wishlist.ids.indexOf(a.id) - wishlist.ids.indexOf(b.id))

  return (
    <>
      <PageHeader title="My Wishlist" subtitle={wishlist.ids.length ? `${wishlist.ids.length} saved item${wishlist.ids.length === 1 ? '' : 's'}` : undefined} />
      <div className="container-page py-10">
        {!user && wishlist.ids.length > 0 && (
          <p className="mb-6 rounded-lg bg-cream-light p-3 text-center text-sm text-muted">
            <Link to="/login?redirect=/wishlist" className="link font-medium">Log in</Link> to save your wishlist to your account and access it on any device.
          </p>
        )}
        {loading && wishlist.ids.length > 0 ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !items.length ? (
          <EmptyState icon={<Heart className="size-10" />} title="Your wishlist is empty" message="Tap the heart on any design to save it here." action={{ label: 'Explore Jewellery', to: '/shop' }} />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((p) => (
              <WishlistRow key={p.id} product={p} />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function WishlistRow({ product }: { product: Product }) {
  const wishlist = useWishlist()
  const cart = useCart()
  const toast = useToast()
  const quickView = useQuickView()
  const [busy, setBusy] = useState(false)

  const moveToBag = async () => {
    if (product.hasVariants) {
      quickView.open(product.slug)
      return
    }
    setBusy(true)
    try {
      await cart.addItem(product.id, null, 1)
      await wishlist.remove(product.id)
      toast.success(`${product.name} moved to your bag`, { label: 'View bag', to: '/cart' })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex gap-4 py-5">
      <Link to={`/product/${product.slug}`} className="w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
        <SmartImage src={product.images[0]} alt={product.name} className="aspect-[4/5] w-full object-cover" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to={`/product/${product.slug}`} className="font-medium hover:text-brand-dark">
            {product.name}
          </Link>
          <div className="mt-1">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} discountPercent={product.discountPercent} size="sm" />
          </div>
          {!product.inStock && <p className="mt-1 text-xs font-medium text-danger">Out of stock</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={moveToBag} disabled={!product.inStock || busy} className="btn-primary btn-sm">
            {busy ? <Spinner className="size-4" /> : <ShoppingBag className="size-4" aria-hidden />}
            {product.hasVariants ? 'Choose & Add' : 'Add to Bag'}
          </button>
          <button onClick={() => wishlist.remove(product.id)} aria-label={`Remove ${product.name} from wishlist`} className="rounded-full p-2 text-muted hover:text-danger">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </li>
  )
}
