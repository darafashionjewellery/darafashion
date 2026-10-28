import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '../../services/admin'
import { errorMessage } from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce, useDocumentTitle } from '../../hooks/misc'
import { useToast } from '../../context/ToastContext'
import { AdminTitle, Pager, Panel, Pill, SearchInput, Select, Table, lines } from '../../components/admin/AdminUI'
import { Modal } from '../../components/ui/Overlay'
import { ImageInput } from '../../components/admin/ImageInput'
import { Rating } from '../../components/ui/Elements'
import { SmartImage } from '../../components/ui/Images'
import { ErrorState, PageLoader, Spinner } from '../../components/ui/States'
import type { AdminApplication, AdminCategory, AdminCollection, AdminJob, AdminMessage, ReviewStatus } from '../../types/admin'
import { cn, formatDate, formatPrice } from '../../lib/utils'

/* ---------------- Categories & collections ---------------- */

type CatalogKind = 'category' | 'collection'
type Editing = { kind: 'category'; item?: AdminCategory } | { kind: 'collection'; item?: AdminCollection } | null

export function AdminCatalogPage() {
  useDocumentTitle('Categories & Collections — Admin')
  const { data, loading, error, reload } = useAsync(() => Promise.all([adminApi.categories(), adminApi.collections()]), [])
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const toast = useToast()

  if (loading) return <PageLoader />
  if (error || !data) return <ErrorState message={error ?? 'Could not load'} onRetry={reload} />
  const [categories, collections] = data

  const remove = async (kind: CatalogKind, item: AdminCategory | AdminCollection) => {
    const warning =
      kind === 'category'
        ? 'Categories that still have products cannot be deleted — move or delete those products first.'
        : 'Products tagged with this collection are kept; only the tag is removed.'
    if (!window.confirm(`Delete the ${kind} "${item.name}" permanently?\n\n${warning}`)) return
    setDeleting(item._id)
    try {
      const res = kind === 'category' ? await adminApi.deleteCategory(item._id) : await adminApi.deleteCollection(item._id)
      toast.success(res.message)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  const actions = (kind: CatalogKind, item: AdminCategory | AdminCollection) => (
    <div className="flex items-center justify-end gap-1">
      <button onClick={() => setEditing(kind === 'category' ? { kind, item: item as AdminCategory } : { kind, item: item as AdminCollection })} className="btn-secondary btn-sm">
        <Pencil className="size-3.5" aria-hidden /> Edit
      </button>
      <button onClick={() => remove(kind, item)} disabled={deleting === item._id} aria-label={`Delete ${item.name}`} className="rounded-full p-2 text-muted hover:bg-brand-soft hover:text-danger">
        {deleting === item._id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <AdminTitle title="Categories & Collections" subtitle="Changes appear in the store navigation and listing pages." />

      <Panel
        title="Categories"
        actions={
          <button onClick={() => setEditing({ kind: 'category' })} className="btn-secondary btn-sm">
            <Plus className="size-4" aria-hidden /> Add category
          </button>
        }
      >
        <Table head={['', 'Name', 'Slug', 'Sub-categories', 'Order', 'Status', 'Actions']} empty={!categories.length}>
          {categories.map((c) => (
            <tr key={c._id} className="hover:bg-cream-light">
              <td className="px-4 py-2">
                <SmartImage src={c.image} alt="" className="size-10 rounded-full object-cover" />
              </td>
              <td className="px-4 py-2 font-medium">{c.navLabel || c.name}</td>
              <td className="px-4 py-2 text-muted">/category/{c.slug}</td>
              <td className="max-w-xs px-4 py-2 text-xs text-muted">{c.styles.join(', ')}</td>
              <td className="px-4 py-2">{c.sortOrder}</td>
              <td className="px-4 py-2">
                <Pill className={c.isActive ? 'bg-sage/15 text-sage-dark' : 'bg-stone/20 text-muted'}>{c.isActive ? 'Active' : 'Inactive'}</Pill>
              </td>
              <td className="px-4 py-2">{actions('category', c)}</td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel
        title="Collections"
        actions={
          <button onClick={() => setEditing({ kind: 'collection' })} className="btn-secondary btn-sm">
            <Plus className="size-4" aria-hidden /> Add collection
          </button>
        }
      >
        <Table head={['', 'Name', 'Slug', 'Tagline', 'Order', 'Status', 'Actions']} empty={!collections.length}>
          {collections.map((c) => (
            <tr key={c._id} className="hover:bg-cream-light">
              <td className="px-4 py-2">
                <SmartImage src={c.image} alt="" className="size-10 rounded object-cover" />
              </td>
              <td className="px-4 py-2 font-medium">{c.name}</td>
              <td className="px-4 py-2 text-muted">/collections/{c.slug}</td>
              <td className="px-4 py-2 text-xs text-muted">{c.tagline}</td>
              <td className="px-4 py-2">{c.sortOrder}</td>
              <td className="px-4 py-2">
                <Pill className={c.isActive ? 'bg-sage/15 text-sage-dark' : 'bg-stone/20 text-muted'}>{c.isActive ? 'Active' : 'Inactive'}</Pill>
              </td>
              <td className="px-4 py-2">{actions('collection', c)}</td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `${editing.item ? 'Edit' : 'New'} ${editing.kind}` : ''}>
        {editing && (
          <CatalogForm
            kind={editing.kind}
            item={editing.item}
            onSaved={() => {
              setEditing(null)
              reload()
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function CatalogForm({ kind, item, onSaved }: { kind: CatalogKind; item?: AdminCategory | AdminCollection; onSaved: () => void }) {
  const toast = useToast()
  const cat = kind === 'category' ? (item as AdminCategory | undefined) : undefined
  const col = kind === 'collection' ? (item as AdminCollection | undefined) : undefined
  const [v, setV] = useState({
    name: item?.name ?? '',
    slug: item?.slug ?? '',
    navLabel: cat?.navLabel ?? '',
    tagline: col?.tagline ?? '',
    description: item?.description ?? '',
    image: item?.image ?? '',
    bannerImage: item?.bannerImage ?? '',
    styles: cat?.styles.join(', ') ?? '',
    sortOrder: String(item?.sortOrder ?? 0),
    isActive: item?.isActive ?? true,
    flag: kind === 'category' ? (cat?.showInNav ?? true) : (col?.isFeatured ?? false),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const f = (key: keyof typeof v) => ({ value: v[key] as string, onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [key]: e.target.value })) })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (v.name.trim().length < 2) return setError('Enter a name.')
    setSaving(true)
    setError(null)
    const common = { name: v.name.trim(), slug: v.slug.trim() || undefined, description: v.description, image: v.image.trim(), bannerImage: v.bannerImage.trim(), sortOrder: Number(v.sortOrder) || 0, isActive: v.isActive }
    try {
      if (kind === 'category') await adminApi.saveCategory({ ...common, navLabel: v.navLabel.trim() || undefined, styles: v.styles.split(',').map((s) => s.trim()).filter(Boolean), showInNav: v.flag }, item?._id)
      else await adminApi.saveCollection({ ...common, tagline: v.tagline, isFeatured: v.flag }, item?._id)
      toast.success('Saved')
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="c-name">Name *</label>
        <input id="c-name" className="input" {...f('name')} />
      </div>
      <div>
        <label className="label" htmlFor="c-slug">Slug</label>
        <input id="c-slug" className="input" {...f('slug')} placeholder="Generated from the name" />
        {item && <p className="mt-1 text-xs text-muted">Changing the slug changes the page URL.</p>}
      </div>
      {kind === 'category' ? (
        <>
          <div>
            <label className="label" htmlFor="c-nav">Menu label</label>
            <input id="c-nav" className="input" {...f('navLabel')} placeholder="e.g. 92.5 Silver" />
          </div>
          <div>
            <label className="label" htmlFor="c-styles">Sub-categories — comma separated (shown in the menu)</label>
            <input id="c-styles" className="input" {...f('styles')} placeholder="Jhumkas, Chandbalis, Studs" />
          </div>
        </>
      ) : (
        <div className="sm:col-span-2">
          <label className="label" htmlFor="c-tag">Tagline</label>
          <input id="c-tag" className="input" {...f('tagline')} />
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="label" htmlFor="c-desc">Description</label>
        <textarea id="c-desc" className="input min-h-20" {...f('description')} />
      </div>
      <div className="sm:col-span-2">
        <ImageInput
          label="Image"
          value={v.image}
          onChange={(url) => setV((s) => ({ ...s, image: url }))}
          folder={kind === 'category' ? 'categories' : 'collections'}
          aspect={kind === 'category' ? 'square' : 'portrait'}
          hint={kind === 'category' ? 'Square, about 600 × 600 — shown in Shop by Category and the menu.' : 'Portrait 4:5, about 800 × 1000 — shown on the Collections page.'}
        />
      </div>
      <div className="sm:col-span-2">
        <ImageInput
          label="Banner image"
          value={v.bannerImage}
          onChange={(url) => setV((s) => ({ ...s, bannerImage: url }))}
          folder="banners"
          aspect="wide"
          hint="Wide, about 1600 × 700 — keep the subject on the right half (the title sits on the left)."
        />
      </div>
      <div>
        <label className="label" htmlFor="c-order">Display order</label>
        <input id="c-order" type="number" className="input" {...f('sortOrder')} />
      </div>
      <div className="flex flex-col justify-end gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 accent-brand-dark" checked={v.isActive} onChange={(e) => setV((s) => ({ ...s, isActive: e.target.checked }))} /> Active
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 accent-brand-dark" checked={v.flag} onChange={(e) => setV((s) => ({ ...s, flag: e.target.checked }))} />
          {kind === 'category' ? 'Show in menu' : 'Featured'}
        </label>
      </div>
      {error && <p className="text-sm text-danger sm:col-span-2" role="alert">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Spinner className="size-4" />} Save
        </button>
      </div>
    </form>
  )
}

/* ---------------- Customers ---------------- */

export function AdminCustomersPage() {
  useDocumentTitle('Customers — Admin')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounce(q, 300)
  const { data, loading, error, reload } = useAsync(() => adminApi.customers({ q: debounced || undefined, page, limit: 25 }), [debounced, page])

  return (
    <div>
      <AdminTitle title="Customers" subtitle={data ? `${data.total} account${data.total === 1 ? '' : 's'}` : undefined} />
      <Panel>
        <div className="border-b border-line p-4">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Search email, name or phone" />
        </div>
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} className="m-4" />
        ) : (
          <>
            <Table head={['Customer', 'Phone', 'Orders', 'Spent', 'Last order', 'Joined']} empty={!data?.items.length}>
              {data?.items.map((c) => (
                <tr key={c.id} className="hover:bg-cream-light">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {c.name || '—'} {c.role === 'admin' && <Pill className="ml-1 bg-brand-soft text-brand-dark">Admin</Pill>}
                    </p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {c.orders > 0 ? (
                      <Link to={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="link">
                        {c.orders}
                      </Link>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatPrice(c.spent)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </Table>
            <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} onChange={setPage} />
          </>
        )}
      </Panel>
    </div>
  )
}

/* ---------------- Reviews ---------------- */

export function AdminReviewsPage() {
  useDocumentTitle('Reviews — Admin')
  const toast = useToast()
  const [status, setStatus] = useState<ReviewStatus | ''>('pending')
  const { data, loading, error, reload } = useAsync(() => adminApi.reviews(status || undefined), [status])
  const [busy, setBusy] = useState<string | null>(null)

  const moderate = async (id: string, next: 'approved' | 'rejected') => {
    setBusy(id)
    try {
      await adminApi.moderateReview(id, next)
      toast.success(next === 'approved' ? 'Review approved and published' : 'Review rejected')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <AdminTitle title="Reviews" subtitle="Approved reviews appear on product pages and Happy Customers." />
      <div className="mb-4 flex gap-2" role="tablist">
        {(['pending', 'approved', 'rejected', ''] as const).map((s) => (
          <button key={s || 'all'} role="tab" aria-selected={status === s} onClick={() => setStatus(s)} className={cn('rounded-pill px-4 py-1.5 text-sm capitalize', status === s ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink')}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.length ? (
        <Panel>
          <p className="px-5 py-12 text-center text-sm text-muted">No {status} reviews.</p>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r._id} className="rounded-card border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Rating value={r.rating} />
                    <Pill className={r.status === 'approved' ? 'bg-sage/15 text-sage-dark' : r.status === 'rejected' ? 'bg-stone/20 text-muted' : 'bg-brand-soft text-brand-dark'}>{r.status}</Pill>
                  </div>
                  {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                  <p className="mt-1 text-sm text-muted">{r.body}</p>
                  <p className="mt-2 text-xs text-muted">
                    {r.displayName}
                    {r.verifiedPurchase && ' · Verified purchase'} · {formatDate(r.createdAt)} ·{' '}
                    {r.product ? (
                      <a href={`/product/${r.product.slug}`} target="_blank" rel="noreferrer" className="link">
                        {r.product.name}
                      </a>
                    ) : (
                      'Deleted product'
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.status !== 'approved' && (
                    <button onClick={() => moderate(r._id, 'approved')} disabled={busy === r._id} className="btn-primary btn-sm">
                      Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => moderate(r._id, 'rejected')} disabled={busy === r._id} className="btn-secondary btn-sm">
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------------- Inbox: messages & newsletter ---------------- */

export function AdminInboxPage() {
  useDocumentTitle('Messages — Admin')
  const toast = useToast()
  const [tab, setTab] = useState<'messages' | 'newsletter'>('messages')
  const messages = useAsync(() => adminApi.messages(), [])
  const subscribers = useAsync(() => adminApi.subscribers(), [])

  const setStatus = async (m: AdminMessage, status: AdminMessage['status']) => {
    try {
      await adminApi.updateMessage(m._id, status)
      messages.setData((messages.data ?? []).map((x) => (x._id === m._id ? { ...x, status } : x)))
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const exportCsv = () => {
    const rows = [['email', 'source', 'status', 'subscribed_at'], ...(subscribers.data ?? []).map((s) => [s.email, s.source, s.status, s.createdAt])]
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'dara-newsletter-subscribers.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <AdminTitle title="Messages & Newsletter" />
      <div className="mb-4 flex gap-2" role="tablist">
        {(['messages', 'newsletter'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('rounded-pill px-4 py-1.5 text-sm capitalize', tab === t ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink')}>
            {t === 'messages' ? `Contact messages${messages.data ? ` (${messages.data.filter((m) => m.status === 'new').length} new)` : ''}` : `Newsletter${subscribers.data ? ` (${subscribers.data.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'messages' ? (
        messages.loading ? (
          <PageLoader />
        ) : messages.error ? (
          <ErrorState message={messages.error} onRetry={messages.reload} />
        ) : !messages.data?.length ? (
          <Panel>
            <p className="px-5 py-12 text-center text-sm text-muted">No messages yet.</p>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {messages.data.map((m) => (
              <li key={m._id} className={cn('rounded-card border bg-white p-5', m.status === 'new' ? 'border-brand' : 'border-line')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.subject || 'No subject'}</p>
                    <p className="text-xs text-muted">
                      {m.name} · <a href={`mailto:${m.email}`} className="link">{m.email}</a>
                      {m.phone && ` · ${m.phone}`} · {new Date(m.createdAt).toLocaleString('en-IN')}
                    </p>
                    <p className="mt-3 text-sm whitespace-pre-line">{m.message}</p>
                  </div>
                  <Select label="Message status" value={m.status} onChange={(v) => setStatus(m, v as AdminMessage['status'])} options={[{ value: 'new', label: 'New' }, { value: 'read', label: 'Read' }, { value: 'resolved', label: 'Resolved' }]} />
                </div>
              </li>
            ))}
          </ul>
        )
      ) : subscribers.loading ? (
        <PageLoader />
      ) : subscribers.error ? (
        <ErrorState message={subscribers.error} onRetry={subscribers.reload} />
      ) : (
        <Panel
          actions={
            <button onClick={exportCsv} disabled={!subscribers.data?.length} className="btn-secondary btn-sm">
              Export CSV
            </button>
          }
          title={`${subscribers.data?.length ?? 0} subscribers`}
        >
          <Table head={['Email', 'Source', 'Status', 'Subscribed']} empty={!subscribers.data?.length}>
            {subscribers.data?.map((s) => (
              <tr key={s._id}>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2 text-muted">{s.source}</td>
                <td className="px-4 py-2">
                  <Pill>{s.status}</Pill>
                </td>
                <td className="px-4 py-2 text-muted">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
    </div>
  )
}

/* ---------------- Careers ---------------- */

export function AdminCareersPage() {
  useDocumentTitle('Careers — Admin')
  const toast = useToast()
  const jobs = useAsync(() => adminApi.jobs(), [])
  const apps = useAsync(() => adminApi.applications(), [])
  const [editing, setEditing] = useState<AdminJob | 'new' | null>(null)

  const setAppStatus = async (a: AdminApplication, status: AdminApplication['status']) => {
    try {
      await adminApi.updateApplication(a._id, status)
      apps.setData((apps.data ?? []).map((x) => (x._id === a._id ? { ...x, status } : x)))
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <AdminTitle
        title="Careers"
        subtitle="Open jobs appear on the Careers page."
        actions={
          <button onClick={() => setEditing('new')} className="btn-primary btn-sm">
            <Plus className="size-4" aria-hidden /> Post a job
          </button>
        }
      />
      <Panel title="Jobs">
        {jobs.loading ? (
          <PageLoader />
        ) : jobs.error ? (
          <ErrorState message={jobs.error} onRetry={jobs.reload} className="m-4" />
        ) : (
          <Table head={['Title', 'Department', 'Location', 'Type', 'Status', '']} empty={!jobs.data?.length}>
            {jobs.data?.map((j) => (
              <tr key={j._id} className="hover:bg-cream-light">
                <td className="px-4 py-3 font-medium">{j.title}</td>
                <td className="px-4 py-3 text-muted">{j.department || '—'}</td>
                <td className="px-4 py-3 text-muted">{j.location || '—'}</td>
                <td className="px-4 py-3 text-muted">{j.type}</td>
                <td className="px-4 py-3">
                  <Pill className={j.isOpen ? 'bg-sage/15 text-sage-dark' : 'bg-stone/20 text-muted'}>{j.isOpen ? 'Open' : 'Closed'}</Pill>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(j)} aria-label={`Edit ${j.title}`} className="p-2 hover:text-brand-dark">
                    <Pencil className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Panel title="Applications">
        {apps.loading ? (
          <PageLoader />
        ) : apps.error ? (
          <ErrorState message={apps.error} onRetry={apps.reload} className="m-4" />
        ) : (
          <Table head={['Applicant', 'Job', 'Resume', 'Applied', 'Status']} empty={!apps.data?.length}>
            {apps.data?.map((a) => (
              <tr key={a._id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted">
                    {a.email} · {a.phone}
                  </p>
                  {a.coverLetter && <p className="mt-1 max-w-md text-xs whitespace-pre-line text-muted">{a.coverLetter}</p>}
                </td>
                <td className="px-4 py-3">{a.job?.title ?? '—'}</td>
                <td className="px-4 py-3">
                  {a.resumeUrl ? (
                    <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer" className="link">
                      Open
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <Select label="Application status" value={a.status} onChange={(v) => setAppStatus(a, v as AdminApplication['status'])} options={['new', 'reviewing', 'shortlisted', 'rejected', 'hired'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Post a job' : 'Edit job'}>
        {editing && (
          <JobForm
            job={editing === 'new' ? undefined : editing}
            onSaved={() => {
              setEditing(null)
              jobs.reload()
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function JobForm({ job, onSaved }: { job?: AdminJob; onSaved: () => void }) {
  const toast = useToast()
  const [v, setV] = useState({
    title: job?.title ?? '',
    department: job?.department ?? '',
    location: job?.location ?? '',
    type: job?.type ?? 'Full-time',
    summary: job?.summary ?? '',
    description: job?.description ?? '',
    responsibilities: job?.responsibilities.join('\n') ?? '',
    requirements: job?.requirements.join('\n') ?? '',
    isOpen: job?.isOpen ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const f = (key: keyof typeof v) => ({ value: v[key] as string, onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [key]: e.target.value })) })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (v.title.trim().length < 2) return setError('Enter a job title.')
    setSaving(true)
    setError(null)
    try {
      await adminApi.saveJob({ ...v, title: v.title.trim(), responsibilities: lines(v.responsibilities), requirements: lines(v.requirements) }, job?._id)
      toast.success('Job saved')
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="j-title">Title *</label>
        <input id="j-title" className="input" {...f('title')} />
      </div>
      <div>
        <label className="label" htmlFor="j-dept">Department</label>
        <input id="j-dept" className="input" {...f('department')} />
      </div>
      <div>
        <label className="label" htmlFor="j-loc">Location</label>
        <input id="j-loc" className="input" {...f('location')} />
      </div>
      <div>
        <label className="label" htmlFor="j-type">Type</label>
        <input id="j-type" className="input" {...f('type')} />
      </div>
      <label className="flex items-end gap-2 pb-3 text-sm">
        <input type="checkbox" className="size-4 accent-brand-dark" checked={v.isOpen} onChange={(e) => setV((s) => ({ ...s, isOpen: e.target.checked }))} /> Open for applications
      </label>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="j-sum">Short summary</label>
        <input id="j-sum" className="input" {...f('summary')} />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="j-desc">Description</label>
        <textarea id="j-desc" className="input min-h-24" {...f('description')} />
      </div>
      <div>
        <label className="label" htmlFor="j-resp">Responsibilities — one per line</label>
        <textarea id="j-resp" className="input min-h-28" {...f('responsibilities')} />
      </div>
      <div>
        <label className="label" htmlFor="j-req">Requirements — one per line</label>
        <textarea id="j-req" className="input min-h-28" {...f('requirements')} />
      </div>
      {error && <p className="text-sm text-danger sm:col-span-2" role="alert">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Spinner className="size-4" />} Save job
        </button>
      </div>
    </form>
  )
}
