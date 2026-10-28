import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useEscape, useLockBodyScroll } from '../../hooks/misc'
import { cn } from '../../lib/utils'

interface OverlayProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Visually hide the title (it is still announced to screen readers). */
  hideTitle?: boolean
  className?: string
}

function useFocusOnOpen(open: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => previous?.focus?.()
  }, [open])
  return ref
}

export function Modal({ open, onClose, title, children, hideTitle, className }: OverlayProps) {
  useLockBodyScroll(open)
  useEscape(onClose, open)
  const ref = useFocusOnOpen(open)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('relative max-h-[92vh] w-full animate-fade-in overflow-y-auto rounded-t-2xl bg-white shadow-lift outline-none sm:max-w-3xl sm:rounded-2xl', className)}
      >
        <div className={cn('flex items-center justify-between border-b border-line px-5 py-4', hideTitle && 'sr-only')}>
          <h2 className="text-xl">{title}</h2>
        </div>
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 text-ink hover:text-brand-dark">
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Drawer({ open, onClose, title, children, side = 'left', className }: OverlayProps & { side?: 'left' | 'right' }) {
  useLockBodyScroll(open)
  useEscape(onClose, open)
  const ref = useFocusOnOpen(open)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-lift outline-none',
          side === 'left' ? 'left-0 animate-slide-in-left' : 'right-0 animate-slide-in-right',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-ink hover:text-brand-dark">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
