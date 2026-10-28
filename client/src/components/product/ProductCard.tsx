import { Link } from 'react-router'
import { Eye, Heart } from 'lucide-react'
import type { Product } from '../../types'
import { useWishlist } from '../../context/WishlistContext'
import { useQuickView } from './QuickView'
import { Price, Rating } from '../ui/Elements'
import { SmartImage } from '../ui/Images'
import { cn } from '../../lib/utils'

export function ProductCard({ product, showCategory = false }: { product: Product; showCategory?: boolean }) {
  const wishlist = useWishlist()
  const quickView = useQuickView()
  const saved = wishlist.has(product.id)
  const [primary, secondary] = product.images

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden rounded-card bg-cream">
        <Link to={`/product/${product.slug}`} aria-label={product.name} className="block">
          <SmartImage src={primary} alt={product.name} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          {secondary && (
            <SmartImage src={secondary} alt="" aria-hidden className="absolute inset-0 aspect-[4/5] w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          )}
        </Link>

        <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
          {product.isNewArrival && <span className="rounded-pill bg-white/95 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase">New</span>}
          {product.isBestSeller && <span className="rounded-pill bg-brand px-2.5 py-1 text-[10px] font-medium tracking-wider text-white uppercase">Bestseller</span>}
        </div>

        <button
          type="button"
          onClick={() => wishlist.toggle(product.id, product.name)}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={saved}
          className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-card transition-colors hover:text-brand-dark"
        >
          <Heart className={cn('size-4', saved && 'fill-accent text-accent')} />
        </button>

        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1.5 text-center text-xs font-medium tracking-wider text-white uppercase">Out of stock</span>
        )}

        {product.inStock && (
          <button
            type="button"
            onClick={() => quickView.open(product.slug)}
            className="absolute inset-x-3 bottom-3 hidden items-center justify-center gap-2 rounded-pill bg-white/95 py-2 text-xs font-medium tracking-wider uppercase opacity-0 shadow-card transition-all group-hover:opacity-100 hover:bg-brand hover:text-white focus-visible:opacity-100 md:flex"
          >
            <Eye className="size-4" aria-hidden /> Quick View
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {showCategory && product.category && <p className="text-[11px] tracking-wider text-muted uppercase">{product.category.name}</p>}
        <h3 className="font-sans text-sm leading-snug font-normal text-ink">
          <Link to={`/product/${product.slug}`} className="hover:text-brand-dark">
            {product.name}
          </Link>
        </h3>
        {product.ratingCount > 0 && <Rating value={product.ratingAverage} count={product.ratingCount} />}
        <Price price={product.price} compareAtPrice={product.compareAtPrice} discountPercent={product.discountPercent} size="sm" />
        {product.hasVariants && product.variants.some((v) => v.swatch) && (
          <div className="mt-1 flex gap-1.5" aria-label="Available finishes">
            {product.variants.map((v) => (
              <span key={v.sku} title={v.label} className="size-3.5 rounded-full border border-line" style={{ background: v.swatch || undefined }} />
            ))}
          </div>
        )}
        <button type="button" onClick={() => quickView.open(product.slug)} className="mt-1 self-start text-xs font-medium tracking-wider text-brand-dark uppercase md:hidden">
          Quick View
        </button>
      </div>
    </article>
  )
}

export function ProductGrid({ products, showCategory }: { products: Product[]; showCategory?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} showCategory={showCategory} />
      ))}
    </div>
  )
}
