import { useState, type MouseEvent } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { Modal } from '../ui/Overlay'
import { SmartImage } from '../ui/Images'
import { cn } from '../../lib/utils'

/**
 * Product gallery: thumbnails, hover-zoom on desktop and a full-screen zoom viewer.
 * `compact` hides thumbnails beside the image (used in Quick View).
 */
export function ImageGallery({ images, alt, compact = false }: { images: string[]; alt: string; compact?: boolean }) {
  const list = images.length ? images : ['']
  const [index, setIndex] = useState(0)
  const [zoomOrigin, setZoomOrigin] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const current = list[Math.min(index, list.length - 1)]
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + list.length) % list.length)

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setZoomOrigin(`${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`)
  }

  return (
    <div className={cn('flex gap-3', compact ? 'flex-col' : 'flex-col-reverse md:flex-row')}>
      {list.length > 1 && (
        <div className={cn('scrollbar-none flex gap-2 overflow-auto', !compact && 'md:max-h-[560px] md:w-20 md:flex-col')} role="tablist" aria-label="Product images">
          {list.map((src, i) => (
            <button
              key={src + i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn('w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors md:w-20', i === index ? 'border-brand' : 'border-transparent hover:border-beige')}
            >
              <SmartImage src={src} alt="" className="aspect-[4/5] w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1 self-start">
        <div
          className="relative cursor-zoom-in overflow-hidden rounded-card bg-cream"
          onMouseMove={onMove}
          onMouseLeave={() => setZoomOrigin(null)}
          onClick={() => setLightbox(true)}
        >
          <SmartImage
            src={current}
            alt={`${alt} — image ${index + 1} of ${list.length}`}
            className="aspect-[4/5] w-full object-cover transition-transform duration-200"
            style={zoomOrigin ? { transform: 'scale(1.8)', transformOrigin: zoomOrigin } : undefined}
          />
          <span aria-hidden className="pointer-events-none absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-white/95 shadow-card">
            <ZoomIn className="size-5" />
          </span>
        </div>
        <button onClick={() => setLightbox(true)} className="sr-only focus:not-sr-only">
          Open zoomed image
        </button>
        {list.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous image" className="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 md:hidden">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Next image" className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 md:hidden">
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      <Modal open={lightbox} onClose={() => setLightbox(false)} title={`${alt} — zoom`} hideTitle className="sm:max-w-5xl">
        <ZoomViewer src={current} alt={alt} />
        {list.length > 1 && (
          <div className="flex items-center justify-center gap-4 p-4">
            <button onClick={() => go(-1)} className="btn-secondary btn-sm" aria-label="Previous image">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm text-muted">
              {index + 1} / {list.length}
            </span>
            <button onClick={() => go(1)} className="btn-secondary btn-sm" aria-label="Next image">
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

/** Tap/click toggles 2.5× zoom; moving the pointer pans the zoomed image. */
function ZoomViewer({ src, alt }: { src: string; alt: string }) {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  return (
    <div
      className={cn('overflow-hidden bg-cream', zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in')}
      onClick={() => setZoomed((z) => !z)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
      }}
    >
      <SmartImage src={src} alt={alt} className="mx-auto max-h-[75vh] w-auto object-contain transition-transform duration-200" style={{ transform: zoomed ? 'scale(2.5)' : undefined, transformOrigin: origin }} />
    </div>
  )
}
