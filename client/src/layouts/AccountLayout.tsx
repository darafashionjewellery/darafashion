import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Heart, LayoutDashboard, LogOut, MapPin, Package, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/ui/States'
import { cn } from '../lib/utils'

/** Redirects to login (remembering the destination) when there is no session. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <>{children}</>
}

const LINKS = [
  { to: '/account/profile', label: 'My Profile', icon: UserIcon },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
]

export function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <RequireAuth>
      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside>
            <div className="rounded-card bg-cream-light p-5">
              <p className="font-serif text-2xl font-semibold">Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <nav aria-label="Account" className="scrollbar-none mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
              {LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn('flex shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 text-sm whitespace-nowrap transition-colors', isActive ? 'bg-brand-soft text-ink' : 'text-muted hover:bg-cream-light hover:text-ink')
                  }
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className="flex shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 text-sm whitespace-nowrap text-brand-dark hover:bg-cream-light">
                  <LayoutDashboard className="size-4" aria-hidden /> Admin Dashboard
                </NavLink>
              )}
              <button
                onClick={async () => {
                  await logout()
                  navigate('/')
                }}
                className="flex shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 text-sm whitespace-nowrap text-muted hover:bg-cream-light hover:text-danger"
              >
                <LogOut className="size-4" aria-hidden /> Log out
              </button>
            </nav>
          </aside>
          <section>
            <Outlet />
          </section>
        </div>
      </div>
    </RequireAuth>
  )
}
