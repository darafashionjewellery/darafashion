import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from '../../types'
import { ProductCard } from './ProductCard'

/** Horizontally scrolling product row with snap points; arrow buttons on desktop. */
export function ProductCarousel({ products, label, showCategory }: { products: Product[]; label: string; showCategory?: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={track} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-5 sm:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]">
            <ProductCard product={p} showCategory={showCategory} />
          </div>
        ))}
      </div>
      {products.length > 4 && (
        <>
          <button onClick={() => scroll(-1)} aria-label="Previous products" className="absolute top-[38%] -left-4 hidden size-10 items-center justify-center rounded-full bg-white shadow-lift hover:text-brand-dark lg:flex">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Next products" className="absolute top-[38%] -right-4 hidden size-10 items-center justify-center rounded-full bg-white shadow-lift hover:text-brand-dark lg:flex">
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  )
}
