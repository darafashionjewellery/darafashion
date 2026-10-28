import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Briefcase, Inbox, LayoutDashboard, LogOut, Menu, Package, ShieldAlert, ShoppingCart, Star, Store, Tags, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/ui/Logo'
import { PageLoader } from '../components/ui/States'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/catalog', label: 'Categories & Collections', icon: Tags },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/inbox', label: 'Messages & Newsletter', icon: Inbox },
  { to: '/admin/careers', label: 'Careers', icon: Briefcase },
]

/**
 * Admin shell. Access is limited to users with role "admin" (granted via ADMIN_EMAILS on the server);
 * the API enforces the same rule, so this check is only for the UI.
 */
export function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (loading) return <PageLoader />
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream-light p-6 text-center">
        <ShieldAlert className="size-10 text-brand-dark" aria-hidden />
        <h1 className="text-3xl">Admins only</h1>
        <p className="max-w-sm text-sm text-muted">
          {user.email} does not have admin access. Add it to <code>ADMIN_EMAILS</code> in the server settings, restart the API and log in again.
        </p>
        <Link to="/" className="btn-primary mt-2">
          Back to store
        </Link>
      </div>
    )
  }

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1 p-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', isActive ? 'bg-brand-soft font-medium text-ink' : 'text-muted hover:bg-cream-light hover:text-ink')}
        >
          <Icon className="size-4" aria-hidden /> {label}
        </NavLink>
      ))}
      <div className="my-2 border-t border-line" />
      <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-cream-light hover:text-ink">
        <Store className="size-4" aria-hidden /> View store
      </Link>
      <button
        onClick={async () => {
          await logout()
          navigate('/')
        }}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted hover:bg-cream-light hover:text-danger"
      >
        <LogOut className="size-4" aria-hidden /> Log out
      </button>
    </nav>
  )

  return (
    <div className="min-h-screen bg-cream-light lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-white lg:flex">
        <div className="border-b border-line px-5 py-5">
          <Logo className="text-sm" />
          <p className="mt-2 text-center text-[10px] tracking-[0.25em] text-muted uppercase">Admin</p>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <p className="truncate border-t border-line px-5 py-3 text-xs text-muted">{user.email}</p>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="p-1">
          <Menu className="size-6" />
        </button>
        <span className="font-serif text-lg font-semibold">DARA Admin</span>
        <Link to="/" aria-label="View store" className="p-1">
          <Store className="size-5" />
        </Link>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-in-left overflow-y-auto bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-serif text-lg font-semibold">DARA Admin</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
