import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Briefcase, Clock, Gem, Heart, Mail, MapPin, Phone, Quote, Sparkles } from 'lucide-react'
import { catalogApi, siteApi } from '../services'
import { errorMessage } from '../services/api'
import { useSite } from '../context/SiteContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/misc'
import { POLICIES, FAQS } from '../content/policies'
import { assets } from '../config/assets'
import { Accordion, Field, PageHeader, Rating } from '../components/ui/Elements'
import { SmartImage } from '../components/ui/Images'
import { SocialLinks } from '../components/ui/SocialIcons'
import { EmptyState, ErrorState, PageLoader, Spinner } from '../components/ui/States'
import { EMAIL_RE, formatDate } from '../lib/utils'
import NotFoundPage from './NotFoundPage'

export function AboutPage() {
  useDocumentTitle('About DARA')
  return (
    <>
      <section className="relative overflow-hidden bg-cream">
        <SmartImage src={assets.banners.about} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/85 to-transparent" aria-hidden />
        <div className="container-page relative py-20">
          <p className="eyebrow">Our Story</p>
          <h1 className="mt-3 max-w-xl text-5xl">Fashion Jewellery for Every Moment</h1>
        </div>
      </section>
      <div className="container-page grid gap-12 py-16 lg:grid-cols-2">
        <div className="prose-dara">
          <p>
            DARA Fashions was created with a simple belief: every occasion deserves a little sparkle. From everyday essentials to celebration-ready statement pieces, we bring together fashion
            jewellery and accessories that help you express your style.
          </p>
          <p>Our collections span necklaces, earrings, bangles, rings, pendants, 92.5 silver and accessories — chosen to suit weddings, festivals, parties, daily wear and thoughtful gifting.</p>
          <p>We focus on thoughtful design, attention to finish and a shopping experience that is simple and secure from browsing to delivery.</p>
          <Link to="/shop" className="btn-primary mt-4">
            Explore the Collection
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { icon: Sparkles, title: 'Thoughtful Design', text: 'Pieces selected to complement both traditional and contemporary looks.' },
            { icon: Gem, title: 'Attention to Detail', text: 'We care about finish and quality in every piece we offer.' },
            { icon: Heart, title: 'Made for Moments', text: 'Jewellery for the celebrations — big and small — that matter to you.' },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-card bg-cream-light p-5">
              <Icon className="size-6 shrink-0 text-brand-dark" aria-hidden />
              <div>
                <h2 className="text-xl">{title}</h2>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export function ContactPage() {
  useDocumentTitle('Contact Us')
  const { config } = useSite()
  const { contact, social } = config
  const [values, setValues] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values | 'form', string>>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (values.name.trim().length < 2) errs.name = 'Enter your name'
    if (!EMAIL_RE.test(values.email.trim())) errs.email = 'Enter a valid email address'
    if (values.message.trim().length < 10) errs.message = 'Please write at least 10 characters'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSending(true)
    try {
      const res = await siteApi.contact(values)
      setSent(res.message)
      setValues({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  const details = [
    contact.phone && { icon: Phone, label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` },
    contact.whatsapp && { icon: Phone, label: 'WhatsApp', value: contact.whatsapp, href: `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}` },
    contact.email && { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    contact.address && { icon: MapPin, label: 'Address', value: contact.address },
    contact.hours && { icon: Clock, label: 'Hours', value: contact.hours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[]

  return (
    <>
      <PageHeader title="Contact Us" subtitle="We’d love to hear from you. Send us a message and our team will get back to you." />
      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" name="name" required autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} />
          <Field label="Email" name="email" type="email" required autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} />
          <Field label="Phone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} />
          <Field label="Subject" name="subject" value={values.subject} onChange={set('subject')} />
          <div className="sm:col-span-2">
            <label htmlFor="message" className="label">
              Message<span className="text-brand-dark"> *</span>
            </label>
            <textarea id="message" className={`input min-h-36 ${errors.message ? 'input-error' : ''}`} value={values.message} onChange={set('message')} maxLength={3000} aria-invalid={!!errors.message} />
            {errors.message && <p className="mt-1 text-xs text-danger">{errors.message}</p>}
          </div>
          {(errors.form || sent) && (
            <p className={`sm:col-span-2 text-sm ${errors.form ? 'text-danger' : 'text-sage-dark'}`} role="status">
              {errors.form ?? sent}
            </p>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={sending} className="btn-primary">
              {sending && <Spinner className="size-4" />} Send Message
            </button>
          </div>
        </form>

        <aside className="h-fit rounded-card bg-cream-light p-6">
          <h2 className="text-2xl">Get in Touch</h2>
          {details.length ? (
            <ul className="mt-4 space-y-4 text-sm">
              {details.map((d) => (
                <li key={d.label} className="flex gap-3">
                  <d.icon className="mt-0.5 size-4 shrink-0 text-brand-dark" aria-hidden />
                  <div>
                    <p className="text-xs tracking-wider text-muted uppercase">{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="hover:text-brand-dark">
                        {d.value}
                      </a>
                    ) : (
                      <p>{d.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Use the form and our team will reply by email.</p>
          )}
          <SocialLinks social={social} className="mt-6 flex gap-3" />
          <p className="mt-6 text-sm">
            Looking for quick answers? Visit our <Link to="/faq" className="link">FAQs</Link>.
          </p>
        </aside>
      </div>
    </>
  )
}

export function FaqPage() {
  useDocumentTitle('FAQs')
  return (
    <>
      <PageHeader title="Frequently Asked Questions" />
      <div className="container-page max-w-3xl py-12">
        {FAQS.map((f, i) => (
          <Accordion key={f.q} title={f.q} defaultOpen={i === 0}>
            <p className="leading-relaxed">{f.a}</p>
          </Accordion>
        ))}
        <p className="mt-8 text-sm text-muted">
          Still have questions? <Link to="/contact" className="link">Contact us</Link>.
        </p>
      </div>
    </>
  )
}

export function PolicyPage({ policy }: { policy: keyof typeof POLICIES }) {
  const p = POLICIES[policy]
  useDocumentTitle(p.title)
  return (
    <>
      <PageHeader title={p.title} />
      <article className="prose-dara container-page max-w-3xl py-12">
        <p className="text-lg">{p.intro}</p>
        {p.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs?.map((t) => <p key={t}>{t}</p>)}
            {s.bullets && (
              <ul>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="mt-10 text-sm">
          Questions about this policy? <Link to="/contact" className="link">Contact us</Link>.
        </p>
      </article>
    </>
  )
}

export function HappyCustomersPage() {
  useDocumentTitle('Happy Customers')
  const { data, loading, error, reload } = useAsync(() => catalogApi.featuredReviews(48), [])
  return (
    <>
      <PageHeader title="Happy Customers" subtitle="Real words from the DARA community." />
      <div className="container-page py-12">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data?.length ? (
          <EmptyState icon={<Heart className="size-10" />} title="Reviews coming soon" message="Customer reviews will appear here once they are shared and approved." action={{ label: 'Shop Now', to: '/shop' }} />
        ) : (
          <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {data.map((r) => (
              <li key={r.id} className="mb-5 break-inside-avoid rounded-card bg-white p-6 shadow-card">
                <Quote className="size-6 text-brand" aria-hidden />
                <Rating value={r.rating} />
                {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
                <p className="mt-4 text-sm font-medium">{r.displayName}</p>
                <p className="text-xs text-muted">{formatDate(r.createdAt)}</p>
                {r.product && (
                  <Link to={`/product/${r.product.slug}`} className="mt-3 flex items-center gap-3 rounded-lg bg-cream-light p-2 text-xs hover:text-brand-dark">
                    <SmartImage src={r.product.image} alt="" className="size-10 rounded object-cover" />
                    {r.product.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export function CareersPage() {
  useDocumentTitle('Careers')
  const { data, loading, error, reload } = useAsync(() => siteApi.jobs(), [])
  return (
    <>
      <PageHeader title="Careers at DARA" subtitle="Join a team that loves helping people celebrate every occasion." />
      <div className="container-page max-w-4xl py-12">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data?.length ? (
          <EmptyState icon={<Briefcase className="size-10" />} title="No open positions right now" message="We don’t have any openings at the moment. Please check back later." />
        ) : (
          <ul className="space-y-4">
            {data.map((j) => (
              <li key={j.id}>
                <Link to={`/careers/${j.slug}`} className="card flex flex-col gap-2 p-5 transition-shadow hover:shadow-card sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl">{j.title}</h2>
                    <p className="text-sm text-muted">{[j.department, j.location, j.type].filter(Boolean).join(' · ')}</p>
                    {j.summary && <p className="mt-2 text-sm text-muted">{j.summary}</p>}
                  </div>
                  <span className="btn-secondary btn-sm shrink-0">View & Apply</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export function JobDetailPage() {
  const { slug = '' } = useParams()
  const { data: job, loading, error, status, reload } = useAsync(() => siteApi.job(slug), [slug])
  useDocumentTitle(job?.title ?? 'Careers')
  const [values, setValues] = useState({ name: '', email: '', phone: '', resumeUrl: '', coverLetter: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values | 'form', string>>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }))

  if (loading) return <PageLoader />
  if (status === 404) return <NotFoundPage />
  if (error || !job) return <ErrorState message={error ?? 'Job not found'} onRetry={reload} className="container-page my-10" />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (values.name.trim().length < 2) errs.name = 'Enter your name'
    if (!EMAIL_RE.test(values.email.trim())) errs.email = 'Enter a valid email address'
    if (values.phone.trim().length < 7) errs.phone = 'Enter a valid phone number'
    if (values.resumeUrl && !/^https?:\/\//.test(values.resumeUrl)) errs.resumeUrl = 'Enter a full link starting with https://'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSending(true)
    try {
      const res = await siteApi.apply(slug, values)
      setSent(res.message)
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container-page grid max-w-5xl gap-10 py-12 lg:grid-cols-[1fr_380px]">
      <article className="prose-dara">
        <Link to="/careers" className="text-sm link">
          ← All openings
        </Link>
        <h1 className="mt-3 text-4xl">{job.title}</h1>
        <p className="text-sm">{[job.department, job.location, job.type].filter(Boolean).join(' · ')}</p>
        {job.description && <p className="whitespace-pre-line">{job.description}</p>}
        {!!job.responsibilities?.length && (
          <>
            <h2>Responsibilities</h2>
            <ul>{job.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
          </>
        )}
        {!!job.requirements?.length && (
          <>
            <h2>Requirements</h2>
            <ul>{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
          </>
        )}
      </article>
      <aside className="h-fit rounded-card bg-cream-light p-6">
        <h2 className="text-2xl">Apply for this role</h2>
        {sent ? (
          <p className="mt-4 text-sm text-sage-dark" role="status">
            {sent}
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            <Field label="Full name" name="name" required value={values.name} onChange={set('name')} error={errors.name} />
            <Field label="Email" name="email" type="email" required value={values.email} onChange={set('email')} error={errors.email} />
            <Field label="Phone" name="phone" type="tel" required value={values.phone} onChange={set('phone')} error={errors.phone} />
            <Field label="Resume link" name="resumeUrl" type="url" placeholder="https://" value={values.resumeUrl} onChange={set('resumeUrl')} error={errors.resumeUrl} hint="Google Drive, Dropbox or LinkedIn link" />
            <div>
              <label htmlFor="cover" className="label">
                Cover letter
              </label>
              <textarea id="cover" className="input min-h-28" value={values.coverLetter} onChange={set('coverLetter')} maxLength={3000} />
            </div>
            {errors.form && (
              <p className="text-sm text-danger" role="alert">
                {errors.form}
              </p>
            )}
            <button type="submit" disabled={sending} className="btn-primary w-full">
              {sending && <Spinner className="size-4" />} Submit Application
            </button>
          </form>
        )}
      </aside>
    </div>
  )
}
