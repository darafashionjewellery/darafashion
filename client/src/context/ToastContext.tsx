import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  message: string
  action?: { label: string; to: string }
}

interface ToastApi {
  show: (message: string, opts?: { kind?: ToastKind; action?: Toast['action'] }) => void
  success: (message: string, action?: Toast['action']) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const show = useCallback<ToastApi['show']>(
    (message, opts = {}) => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-2), { id, message, kind: opts.kind ?? 'info', action: opts.action }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const value = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, action) => show(message, { kind: 'success', action }),
      error: (message) => show(message, { kind: 'error' }),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-card border bg-white p-4 shadow-lift',
              t.kind === 'error' ? 'border-danger/40' : 'border-line',
            )}
          >
            {t.kind === 'error' ? (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            ) : (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sage-dark" aria-hidden />
            )}
            <div className="flex-1 text-sm">
              <p>{t.message}</p>
              {t.action && (
                <Link to={t.action.to} onClick={() => dismiss(t.id)} className="mt-1 inline-block font-medium link">
                  {t.action.label}
                </Link>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-stone hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
