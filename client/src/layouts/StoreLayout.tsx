import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AnnouncementBar, Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-[100] bg-white p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
