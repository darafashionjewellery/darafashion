import { useState, type FormEvent } from 'react'
import type { Address, AddressInput } from '../../types'
import { Field } from '../ui/Elements'
import { Spinner } from '../ui/States'

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

const EMPTY: AddressInput = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', isDefault: false }

type Errors = Partial<Record<keyof AddressInput, string>>

function validate(a: AddressInput): Errors {
  const e: Errors = {}
  if (a.fullName.trim().length < 2) e.fullName = 'Enter the full name'
  if (!/^[6-9]\d{9}$/.test(a.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number'
  if (a.line1.trim().length < 3) e.line1 = 'Enter the address'
  if (a.city.trim().length < 2) e.city = 'Enter the city'
  if (!a.state) e.state = 'Select the state'
  if (!/^[1-9]\d{5}$/.test(a.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode'
  return e
}

interface Props {
  initial?: Partial<Address>
  submitLabel: string
  onSubmit: (address: AddressInput) => Promise<void>
  onCancel?: () => void
  serverError?: string | null
}

export function AddressForm({ initial, submitLabel, onSubmit, onCancel, serverError }: Props) {
  const [values, setValues] = useState<AddressInput>({ ...EMPTY, ...initial })
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  const set = (key: keyof AddressInput) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await onSubmit({ ...values, phone: values.phone.trim(), pincode: values.pincode.trim() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" name="fullName" autoComplete="name" required value={values.fullName} onChange={set('fullName')} error={errors.fullName} />
      <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} required value={values.phone} onChange={set('phone')} error={errors.phone} />
      <Field className="sm:col-span-2" label="Address line 1" name="line1" autoComplete="address-line1" placeholder="House no., building, street" required value={values.line1} onChange={set('line1')} error={errors.line1} />
      <Field className="sm:col-span-2" label="Address line 2" name="line2" autoComplete="address-line2" placeholder="Area, locality (optional)" value={values.line2} onChange={set('line2')} />
      <Field label="Landmark" name="landmark" value={values.landmark} onChange={set('landmark')} placeholder="Optional" />
      <Field label="Pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} required value={values.pincode} onChange={set('pincode')} error={errors.pincode} />
      <Field label="City" name="city" autoComplete="address-level2" required value={values.city} onChange={set('city')} error={errors.city} />
      <div>
        <label htmlFor="f-state" className="label">
          State<span className="text-brand-dark"> *</span>
        </label>
        <select id="f-state" className={`input ${errors.state ? 'input-error' : ''}`} value={values.state} onChange={set('state')} autoComplete="address-level1" aria-invalid={!!errors.state}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {errors.state && <p className="mt-1 text-xs text-danger">{errors.state}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <div className="flex gap-2" role="radiogroup" aria-label="Address type">
          {['Home', 'Work', 'Other'].map((l) => (
            <button type="button" key={l} role="radio" aria-checked={values.label === l} onClick={() => setValues((v) => ({ ...v, label: l }))} className={`rounded-pill border px-4 py-1.5 text-xs ${values.label === l ? 'border-brand bg-brand-soft' : 'border-line'}`}>
              {l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="size-4 accent-brand-dark" checked={values.isDefault} onChange={(e) => setValues((v) => ({ ...v, isDefault: e.target.checked }))} />
          Make this my default address
        </label>
      </div>
      {serverError && (
        <p className="text-sm text-danger sm:col-span-2" role="alert">
          {serverError}
        </p>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Spinner className="size-4" />} {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export function AddressBlock({ address }: { address: Omit<Address, 'id' | 'label' | 'isDefault'> }) {
  return (
    <address className="text-sm leading-relaxed text-muted not-italic">
      <span className="font-medium text-ink">{address.fullName}</span>
      <br />
      {address.line1}
      {address.line2 && <>, {address.line2}</>}
      <br />
      {address.landmark && (
        <>
          Near {address.landmark}
          <br />
        </>
      )}
      {address.city}, {address.state} – {address.pincode}
      <br />
      Phone: {address.phone}
    </address>
  )
}
