import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('size-5 animate-spin', className)} aria-hidden />
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted" role="status">
      <Spinner className="size-8 text-brand" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-card bg-cream-light px-6 py-12 text-center', className)} role="alert">
      <CircleAlert className="size-8 text-danger" aria-hidden />
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary btn-sm">
          Try again
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  message?: string
  action?: { label: string; to: string }
  children?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, message, action, children, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-card bg-cream-light px-6 py-16 text-center', className)}>
      {icon && <div className="text-brand">{icon}</div>}
      <h2 className="text-2xl">{title}</h2>
      {message && <p className="max-w-md text-sm text-muted">{message}</p>}
      {action && (
        <Link to={action.to} className="btn-primary mt-2">
          {action.label}
        </Link>
      )}
      {children}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-cream', className)} aria-hidden />
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/5] w-full rounded-card" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}
