import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ChevronDown, ChevronLeft, ChevronRight, Heart, LayoutDashboard, Menu, Search, ShoppingBag, User as UserIcon } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { Drawer, Modal } from '../ui/Overlay'
import { SmartImage } from '../ui/Images'
import { SearchBox } from './SearchBox'
import { MAIN_NAV, OCCASIONS, type NavItem } from '../../config/navigation'
import { useSite } from '../../context/SiteContext'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { cn } from '../../lib/utils'

export function AnnouncementBar() {
  const { config } = useSite()
  const messages = config.announcements
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (messages.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000)
    return () => clearInterval(t)
  }, [messages.length])

  if (!messages.length) return null
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + messages.length) % messages.length)
  return (
    <div className="bg-brand text-white">
      <div className="container-page flex h-9 items-center justify-between gap-2 text-xs tracking-wider">
        {messages.length > 1 ? (
          <button onClick={() => go(-1)} aria-label="Previous announcement" className="p-1">
            <ChevronLeft className="size-4" />
          </button>
        ) : (
          <span />
        )}
        <p className="truncate text-center font-medium" aria-live="polite">
          {messages[index % messages.length]}
        </p>
        {messages.length > 1 ? (
          <button onClick={() => go(1)} aria-label="Next announcement" className="p-1">
            <ChevronRight className="size-4" />
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}

function IconBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white" aria-hidden>
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function Header() {
  const location = useLocation()
  const { user } = useAuth()
  const cart = useCart()
  const wishlist = useWishlist()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname, location.search])

  const iconLink = 'relative flex flex-col items-center gap-0.5 p-1.5 text-ink transition-colors hover:text-brand-dark'

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="container-page flex h-16 items-center gap-3 lg:h-20 lg:gap-8">
        <button className="-ml-1.5 p-1.5 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="size-6" />
        </button>

        <Logo className="text-[15px] lg:text-lg" />

        <SearchBox className="mx-auto hidden max-w-xl flex-1 lg:block" />

        <nav aria-label="Account" className="ml-auto flex items-center gap-2 sm:gap-4 lg:ml-0">
          <button className={cn(iconLink, 'lg:hidden')} onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search className="size-5" />
          </button>
          {user?.role === 'admin' && (
            <Link to="/admin" className={cn(iconLink, 'hidden sm:flex')} aria-label="Admin dashboard">
              <LayoutDashboard className="size-5" />
              <span className="hidden text-[10px] tracking-wider uppercase lg:block">Admin</span>
            </Link>
          )}
          <Link to={user ? '/account' : '/login'} className={cn(iconLink, 'hidden sm:flex')} aria-label={user ? 'My account' : 'Log in'}>
            <UserIcon className="size-5" />
            <span className="hidden text-[10px] tracking-wider uppercase lg:block">{user ? 'Account' : 'Login'}</span>
          </Link>
          <Link to="/wishlist" className={iconLink} aria-label={`Wishlist, ${wishlist.ids.length} items`}>
            <span className="relative">
              <Heart className="size-5" />
              <IconBadge count={wishlist.ids.length} />
            </span>
            <span className="hidden text-[10px] tracking-wider uppercase lg:block">Wishlist</span>
          </Link>
          <Link to="/cart" className={iconLink} aria-label={`Shopping bag, ${cart.count} items`}>
            <span className="relative">
              <ShoppingBag className="size-5" />
              <IconBadge count={cart.count} />
            </span>
            <span className="hidden text-[10px] tracking-wider uppercase lg:block">Bag</span>
          </Link>
        </nav>
      </div>

      <DesktopNav />

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <MobileNav />
      </Drawer>
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Search" className="self-start sm:mt-16">
        <div className="p-5">
          <SearchBox autoFocus onNavigate={() => setSearchOpen(false)} />
        </div>
      </Modal>
    </header>
  )
}

/** Dropdown content for a nav item (category styles, occasions or collections). */
function useDropdown(item: NavItem) {
  const { categories, collections } = useSite()
  if (item.type === 'category') {
    const category = categories.find((c) => c.slug === item.categorySlug)
    if (!category) return null
    return {
      heading: `Shop ${category.navLabel}`,
      links: [{ label: `All ${category.navLabel}`, to: item.to }, ...category.styles.map((s) => ({ label: s, to: `${item.to}?style=${encodeURIComponent(s.toLowerCase())}` }))],
      image: category.image,
      imageLabel: category.name,
    }
  }
  if (item.type === 'occasions') {
    return { heading: 'Shop by Occasion', links: OCCASIONS.map((o) => ({ label: o.label, to: `/occasions/${o.slug}` })), image: OCCASIONS[0].image, imageLabel: 'Occasions' }
  }
  if (item.type === 'collections') {
    return {
      heading: 'Collections',
      links: [
        { label: 'New Arrivals', to: '/new-arrivals' },
        { label: 'Best Sellers', to: '/best-sellers' },
        ...collections.map((c) => ({ label: c.name, to: `/collections/${c.slug}` })),
        { label: 'Shop All', to: '/shop' },
      ],
      image: collections[0]?.image,
      imageLabel: collections[0]?.name ?? 'Collections',
    }
  }
  return null
}

/** `align` keeps the 480px dropdown on screen: left-edge items open rightwards, right-edge items open leftwards. */
function DesktopNavItem({ item, align }: { item: NavItem; align: 'left' | 'right' }) {
  const dropdown = useDropdown(item)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname, location.search])

  return (
    <li className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          cn('flex items-center gap-1 py-3 text-[12px] tracking-wide whitespace-nowrap uppercase transition-colors hover:text-brand-dark xl:text-[13px] xl:tracking-wider', isActive && 'text-brand-dark')
        }
      >
        {item.label}
        {dropdown && <ChevronDown className="size-3.5" aria-hidden />}
      </NavLink>
      {dropdown && (
        <>
          <button className="sr-only focus:not-sr-only" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            Toggle {item.label} menu
          </button>
          {open && (
            <div className={cn('absolute top-full z-50 w-[480px] animate-fade-in pt-1', align === 'left' ? '-left-4' : '-right-4')}>
              <div className="grid grid-cols-[1fr_160px] gap-6 rounded-card border border-line bg-white p-6 shadow-lift">
                <div>
                  <p className="mb-3 font-serif text-lg font-semibold">{dropdown.heading}</p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {dropdown.links.map((l) => (
                      <li key={l.to}>
                        <Link to={l.to} className="text-sm text-muted hover:text-brand-dark">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to={item.to} className="group block overflow-hidden rounded-lg">
                  <SmartImage src={dropdown.image} alt={dropdown.imageLabel} className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                  <span className="mt-2 block text-center text-xs tracking-wider uppercase">{dropdown.imageLabel}</span>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  )
}

function DesktopNav() {
  return (
    <nav aria-label="Main" className="hidden border-t border-line lg:block">
      <ul className="container-page flex items-center justify-center gap-4 xl:gap-8">
        {MAIN_NAV.map((item, i) => (
          <DesktopNavItem key={item.to} item={item} align={i < MAIN_NAV.length / 2 ? 'left' : 'right'} />
        ))}
      </ul>
    </nav>
  )
}

function MobileNavItem({ item }: { item: NavItem }) {
  const dropdown = useDropdown(item)
  const [open, setOpen] = useState(false)
  if (!dropdown) {
    return (
      <li>
        <Link to={item.to} className="block px-5 py-3.5 text-sm tracking-wider uppercase">
          {item.label}
        </Link>
      </li>
    )
  }
  return (
    <li>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between px-5 py-3.5 text-sm tracking-wider uppercase">
        {item.label}
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <ul className="bg-cream-light py-2">
          {dropdown.links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="block px-8 py-2.5 text-sm text-muted">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function MobileNav() {
  const { user } = useAuth()
  return (
    <div className="flex flex-col">
      <ul className="divide-y divide-line">
        <li>
          <Link to="/new-arrivals" className="block px-5 py-3.5 text-sm font-medium tracking-wider text-brand-dark uppercase">
            New Arrivals
          </Link>
        </li>
        {MAIN_NAV.map((item) => (
          <MobileNavItem key={item.to} item={item} />
        ))}
      </ul>
      <div className="mt-4 space-y-3 border-t border-line p-5">
        {user?.role === 'admin' && (
          <Link to="/admin" className="btn-dark w-full">
            <LayoutDashboard className="size-4" aria-hidden /> Admin Dashboard
          </Link>
        )}
        {user ? (
          <Link to="/account" className="btn-secondary w-full">
            <UserIcon className="size-4" aria-hidden /> My Account
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn-secondary w-full">
              <UserIcon className="size-4" aria-hidden /> Log In
            </Link>
            <Link to="/signup" className="btn-primary w-full">
              Create Account
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
