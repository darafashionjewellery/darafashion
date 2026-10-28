import { useState, type ImgHTMLAttributes } from 'react'
import { Gem } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * <img> for local asset paths with lazy loading and a branded fallback
 * when the file is missing (e.g. an image path set before the file was added).
 */
/**
 * Resolves an image path for display. Uploaded images (/uploads/...) live on the API server,
 * so they are prefixed with VITE_API_URL when the API runs on a different domain.
 */
export const imageUrl = (src?: string) => (src?.startsWith('/uploads/') ? `${import.meta.env.VITE_API_URL ?? ''}${src}` : src)

export function SmartImage({ src: rawSrc, alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false)
  const src = imageUrl(rawSrc)
  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-cream text-beige', className)} role="img" aria-label={alt}>
        <Gem className="size-1/4 max-h-16 max-w-16" aria-hidden />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} {...props} />
}
