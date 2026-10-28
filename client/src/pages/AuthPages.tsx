import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react'
import { authApi } from '../services'
import { errorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/misc'
import { Logo } from '../components/ui/Logo'
import { PageLoader, Spinner } from '../components/ui/States'
import { EMAIL_RE, cn } from '../lib/utils'

/** Only allow same-site relative redirects. After login or sign-up customers land in the shop by default. */
const safeRedirect = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/shop')
const withRedirect = (path: string, redirect: string) => (redirect === '/shop' ? path : `${path}?redirect=${encodeURIComponent(redirect)}`)

/** Mirrors the server rule: at least 8 characters with a letter and a number. */
export function passwordProblem(password: string) {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must include at least one letter and one number.'
  return null
}

function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream-light px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-card sm:p-10">
        <div className="mb-8 flex justify-center">
          <Logo className="text-lg" />
        </div>
        <h1 className="text-center text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-muted">{subtitle}</p>}
        {children}
        {footer && <div className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  )
}

interface InputProps {
  id: string
  label: string
  icon: typeof Mail
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  autoFocus?: boolean
  error?: string
  hint?: string
}

function IconInput({ id, label, icon: Icon, value, onChange, type = 'text', autoComplete, autoFocus, error, hint }: InputProps) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={cn('input pl-11', isPassword && 'pr-11', error && 'input-error')}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted hover:text-ink">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={`${id}-msg`} className={cn('mt-1 text-xs', error ? 'text-danger' : 'text-muted')} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

function OtpInput({ value, onChange, onComplete, error }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; error?: string | null }) {
  return (
    <div>
      <label htmlFor="otp" className="label">
        Verification code
      </label>
      <input
        id="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6)
          onChange(v)
          if (v.length === 6) onComplete?.(v)
        }}
        className={cn('input text-center text-2xl tracking-[0.6em]', error && 'input-error')}
        placeholder="••••••"
        aria-invalid={!!error}
      />
    </div>
  )
}

function useCooldown(initial: number) {
  const [cooldown, setCooldown] = useState(initial)
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])
  return [cooldown, setCooldown] as const
}

/* ---------------- Login (email + password, no email sent) ---------------- */

export function LoginPage() {
  useDocumentTitle('Login')
  const { user, loading, setUser } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const redirect = safeRedirect(params.get('redirect'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <PageLoader />
  if (user) return <Navigate to={redirect} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!EMAIL_RE.test(value)) return setError('Please enter a valid email address.')
    if (!password) return setError('Please enter your password.')
    setBusy(true)
    setError(null)
    try {
      setUser(await authApi.login(value, password))
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Log in to your DARA account"
      footer={
        <>
          New to DARA?{' '}
          <Link to={withRedirect('/signup', redirect)} className="link font-medium">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="mt-8 space-y-4">
        <IconInput id="email" label="Email address" icon={Mail} type="email" autoComplete="email" autoFocus value={email} onChange={setEmail} />
        <IconInput id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={setPassword} />
        <div className="flex justify-end">
          <Link to="/forgot-password" state={{ email: email.trim() }} className="text-xs link">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy && <Spinner className="size-4" />} Log In
        </button>
      </form>
    </AuthCard>
  )
}

/* ---------------- Sign up (details → email OTP → account) ---------------- */

export function SignupPage() {
  useDocumentTitle('Create Account')
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const redirect = safeRedirect(params.get('redirect'))
  const [v, setV] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof v | 'form', string>>>({})
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof v) => (value: string) => setV((s) => ({ ...s, [key]: value }))

  if (loading) return <PageLoader />
  if (user) return <Navigate to={redirect} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const email = v.email.trim().toLowerCase()
    const errs: typeof errors = {}
    if (v.name.trim().length < 2) errs.name = 'Enter your name.'
    if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address.'
    const pw = passwordProblem(v.password)
    if (pw) errs.password = pw
    if (!errs.password && v.confirm !== v.password) errs.confirm = 'Passwords do not match.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const res = await authApi.signup({ name: v.name.trim(), email, password: v.password })
      navigate(withRedirect('/signup/verify', redirect), { state: { email, resendIn: res.resendIn } })
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Create Your Account"
      subtitle="Join DARA to save your wishlist, track orders and check out faster."
      footer={
        <>
          Already have an account?{' '}
          <Link to={withRedirect('/login', redirect)} className="link font-medium">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="mt-8 space-y-4">
        <IconInput id="name" label="Full name" icon={UserIcon} autoComplete="name" autoFocus value={v.name} onChange={set('name')} error={errors.name} />
        <IconInput id="email" label="Email address" icon={Mail} type="email" autoComplete="email" value={v.email} onChange={set('email')} error={errors.email} />
        <IconInput id="password" label="Password" icon={Lock} type="password" autoComplete="new-password" value={v.password} onChange={set('password')} error={errors.password} hint="At least 8 characters, with a letter and a number." />
        <IconInput id="confirm" label="Confirm password" icon={Lock} type="password" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} error={errors.confirm} />
        {errors.form && (
          <p className="text-sm text-danger" role="alert">
            {errors.form}{' '}
            {/already exists/i.test(errors.form) && (
              <Link to={withRedirect('/login', redirect)} className="link font-medium">
                Log in
              </Link>
            )}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy && <Spinner className="size-4" />} Create Account
        </button>
        <p className="text-center text-xs text-muted">
          We’ll email you a code to verify your address. By creating an account you agree to our <Link to="/terms" className="link">Terms</Link> and{' '}
          <Link to="/privacy-policy" className="link">Privacy Policy</Link>.
        </p>
      </form>
    </AuthCard>
  )
}

export function VerifySignupPage() {
  useDocumentTitle('Verify email')
  const { setUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const state = (location.state ?? {}) as { email?: string; resendIn?: number }
  const email = state.email
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useCooldown(state.resendIn ?? 60)
  const submitting = useRef(false)

  if (!email) return <Navigate to={withRedirect('/signup', redirect)} replace />

  const verify = async (code: string) => {
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your email.')
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setError(null)
    try {
      setUser(await authApi.verifySignup(email, code))
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setOtp('')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  const resend = async () => {
    setError(null)
    setInfo(null)
    try {
      const res = await authApi.resendSignup(email)
      setCooldown(res.resendIn)
      setInfo('A new code has been sent.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AuthCard
      title="Verify Your Email"
      subtitle={
        <>
          Enter the 6-digit code sent to <span className="font-medium text-ink">{email}</span>. It expires in 5 minutes.
        </>
      }
      footer={
        <div className="flex items-center justify-between">
          <Link to={withRedirect('/signup', redirect)} className="link">
            Change details
          </Link>
          {cooldown > 0 ? (
            <span>Resend in {cooldown}s</span>
          ) : (
            <button onClick={resend} className="link">
              Resend code
            </button>
          )}
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          verify(otp)
        }}
        className="mt-8 space-y-4"
      >
        <OtpInput value={otp} onChange={setOtp} onComplete={verify} error={error} />
        <p role={error ? 'alert' : 'status'} className={cn('min-h-5 text-sm', error ? 'text-danger' : 'text-sage-dark')}>
          {error ?? info ?? ''}
        </p>
        <button type="submit" disabled={busy || otp.length !== 6} className="btn-primary w-full">
          {busy && <Spinner className="size-4" />} Verify &amp; Create Account
        </button>
      </form>
    </AuthCard>
  )
}

/* ---------------- Forgot password (email code + new password) ---------------- */

export function ForgotPasswordPage() {
  useDocumentTitle('Reset password')
  const { setUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState(((location.state ?? {}) as { email?: string }).email ?? '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useCooldown(0)

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault()
    const value = email.trim().toLowerCase()
    if (!EMAIL_RE.test(value)) return setError('Please enter a valid email address.')
    setBusy(true)
    setError(null)
    try {
      const res = await authApi.forgotPassword(value)
      setEmail(value)
      setInfo(res.message)
      setCooldown(res.resendIn)
      setStep('reset')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const reset = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code from your email.')
    const pw = passwordProblem(password)
    if (pw) return setError(pw)
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    setError(null)
    try {
      setUser(await authApi.resetPassword({ email, otp, password }))
      navigate('/shop', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Reset Password"
      subtitle={step === 'email' ? 'Enter your account email and we’ll send you a code.' : info}
      footer={
        <Link to="/login" className="link">
          Back to login
        </Link>
      }
    >
      {step === 'email' ? (
        <form onSubmit={sendCode} noValidate className="mt-8 space-y-4">
          <IconInput id="email" label="Email address" icon={Mail} type="email" autoComplete="email" autoFocus value={email} onChange={setEmail} />
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy && <Spinner className="size-4" />} Send Code
          </button>
        </form>
      ) : (
        <form onSubmit={reset} noValidate className="mt-8 space-y-4">
          <OtpInput value={otp} onChange={setOtp} error={error} />
          <IconInput id="password" label="New password" icon={Lock} type="password" autoComplete="new-password" value={password} onChange={setPassword} hint="At least 8 characters, with a letter and a number." />
          <IconInput id="confirm" label="Confirm new password" icon={Lock} type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy && <Spinner className="size-4" />} Reset Password &amp; Log In
          </button>
          <p className="text-center text-xs text-muted">
            {cooldown > 0 ? (
              `Didn’t get it? You can resend in ${cooldown}s`
            ) : (
              <button type="button" onClick={() => sendCode()} className="link">
                Resend code
              </button>
            )}
          </p>
        </form>
      )}
    </AuthCard>
  )
}
