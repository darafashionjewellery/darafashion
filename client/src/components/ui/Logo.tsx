import { useState } from 'react'
import { Link } from 'react-router'
import { assets } from '../../config/assets'
import { cn } from '../../lib/utils'

interface LogoProps {
  className?: string
  /** Show the "Fashion Jewellery & Accessories" line under the wordmark. */
  tagline?: boolean
  tone?: 'dark' | 'light'
  asLink?: boolean
}

/**
 * Renders the DARA logo image from config/assets.ts when provided (aspect ratio preserved),
 * otherwise a typographic wordmark in the brand colours.
 */
export function Logo({ className, tagline = true, tone = 'dark', asLink = true }: LogoProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const content =
    assets.logo && !imgFailed ? (
      <img src={assets.logo} alt="DARA — Fashion Jewellery & Accessories" className="h-full w-auto object-contain" onError={() => setImgFailed(true)} />
    ) : (
      <span className="flex flex-col items-center leading-none">
        <span className={cn('font-serif text-[1.9em] font-medium tracking-[0.35em] pl-[0.35em]', tone === 'dark' ? 'text-ink' : 'text-white')}>DARA</span>
        {tagline && (
          <span className={cn('mt-1 text-[0.5em] font-medium tracking-[0.22em] uppercase', tone === 'dark' ? 'text-brand-dark' : 'text-beige')}>
            Fashion Jewellery &amp; Accessories
          </span>
        )}
      </span>
    )

  const classes = cn('inline-flex items-center', className)
  return asLink ? (
    <Link to="/" className={classes} aria-label="DARA Fashions home">
      {content}
    </Link>
  ) : (
    <span className={classes}>{content}</span>
  )
}
