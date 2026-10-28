import { Link } from 'react-router'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { SocialLinks } from '../ui/SocialIcons'
import { useSite } from '../../context/SiteContext'
import { FOOTER_HELP_LINKS } from '../../config/navigation'

export function Footer() {
  const { config, categories } = useSite()
  const { contact, social } = config
  const hasContact = contact.email || contact.phone || contact.address || contact.hours

  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="text-base" tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            DARA brings you fashion jewellery and accessories for every occasion — from everyday elegance to celebration-ready statement pieces.
          </p>
          <SocialLinks social={social} className="mt-5 flex gap-3 text-white" />
        </div>

        <div>
          <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase">Shop</h2>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/new-arrivals" className="hover:text-white">New Arrivals</Link></li>
            <li><Link to="/best-sellers" className="hover:text-white">Best Sellers</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} className="hover:text-white">{c.navLabel}</Link>
              </li>
            ))}
            <li><Link to="/shop" className="hover:text-white">Shop All</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase">Help &amp; Information</h2>
          <ul className="space-y-2.5 text-sm text-white/70">
            {FOOTER_HELP_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.2em] uppercase">Get in Touch</h2>
          {hasContact ? (
            <ul className="space-y-3 text-sm text-white/70">
              {contact.phone && (
                <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden /><a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-white">{contact.phone}</a></li>
              )}
              {contact.email && (
                <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden /><a href={`mailto:${contact.email}`} className="break-all hover:text-white">{contact.email}</a></li>
              )}
              {contact.address && (
                <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden /><span>{contact.address}</span></li>
              )}
              {contact.hours && (
                <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden /><span>{contact.hours}</span></li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-white/70">
              Questions? <Link to="/contact" className="text-white underline underline-offset-4">Send us a message</Link>.
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} DARA Fashions. All rights reserved.</p>
          <p>Secure checkout · Prices in INR</p>
        </div>
      </div>
    </footer>
  )
}
