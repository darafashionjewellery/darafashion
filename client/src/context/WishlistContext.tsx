import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { wishlistApi } from '../services'
import { errorMessage } from '../services/api'
import { storage } from '../lib/utils'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const GUEST_KEY = 'dara_guest_wishlist'

interface WishlistState {
  ids: string[]
  has: (productId: string) => boolean
  toggle: (productId: string, name?: string) => Promise<void>
  remove: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistState | null>(null)

/** Guests keep wishlist ids in localStorage; they are merged into the account on login. */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const toast = useToast()
  const [ids, setIds] = useState<string[]>(() => storage.get<string[]>(GUEST_KEY, []))
  const lastUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (authLoading) return
    const userId = user?.id ?? null
    if (lastUserId.current === userId) return
    lastUserId.current = userId
    if (!user) {
      setIds(storage.get<string[]>(GUEST_KEY, []))
      return
    }
    const guest = storage.get<string[]>(GUEST_KEY, [])
    ;(guest.length ? wishlistApi.merge(guest) : wishlistApi.get())
      .then((res) => {
        setIds(res.productIds)
        storage.remove(GUEST_KEY)
      })
      .catch(() => setIds([]))
  }, [user, authLoading])

  const remove = useCallback(
    async (productId: string) => {
      if (user) {
        const res = await wishlistApi.remove(productId)
        setIds(res.productIds)
      } else {
        const next = storage.get<string[]>(GUEST_KEY, []).filter((id) => id !== productId)
        storage.set(GUEST_KEY, next)
        setIds(next)
      }
    },
    [user],
  )

  const toggle = useCallback(
    async (productId: string, name?: string) => {
      try {
        if (ids.includes(productId)) {
          await remove(productId)
          toast.show(`${name ?? 'Item'} removed from your wishlist`)
          return
        }
        if (user) {
          const res = await wishlistApi.add(productId)
          setIds(res.productIds)
        } else {
          const next = [productId, ...storage.get<string[]>(GUEST_KEY, []).filter((id) => id !== productId)]
          storage.set(GUEST_KEY, next)
          setIds(next)
        }
        toast.success(`${name ?? 'Item'} added to your wishlist`, { label: 'View wishlist', to: '/wishlist' })
      } catch (err) {
        toast.error(errorMessage(err))
      }
    },
    [ids, user, remove, toast],
  )

  const value = useMemo<WishlistState>(() => ({ ids, has: (id) => ids.includes(id), toggle, remove }), [ids, toggle, remove])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}
