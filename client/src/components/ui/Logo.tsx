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
  const logoSrc = tone === 'light' ? (assets.logoOnDark ?? assets.logo) : assets.logo
  const content =
    logoSrc && !imgFailed ? (
      <img src={logoSrc} alt="DARA — Fashion Jewellery & Accessories" className="h-[3em] w-auto max-w-none object-contain" onError={() => setImgFailed(true)} />
    ) : (
      <span className="flex items-center gap-[0.6em]">
        {assets.logoMark && <img src={assets.logoMark} alt="" aria-hidden className="h-[2.9em] w-auto shrink-0" />}
        <span className="flex flex-col items-center leading-none">
          <span
            className={cn(
              'font-serif text-[1.9em] font-semibold tracking-[0.35em] pl-[0.35em]',
              tone === 'dark' ? 'bg-gradient-to-r from-[#e2603a] to-[#ee8a5e] bg-clip-text text-transparent' : 'text-white',
            )}
          >
            DARA
          </span>
          {tagline && (
            <span className={cn('mt-1 text-[0.5em] font-medium tracking-[0.22em] uppercase', tone === 'dark' ? 'text-[#e8825a]' : 'text-beige')}>
              Fashion Jewellery &amp; Accessories
            </span>
          )}
        </span>
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
