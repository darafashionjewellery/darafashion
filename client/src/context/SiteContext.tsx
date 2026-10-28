import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { catalogApi, siteApi } from '../services'
import type { Category, Collection, SiteConfig } from '../types'

/** Used until /api/site/config responds (or if the API is unreachable). */
const FALLBACK_CONFIG: SiteConfig = {
  announcements: ['Discover the Latest Jewellery Trends', 'New Arrivals — Explore the Collection', 'Celebrate Every Occasion with DARA'],
  contact: { email: '', phone: '', whatsapp: '', address: '', hours: '' },
  social: { instagram: '', facebook: '', youtube: '', pinterest: '' },
  shipping: { freeShippingThreshold: 0, methods: [] },
  payments: { razorpay: false, razorpayKeyId: null, cod: false },
}

interface SiteState {
  config: SiteConfig
  configLoaded: boolean
  categories: Category[]
  collections: Collection[]
  catalogLoaded: boolean
}

const SiteContext = createContext<SiteState | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteState>({
    config: FALLBACK_CONFIG,
    configLoaded: false,
    categories: [],
    collections: [],
    catalogLoaded: false,
  })

  useEffect(() => {
    siteApi
      .config()
      .then((config) => setState((s) => ({ ...s, config, configLoaded: true })))
      .catch(() => setState((s) => ({ ...s, configLoaded: true })))
    Promise.all([catalogApi.categories(), catalogApi.collections()])
      .then(([categories, collections]) => setState((s) => ({ ...s, categories, collections, catalogLoaded: true })))
      .catch(() => setState((s) => ({ ...s, catalogLoaded: true })))
  }, [])

  return <SiteContext.Provider value={state}>{children}</SiteContext.Provider>
}

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite must be used inside SiteProvider')
  return ctx
}
