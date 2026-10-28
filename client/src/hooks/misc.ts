import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Prevents background scrolling while a modal or drawer is open. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}

export function useEscape(onEscape: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onEscape()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEscape, active])
}

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | DARA Fashions` : 'DARA Fashions — Fashion Jewellery & Accessories'
  }, [title])
}
