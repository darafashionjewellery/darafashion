import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { Mail, MapPin, MessageCircle, X } from 'lucide-react'

/** Brand glyphs (lucide-react no longer ships brand logos). */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 sm:size-6" aria-hidden>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 9.43 9.45c0 5.2-4.24 9.43-9.45 9.43m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.65l6.04-1.58a11.3 11.3 0 0 0 5.43 1.38h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.33-8.04" />
  </svg>
)
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 sm:size-6" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
)
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 sm:size-6" aria-hidden>
    <path d="M13.5 21.9v-7.5h2.5l.4-2.9h-2.9V9.6c0-.84.24-1.4 1.44-1.4h1.54V5.6c-.27-.04-1.18-.12-2.24-.12-2.22 0-3.74 1.35-3.74 3.84v2.17H8v2.9h2.5v7.5h3z" />
  </svg>
)

interface ContactLink {
  label: string
  href: string
  icon: ReactNode
  className: string
  external: boolean
}

const CONTACT_LINKS: ContactLink[] = [
  { label: 'WhatsApp', href: 'https://wa.me/918903477444', icon: <WhatsAppIcon />, className: 'bg-[#25d366]', external: true },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/dara.fashions',
    icon: <InstagramIcon />,
    className: 'bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]',
    external: true,
  },
  { label: 'Facebook', href: 'https://www.facebook.com/people/darafashions/61581829686523/', icon: <FacebookIcon />, className: 'bg-[#1877f2]', external: true },
  { label: 'Find our store', href: 'https://maps.app.goo.gl/3CcBfo24JAaUmWSD9', icon: <MapPin className="size-5 sm:size-6" aria-hidden />, className: 'bg-[#4285f4]', external: true },
  { label: 'Email us', href: 'mailto:dara.fashionjewellery@gmail.com', icon: <Mail className="size-5 sm:size-6" aria-hidden />, className: 'bg-[#ea4335]', external: false },
]

/** Pages where a floating button would sit over essential controls. */
const HIDDEN_ON = ['/checkout']

/** Floating bottom-right button that expands into WhatsApp, social, map and email links. */
export function FloatingContact() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (HIDDEN_ON.some((path) => pathname.startsWith(path))) return null

  return (
    <div ref={rootRef} className="fixed right-4 bottom-4 z-[90] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <ul id="floating-contact-menu" className={`flex flex-col items-end gap-2.5 sm:gap-3 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        {CONTACT_LINKS.map((link, i) => (
          <li
            key={link.label}
            className={`transition-all duration-300 ease-out ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ transitionDelay: open ? `${(CONTACT_LINKS.length - 1 - i) * 40}ms` : '0ms' }}
          >
            <a
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              tabIndex={open ? 0 : -1}
              aria-label={link.label}
              className="group flex items-center gap-3 focus:outline-none"
            >
              <span className="rounded-md bg-ink/90 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100">
                {link.label}
              </span>
              <span
                className={`flex size-11 items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-brand-dark group-focus-visible:ring-offset-2 sm:size-12 ${link.className}`}
              >
                {link.icon}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="floating-contact-menu"
        aria-label={open ? 'Close contact options' : 'Contact DARA'}
        className="flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-brand transition-all duration-300 hover:scale-105 hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 focus-visible:outline-none sm:size-14"
      >
        <span className={`transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`}>
          {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
        </span>
      </button>
    </div>
  )
}
