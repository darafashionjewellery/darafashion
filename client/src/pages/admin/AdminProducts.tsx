import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowUp, Eye, EyeOff, Link2, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { adminApi } from '../../services/admin'
import { errorMessage } from '../../services/api'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce, useDocumentTitle } from '../../hooks/misc'
import { useToast } from '../../context/ToastContext'
import { AdminTitle, Pager, Panel, Pill, SearchInput, Select, Table, csv, lines } from '../../components/admin/AdminUI'
import { SmartImage } from '../../components/ui/Images'
import { uploadFile } from '../../components/admin/ImageInput'
import { ErrorState, PageLoader, Spinner } from '../../components/ui/States'
import { OCCASIONS } from '../../config/navigation'
import type { AdminCategory, AdminCollection, AdminProduct, AdminProductInput } from '../../types/admin'
import { formatPrice } from '../../lib/utils'

export function AdminProductsPage() {
  useDocumentTitle('Products — Admin')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const debounced = useDebounce(q, 300)
  const category = params.get('category') ?? ''
  const status = params.get('status') ?? ''
  const stock = params.get('stock') ?? ''
  const page = Number(params.get('page')) || 1
  const categories = useAsync(() => adminApi.categories(), [])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  const { data, loading, error, reload } = useAsync(
    () => adminApi.products({ q: debounced || undefined, category: category || undefined, status: status || undefined, stock: stock || undefined, page, limit: 25 }),
    [debounced, category, status, stock, page],
  )
  const toast = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)

  const remove = async (p: AdminProduct) => {
    if (!window.confirm(`Delete "${p.name}" permanently?\n\nIt will be removed from the store, customers' bags and wishlists. Past orders keep their own copy.\nTo only hide it, open the product and click "Hide" instead.`)) return
    setDeleting(p.id)
    try {
      const res = await adminApi.deleteProduct(p.id)
      toast.success(res.message)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <AdminTitle
        title="Products"
        subtitle={data ? `${data.total} product${data.total === 1 ? '' : 's'}` : undefined}
        actions={
          <Link to="/admin/products/new" className="btn-primary btn-sm">
            <Plus className="size-4" aria-hidden /> Add product
          </Link>
        }
      />
      <Panel>
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search name or SKU" />
          <Select label="Category" value={category} onChange={(v) => setParam('category', v)} options={[{ value: '', label: 'All categories' }, ...(categories.data ?? []).map((c) => ({ value: c.slug, label: c.navLabel || c.name }))]} />
          <Select label="Visibility" value={status} onChange={(v) => setParam('status', v)} options={[{ value: '', label: 'Visible & hidden' }, { value: 'active', label: 'Visible' }, { value: 'hidden', label: 'Hidden' }]} />
          <Select label="Stock" value={stock} onChange={(v) => setParam('stock', v)} options={[{ value: '', label: 'Any stock' }, { value: 'low', label: 'Low stock (≤5)' }, { value: 'out', label: 'Out of stock' }]} />
        </div>
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} className="m-4" />
        ) : (
          <>
            <Table head={['Product', 'Category', 'Price', 'Stock', 'Sold', 'Status', 'Actions']} empty={!data?.items.length}>
              {data?.items.map((p) => (
                <tr key={p.id} className="hover:bg-cream-light">
                  <td className="px-4 py-3">
                    <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:text-brand-dark">
                      <SmartImage src={p.images[0]} alt="" className="size-12 shrink-0 rounded object-cover" />
                      <span>
                        <span className="font-medium">{p.name}</span>
                        <span className="block text-xs text-muted">
                          {p.sku}
                          {p.variants.length > 0 && ` · ${p.variants.length} options`}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatPrice(p.price)}
                    {p.compareAtPrice && <span className="ml-1 text-xs text-muted line-through">{formatPrice(p.compareAtPrice)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.totalStock <= 0 ? 'font-medium text-danger' : p.totalStock <= 5 ? 'font-medium text-brand-dark' : ''}>{p.totalStock}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.salesCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Pill className={p.isActive ? 'bg-sage/15 text-sage-dark' : 'bg-stone/20 text-muted'}>{p.isActive ? 'Visible' : 'Hidden'}</Pill>
                      {p.isNewArrival && <Pill>New</Pill>}
                      {p.isBestSeller && <Pill>Bestseller</Pill>}
                      {p.isFeatured && <Pill>Featured</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/products/${p.id}`} className="btn-secondary btn-sm">
                        <Pencil className="size-3.5" aria-hidden /> Edit
                      </Link>
                      <button type="button" onClick={() => remove(p)} disabled={deleting === p.id} aria-label={`Delete ${p.name}`} className="rounded-full p-2 text-muted hover:bg-brand-soft hover:text-danger">
                        {deleting === p.id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} onChange={(p) => setParam('page', String(p))} />
          </>
        )}
      </Panel>
    </div>
  )
}

interface VariantRow {
  sku: string
  label: string
  swatch: string
  price: string
  compareAtPrice: string
  stock: string
}

interface FormState {
  name: string
  slug: string
  sku: string
  category: string
  style: string
  craftsmanship: string
  material: string
  colors: string
  tags: string
  price: string
  compareAtPrice: string
  stock: string
  description: string
  images: string
  details: string
  care: string
  occasions: string[]
  collections: string[]
  variants: VariantRow[]
  isNewArrival: boolean
  isBestSeller: boolean
  isFeatured: boolean
  isActive: boolean
}

const toForm = (p?: AdminProduct): FormState => ({
  name: p?.name ?? '',
  slug: p?.slug ?? '',
  sku: p?.sku ?? '',
  category: p?.category?.id ?? '',
  style: p?.style ?? '',
  craftsmanship: p?.craftsmanship ?? '',
  material: p?.material ?? '',
  colors: p?.colors.join(', ') ?? '',
  tags: p?.tags.join(', ') ?? '',
  price: p ? String(p.price) : '',
  compareAtPrice: p?.compareAtPrice != null ? String(p.compareAtPrice) : '',
  stock: p ? String(p.stock) : '0',
  description: p?.description ?? '',
  images: p?.images.join('\n') ?? '',
  details: p?.details.map((d) => `${d.label}: ${d.value}`).join('\n') ?? '',
  care: p?.careInstructions.join('\n') ?? '',
  occasions: p?.occasions ?? [],
  collections: p?.collections ?? [],
  variants: (p?.variants ?? []).map((v) => ({
    sku: v.sku,
    label: v.label,
    swatch: v.swatch,
    price: v.price != null ? String(v.price) : '',
    compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : '',
    stock: String(v.stock),
  })),
  isNewArrival: p?.isNewArrival ?? true,
  isBestSeller: p?.isBestSeller ?? false,
  isFeatured: p?.isFeatured ?? false,
  isActive: p?.isActive ?? true,
})

const optionalNumber = (v: string) => (v.trim() === '' ? null : Number(v))

function toInput(f: FormState): AdminProductInput {
  return {
    name: f.name.trim(),
    slug: f.slug.trim() || undefined,
    sku: f.sku.trim(),
    category: f.category,
    style: f.style.trim().toLowerCase(),
    craftsmanship: f.craftsmanship.trim(),
    material: f.material.trim(),
    colors: csv(f.colors),
    tags: csv(f.tags),
    price: Number(f.price),
    compareAtPrice: optionalNumber(f.compareAtPrice),
    stock: Number(f.stock) || 0,
    description: f.description.trim(),
    images: lines(f.images),
    details: lines(f.details)
      .map((l) => {
        const i = l.indexOf(':')
        return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : null
      })
      .filter((d): d is { label: string; value: string } => !!d && !!d.value),
    careInstructions: lines(f.care),
    occasions: f.occasions,
    collections: f.collections,
    variants: f.variants
      .filter((v) => v.sku.trim() && v.label.trim())
      .map((v) => ({
        sku: v.sku.trim().toUpperCase(),
        label: v.label.trim(),
        color: v.label.trim().toLowerCase(),
        swatch: v.swatch,
        price: optionalNumber(v.price),
        compareAtPrice: optionalNumber(v.compareAtPrice),
        stock: Number(v.stock) || 0,
        images: [],
      })),
    isNewArrival: f.isNewArrival,
    isBestSeller: f.isBestSeller,
    isFeatured: f.isFeatured,
    isActive: f.isActive,
  }
}

function validateForm(f: FormState): string | null {
  if (f.name.trim().length < 2) return 'Enter a product name.'
  if (!f.sku.trim()) return 'Enter a SKU.'
  if (!f.category) return 'Choose a category.'
  if (f.price === '' || Number(f.price) < 0 || Number.isNaN(Number(f.price))) return 'Enter a valid price.'
  if (f.compareAtPrice && Number(f.compareAtPrice) <= Number(f.price)) return 'The original (MRP) price should be higher than the selling price, or left empty.'
  const skus = f.variants.map((v) => v.sku.trim().toUpperCase()).filter(Boolean)
  if (new Set(skus).size !== skus.length) return 'Each option needs a unique SKU.'
  if (f.variants.some((v) => (v.sku.trim() && !v.label.trim()) || (!v.sku.trim() && v.label.trim()))) return 'Each option needs both a SKU and a name.'
  return null
}

export function AdminProductEditPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  useDocumentTitle(isNew ? 'New product — Admin' : 'Edit product — Admin')
  const product = useAsync(() => (isNew ? Promise.resolve(undefined) : adminApi.product(id!)), [id])
  const catalog = useAsync(() => Promise.all([adminApi.categories(), adminApi.collections()]), [])

  if (product.loading || catalog.loading) return <PageLoader />
  if (product.error) return <ErrorState message={product.error} onRetry={product.reload} />
  if (catalog.error || !catalog.data) return <ErrorState message={catalog.error ?? 'Could not load categories'} onRetry={catalog.reload} />

  return <ProductForm key={product.data?.id ?? 'new'} product={product.data} categories={catalog.data[0]} collections={catalog.data[1]} />
}

function ProductForm({ product, categories, collections }: { product?: AdminProduct; categories: AdminCategory[]; collections: AdminCollection[] }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(() => toForm(product))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as never),
  })
  const toggle = (key: 'occasions' | 'collections', value: string) =>
    set(key, form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value])
  const setVariant = (i: number, patch: Partial<VariantRow>) => set('variants', form.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))

  const selectedCategory = categories.find((c) => c._id === form.category)
  const images = lines(form.images)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = validateForm(form)
    if (problem) return setError(problem)
    setSaving(true)
    setError(null)
    try {
      const body = toInput(form)
      if (product) {
        await adminApi.updateProduct(product.id, body)
        toast.success('Product saved')
      } else {
        const created = await adminApi.createProduct(body)
        toast.success('Product created')
        navigate(`/admin/products/${created.id}`, { replace: true })
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // --- Images: upload files or add URLs; first image is the main one ---
  const setImages = (list: string[]) => set('images', list.join('\n'))
  const [uploading, setUploading] = useState(0)
  const [imageError, setImageError] = useState<string | null>(null)

  const uploadImages = async (files: FileList | null, replaceIndex?: number) => {
    if (!files?.length) return
    setImageError(null)
    const list = [...images]
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1)
      try {
        const url = await uploadFile(file, 'products')
        if (replaceIndex !== undefined) list[replaceIndex] = url
        else list.push(url)
        setImages(list)
      } catch (err) {
        setImageError(`${file.name}: ${(err as Error).message}`)
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  const addImageUrl = () => {
    const url = window.prompt('Paste the image URL (for example /assets/products/necklace-01.webp or https://…)')?.trim()
    if (url) setImages([...images, url])
  }

  const deleteProduct = async () => {
    if (!product) return
    if (!window.confirm(`Delete "${product.name}" permanently?\n\nIt will be removed from the store, customers' bags and wishlists. Past orders keep their own copy.\nTo only hide it, use "Hide" instead.`)) return
    try {
      const res = await adminApi.deleteProduct(product.id)
      toast.success(res.message)
      navigate('/admin/products', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const toggleVisibility = async () => {
    if (!product) return
    try {
      if (form.isActive) await adminApi.hideProduct(product.id)
      else await adminApi.updateProduct(product.id, { isActive: true })
      set('isActive', !form.isActive)
      toast.success(form.isActive ? 'Product hidden from the store' : 'Product is visible in the store')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div>
        <Link to="/admin/products" className="text-sm link">
          ← All products
        </Link>
        <AdminTitle
          title={product ? product.name : 'New product'}
          subtitle={product ? `${product.sku} · sold ${product.salesCount}` : 'Add a product to the catalogue'}
          actions={
            product && (
              <>
                {form.isActive && (
                  <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
                    <Eye className="size-4" aria-hidden /> View in store
                  </a>
                )}
                <button type="button" onClick={toggleVisibility} className="btn-secondary btn-sm">
                  {form.isActive ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  {form.isActive ? 'Hide' : 'Make visible'}
                </button>
                <button type="button" onClick={deleteProduct} className="btn btn-sm border border-danger/40 text-danger hover:bg-danger hover:text-white">
                  <Trash2 className="size-4" aria-hidden /> Delete
                </button>
              </>
            )
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel title="Basic details">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label">Name *</label>
                <input id="name" className="input" {...field('name')} />
              </div>
              <div>
                <label htmlFor="sku" className="label">SKU *</label>
                <input id="sku" className="input uppercase" {...field('sku')} />
              </div>
              <div>
                <label htmlFor="slug" className="label">URL slug</label>
                <input id="slug" className="input" {...field('slug')} placeholder="Generated from the name" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="label">Description</label>
                <textarea id="description" className="input min-h-32" {...field('description')} />
              </div>
            </div>
          </Panel>

          <Panel title="Pricing & stock">
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div>
                <label htmlFor="price" className="label">Selling price (₹) *</label>
                <input id="price" type="number" min={0} className="input" {...field('price')} />
              </div>
              <div>
                <label htmlFor="mrp" className="label">Original price / MRP (₹)</label>
                <input id="mrp" type="number" min={0} className="input" {...field('compareAtPrice')} placeholder="Optional" />
              </div>
              <div>
                <label htmlFor="stock" className="label">Stock</label>
                <input id="stock" type="number" min={0} className="input" {...field('stock')} disabled={form.variants.length > 0} />
                {form.variants.length > 0 && <p className="mt-1 text-xs text-muted">Stock is set per option below.</p>}
              </div>
            </div>

            <div className="border-t border-line p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Options (finishes / colours)</p>
                  <p className="text-xs text-muted">Leave empty if the product has a single option. Option prices are optional and override the main price.</p>
                </div>
                <button type="button" onClick={() => set('variants', [...form.variants, { sku: `${form.sku.toUpperCase()}-${form.variants.length + 1}`, label: '', swatch: '#C9A24B', price: '', compareAtPrice: '', stock: '0' }])} className="btn-secondary btn-sm">
                  <Plus className="size-4" aria-hidden /> Add option
                </button>
              </div>
              {form.variants.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs tracking-wider text-muted uppercase">
                        <th className="pb-2 font-medium">Colour</th>
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">SKU</th>
                        <th className="pb-2 font-medium">Price</th>
                        <th className="pb-2 font-medium">MRP</th>
                        <th className="pb-2 font-medium">Stock</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {form.variants.map((v, i) => (
                        <tr key={i}>
                          <td className="py-1 pr-2">
                            <input type="color" value={v.swatch || '#ffffff'} onChange={(e) => setVariant(i, { swatch: e.target.value })} aria-label="Swatch colour" className="h-10 w-12 cursor-pointer rounded border border-line" />
                          </td>
                          <td className="py-1 pr-2">
                            <input className="input py-2" value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder="Gold Tone" aria-label="Option name" />
                          </td>
                          <td className="py-1 pr-2">
                            <input className="input py-2 uppercase" value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} aria-label="Option SKU" />
                          </td>
                          <td className="py-1 pr-2">
                            <input type="number" min={0} className="input w-24 py-2" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} placeholder="—" aria-label="Option price" />
                          </td>
                          <td className="py-1 pr-2">
                            <input type="number" min={0} className="input w-24 py-2" value={v.compareAtPrice} onChange={(e) => setVariant(i, { compareAtPrice: e.target.value })} placeholder="—" aria-label="Option MRP" />
                          </td>
                          <td className="py-1 pr-2">
                            <input type="number" min={0} className="input w-20 py-2" value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} aria-label="Option stock" />
                          </td>
                          <td className="py-1">
                            <button type="button" onClick={() => set('variants', form.variants.filter((_, idx) => idx !== i))} aria-label="Remove option" className="p-2 text-muted hover:text-danger">
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Images"
            actions={
              <div className="flex flex-wrap gap-2">
                <label className={`btn-primary btn-sm ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                  {uploading ? <Spinner className="size-4" /> : <Upload className="size-4" aria-hidden />}
                  {uploading ? `Uploading ${uploading}…` : 'Upload files'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple className="sr-only" onChange={(e) => { uploadImages(e.target.files); e.target.value = '' }} />
                </label>
                <button type="button" onClick={addImageUrl} className="btn-secondary btn-sm">
                  <Link2 className="size-4" aria-hidden /> Add by URL
                </button>
              </div>
            }
          >
            <div className="space-y-3 p-5">
              <p className="text-xs text-muted">
                Upload JPG / PNG / WebP — files are stored on the server, resized and converted to WebP automatically. Best shape: portrait 4:5 (e.g. 1200 × 1500). The first image is the main one.
              </p>
              {imageError && (
                <p className="text-sm text-danger" role="alert">
                  {imageError}
                </p>
              )}
              {images.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">No images yet — upload files or add an image URL.</p>
              ) : (
                <ul className="space-y-2">
                  {images.map((src, i) => (
                    <li key={src + i} className="flex items-center gap-3 rounded-lg border border-line p-2">
                      <SmartImage src={src} alt={`Image ${i + 1}`} className="aspect-[4/5] w-14 shrink-0 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{i === 0 ? 'Main image' : `Image ${i + 1}`}</p>
                        <input
                          className="input mt-1 py-1.5 font-mono text-xs"
                          value={src}
                          onChange={(e) => setImages(images.map((s, idx) => (idx === i ? e.target.value : s)))}
                          aria-label={`Image ${i + 1} URL`}
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <label className="cursor-pointer rounded-full p-2 text-muted hover:bg-brand-soft hover:text-brand-dark" title="Replace with a file">
                          <Upload className="size-4" aria-hidden />
                          <span className="sr-only">Replace image {i + 1} with a file</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(e) => { uploadImages(e.target.files, i); e.target.value = '' }} />
                        </label>
                        {i > 0 && (
                          <button type="button" onClick={() => setImages([src, ...images.filter((_, idx) => idx !== i)])} className="rounded-full p-2 text-muted hover:bg-brand-soft hover:text-brand-dark" title="Make main image" aria-label={`Make image ${i + 1} the main image`}>
                            <ArrowUp className="size-4" />
                          </button>
                        )}
                        <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="rounded-full p-2 text-muted hover:bg-brand-soft hover:text-danger" title="Remove" aria-label={`Remove image ${i + 1}`}>
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel title="Product information">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <label htmlFor="details" className="label">Specifications — "Label: value" per line</label>
                <textarea id="details" className="input min-h-28" {...field('details')} placeholder={'Weight: 24 g\nLength: 6 cm'} />
                <p className="mt-1 text-xs text-muted">Only add verified details.</p>
              </div>
              <div>
                <label htmlFor="care" className="label">Care instructions — one per line</label>
                <textarea id="care" className="input min-h-28" {...field('care')} />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Visibility">
            <div className="space-y-3 p-5 text-sm">
              {(
                [
                  ['isActive', 'Visible in store'],
                  ['isNewArrival', 'New arrival'],
                  ['isBestSeller', 'Bestseller'],
                  ['isFeatured', 'Featured on homepage'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3">
                  <input type="checkbox" className="size-4 accent-brand-dark" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Organisation">
            <div className="space-y-4 p-5">
              <div>
                <label htmlFor="category" className="label">Category *</label>
                <select id="category" className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Choose…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.navLabel || c.name}
                      {!c.isActive && ' (inactive)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="style" className="label">Style</label>
                <input id="style" className="input" list="style-options" {...field('style')} />
                <datalist id="style-options">
                  {selectedCategory?.styles.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <label htmlFor="craft" className="label">Craftsmanship</label>
                <input id="craft" className="input" {...field('craftsmanship')} placeholder="e.g. Kundan, Temple, Oxidised" />
              </div>
              <div>
                <label htmlFor="material" className="label">Material (verified only)</label>
                <input id="material" className="input" {...field('material')} />
              </div>
              <div>
                <label htmlFor="colors" className="label">Colours — comma separated</label>
                <input id="colors" className="input" {...field('colors')} placeholder="gold, green" />
              </div>
              <div>
                <label htmlFor="tags" className="label">Search tags — comma separated</label>
                <input id="tags" className="input" {...field('tags')} />
              </div>
              <fieldset>
                <legend className="label">Occasions</legend>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {OCCASIONS.map((o) => (
                    <label key={o.slug} className="flex items-center gap-2">
                      <input type="checkbox" className="size-4 accent-brand-dark" checked={form.occasions.includes(o.slug)} onChange={() => toggle('occasions', o.slug)} />
                      {o.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label">Collections</legend>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {collections.map((c) => (
                    <label key={c._id} className="flex items-center gap-2">
                      <input type="checkbox" className="size-4 accent-brand-dark" checked={form.collections.includes(c.slug)} onChange={() => toggle('collections', c.slug)} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Panel>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {error && (
          <p className="mr-auto text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <Link to="/admin/products" className="btn-secondary btn-sm">
          Cancel
        </Link>
        <button type="submit" disabled={saving} className="btn-primary btn-sm">
          {saving && <Spinner className="size-4" />} {product ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  )
}
