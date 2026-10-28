import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cartApi } from '../services'
import { errorMessage } from '../services/api'
import { storage } from '../lib/utils'
import type { CartLine, CartResponse, CartTotals } from '../types'
import { useAuth } from './AuthContext'

const GUEST_KEY = 'dara_guest_cart'
type GuestLine = { productId: string; variantSku: string | null; quantity: number }

interface CartState {
  lines: CartLine[]
  totals: CartTotals | null
  count: number
  loading: boolean
  /** Throws with a readable message when the item cannot be added. */
  addItem: (productId: string, variantSku: string | null, quantity?: number) => Promise<void>
  updateQuantity: (line: CartLine, quantity: number) => Promise<void>
  removeItem: (line: CartLine) => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartState | null>(null)

const sameLine = (a: GuestLine, productId: string, variantSku: string | null) => a.productId === productId && (a.variantSku ?? null) === (variantSku ?? null)

/**
 * Logged-in customers: the bag lives on the server.
 * Guests: the bag lives in localStorage and is priced by POST /cart/quote, then merged on login.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const lastUserId = useRef<string | null | undefined>(undefined)

  const loadGuest = useCallback(async () => {
    const items = storage.get<GuestLine[]>(GUEST_KEY, [])
    if (!items.length) {
      setData(null)
      return
    }
    const res = await cartApi.quote(items)
    setData(res)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (user) setData(await cartApi.get())
      else await loadGuest()
    } catch {
      /* leave previous state; pages show their own errors */
    } finally {
      setLoading(false)
    }
  }, [user, loadGuest])

  // Load on start and whenever the signed-in user changes; merge the guest bag on login.
  useEffect(() => {
    if (authLoading) return
    const userId = user?.id ?? null
    if (lastUserId.current === userId) return
    lastUserId.current = userId
    ;(async () => {
      setLoading(true)
      try {
        if (user) {
          const guest = storage.get<GuestLine[]>(GUEST_KEY, [])
          if (guest.length) {
            setData(await cartApi.merge(guest))
            storage.remove(GUEST_KEY)
          } else {
            setData(await cartApi.get())
          }
        } else {
          await loadGuest()
        }
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [user, authLoading, loadGuest])

  const addItem = useCallback<CartState['addItem']>(
    async (productId, variantSku, quantity = 1) => {
      try {
        if (user) {
          setData(await cartApi.add({ productId, variantSku, quantity }))
          return
        }
        const items = storage.get<GuestLine[]>(GUEST_KEY, [])
        const existing = items.find((i) => sameLine(i, productId, variantSku))
        const next = existing
          ? items.map((i) => (i === existing ? { ...i, quantity: Math.min(10, i.quantity + quantity) } : i))
          : [...items, { productId, variantSku, quantity }]
        const res = await cartApi.quote(next)
        const line = res.items.find((l) => l.productId === productId && l.variantSku === variantSku)
        if (line && (!line.available || line.issue)) throw new Error(line.issue || 'This item is unavailable')
        storage.set(GUEST_KEY, next)
        setData(res)
      } catch (err) {
        throw new Error(errorMessage(err))
      }
    },
    [user],
  )

  const updateQuantity = useCallback<CartState['updateQuantity']>(
    async (line, quantity) => {
      try {
        if (user && line.id) {
          setData(await cartApi.update(line.id, quantity))
          return
        }
        const items = storage.get<GuestLine[]>(GUEST_KEY, []).map((i) => (sameLine(i, line.productId, line.variantSku) ? { ...i, quantity } : i))
        storage.set(GUEST_KEY, items)
        setData(await cartApi.quote(items))
      } catch (err) {
        throw new Error(errorMessage(err))
      }
    },
    [user],
  )

  const removeItem = useCallback<CartState['removeItem']>(
    async (line) => {
      try {
        if (user && line.id) {
          setData(await cartApi.remove(line.id))
          return
        }
        const items = storage.get<GuestLine[]>(GUEST_KEY, []).filter((i) => !sameLine(i, line.productId, line.variantSku))
        storage.set(GUEST_KEY, items)
        setData(items.length ? await cartApi.quote(items) : null)
      } catch (err) {
        throw new Error(errorMessage(err))
      }
    },
    [user],
  )

  const value = useMemo<CartState>(
    () => ({
      lines: data?.items ?? [],
      totals: data?.totals ?? null,
      count: data?.totals.itemCount ?? 0,
      loading,
      addItem,
      updateQuantity,
      removeItem,
      refresh,
    }),
    [data, loading, addItem, updateQuantity, removeItem, refresh],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
