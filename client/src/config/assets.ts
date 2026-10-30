/**
 * Central map of every static image used by the storefront.
 *
 * All files live in client/public/assets and are served from /assets/...
 * The current values point at generated placeholders (public/assets/placeholders/).
 * To use real photography, drop the file into public/assets/<folder>/ and update the
 * path here — no component changes are needed. See README → "Adding products and images".
 *
 * Product images are NOT listed here; they are stored on each product in MongoDB.
 */
const ph = (path: string) => `/assets/placeholders/${path}`

export const assets = {
  /** Set to '/assets/logo.webp' once the DARA logo file has been added. null renders the text wordmark. */
  logo: '/assets/logo.webp' as string | null,
  /** Same logo with a light tagline, for the black header and dark footer. */
  logoOnDark: '/assets/logo-on-dark.webp' as string | null,
  /** Brand mark shown beside the DARA wordmark (same artwork as the favicon). */
  logoMark: '/assets/logo-mark.webp' as string | null,

  banners: {
    hero: '/assets/banners/hero.png',
    bridal: '/assets/banners/bridal.png',
    wedding: '/assets/banners/wedding.png',
    everyday: '/assets/banners/everyday.png',
    category: '/assets/banners/category.png',
    about: ph('banners/about.svg'),
    bestsellers: '/assets/banners/bestsellers.png',
    newarrial :'/assets/banners/newarrial.png'
  },

  occasions: {
    wedding: '/assets/occasions/wedding.png',
    festive: '/assets/occasions/festive.png',
    party: '/assets/occasions/party.png',
    daily: '/assets/occasions/daily.png',
    gifting: '/assets/occasions/gift.png',
   
  },
}

/** Banner image for a collection page, falling back to the collection's own bannerImage from the API. */
export const collectionBanner = (slug: string, fallback?: string) =>
  (assets.banners as Record<string, string>)[slug] ?? fallback ?? assets.banners.category
