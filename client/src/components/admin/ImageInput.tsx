import { useId, useRef, useState } from 'react'
import { Link2, Trash2, Upload } from 'lucide-react'
import { adminApi, type UploadFolder } from '../../services/admin'
import { errorMessage } from '../../services/api'
import { SmartImage } from '../ui/Images'
import { Spinner } from '../ui/States'
import { cn } from '../../lib/utils'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

/** Uploads a file and returns its URL, or throws a readable error. */
export async function uploadFile(file: File, folder: UploadFolder) {
  try {
    return (await adminApi.uploadImage(file, folder)).url
  } catch (err) {
    throw new Error(errorMessage(err))
  }
}

interface ImageInputProps {
  label: string
  value: string
  onChange: (url: string) => void
  folder: UploadFolder
  /** Hint shown under the field, e.g. the recommended size. */
  hint?: string
  aspect?: 'square' | 'portrait' | 'wide'
}

/**
 * One image field with two ways to set it:
 *  • Upload file → stored on the server (resized + converted to WebP) and the URL is filled in
 *  • URL → paste any image address (/assets/... or https://...)
 */
export function ImageInput({ label, value, onChange, folder, hint, aspect = 'square' }: ImageInputProps) {
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onChange(await uploadFile(file, folder))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <label htmlFor={`${id}-url`} className="label">
        {label}
      </label>
      <div className="flex gap-3">
        <div className={cn('shrink-0 overflow-hidden rounded-lg border border-line bg-cream', aspect === 'wide' ? 'h-16 w-28' : aspect === 'portrait' ? 'h-20 w-16' : 'size-16')}>
          {busy ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="text-brand" />
            </div>
          ) : (
            <SmartImage src={value || undefined} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="relative">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id={`${id}-url`} className="input py-2 pl-9 font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste image URL, or upload a file →" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn-secondary btn-sm">
              <Upload className="size-4" aria-hidden /> {value ? 'Replace with file' : 'Upload file'}
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className="flex items-center gap-1 px-2 text-xs text-muted hover:text-danger">
                <Trash2 className="size-3.5" aria-hidden /> Remove
              </button>
            )}
            <input ref={fileRef} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-label={`Upload ${label}`} onChange={(e) => pick(e.target.files?.[0])} />
          </div>
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}
