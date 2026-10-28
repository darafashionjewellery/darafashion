import { useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import type { ProductDetail, Variant } from '../../types'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useToast } from '../../context/ToastContext'
import { Price, QuantitySelector } from '../ui/Elements'
import { Spinner } from '../ui/States'
import { cn } from '../../lib/utils'

/** Variant + quantity selection with Add to Bag / Wishlist. Shared by the PDP and Quick View. */
export function PurchasePanel({ product, onVariantChange, onAdded }: { product: ProductDetail; onVariantChange?: (v: Variant | null) => void; onAdded?: () => void }) {
  const cart = useCart()
  const wishlist = useWishlist()
  const toast = useToast()
  const firstAvailable = product.variants.find((v) => v.inStock) ?? product.variants[0] ?? null
  const [variant, setVariant] = useState<Variant | null>(firstAvailable)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const price = variant?.price ?? product.price
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice
  const discount = variant?.discountPercent ?? product.discountPercent
  const inStock = variant ? variant.inStock : product.inStock
  const lowStock = variant ? variant.lowStock : product.lowStock
  const maxQty = Math.min(10, lowStock ?? 10)
  const saved = wishlist.has(product.id)

  const choose = (v: Variant) => {
    setVariant(v)
    setQuantity(1)
    setError(null)
    onVariantChange?.(v)
  }

  const add = async () => {
    if (product.hasVariants && !variant) {
      setError('Please choose an option')
      return
    }
    setAdding(true)
    setError(null)
    try {
      await cart.addItem(product.id, variant?.sku ?? null, quantity)
      toast.success(`${product.name}${variant ? ` (${variant.label})` : ''} added to your bag`, { label: 'View bag', to: '/cart' })
      onAdded?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Price price={price} compareAtPrice={compareAtPrice} discountPercent={discount} size="lg" />
      <p className="-mt-3 text-xs text-muted">Inclusive of all taxes</p>

      {product.hasVariants && (
        <fieldset>
          <legend className="label">
            Finish: <span className="font-normal text-ink normal-case">{variant?.label ?? 'Select'}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.sku}
                type="button"
                onClick={() => choose(v)}
                aria-pressed={variant?.sku === v.sku}
                disabled={!v.inStock}
                className={cn(
                  'flex items-center gap-2 rounded-pill border px-3 py-2 text-sm transition-colors',
                  variant?.sku === v.sku ? 'border-brand bg-brand-soft' : 'border-line hover:border-beige',
                  !v.inStock && 'cursor-not-allowed text-stone line-through opacity-60',
                )}
              >
                {v.swatch && <span className="size-4 rounded-full border border-line" style={{ background: v.swatch }} aria-hidden />}
                {v.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        {inStock ? (
          <p className={cn('text-sm', lowStock ? 'font-medium text-brand-dark' : 'text-sage-dark')}>{lowStock ? `Only ${lowStock} left in stock` : 'In stock'}</p>
        ) : (
          <p className="text-sm font-medium text-danger">Out of stock</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector value={quantity} onChange={setQuantity} max={maxQty} disabled={!inStock} />
        <button type="button" onClick={add} disabled={!inStock || adding} className="btn-primary flex-1 sm:flex-none sm:min-w-56">
          {adding ? <Spinner /> : <ShoppingBag className="size-4" aria-hidden />}
          {inStock ? 'Add to Bag' : 'Sold Out'}
        </button>
        <button
          type="button"
          onClick={() => wishlist.toggle(product.id, product.name)}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
          className="flex size-12 items-center justify-center rounded-full border border-line transition-colors hover:border-brand"
        >
          <Heart className={cn('size-5', saved && 'fill-accent text-accent')} />
        </button>
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
