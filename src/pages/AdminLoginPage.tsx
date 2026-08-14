import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { grantAdminAccess } from '@/features/auth/adminSession'
import { Eye, EyeOff, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedReturn = searchParams.get('return')
  const returnTo = requestedReturn && (requestedReturn === '/admin' || requestedReturn.startsWith('/admin/'))
    ? requestedReturn
    : '/admin'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mfaStage, setMfaStage] = useState<'password' | 'enroll' | 'challenge'>('password')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaChallengeId, setMfaChallengeId] = useState('')
  const [enrollmentQr, setEnrollmentQr] = useState('')
  const [enrollmentSecret, setEnrollmentSecret] = useState('')
  const [secretCopied, setSecretCopied] = useState(false)
  const [mfaError, setMfaError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const finishAdminLogin = (uid: string) => {
    grantAdminAccess(uid)
    toast.success('Admin access granted.')
    navigate(returnTo)
  }

  const onPasswordSubmit = async (data: FormData) => {
    let currentStep: 'password' | 'mfa' = 'password'
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (authError || !authData.user) throw authError || new Error('Auth failed')

      const { data: profile } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
      const role = profile?.role

      if (role !== 'admin' && role !== 'staff') {
        await supabase.auth.signOut()
        toast.error('Unauthorized admin access.')
        return
      }

      currentStep = 'mfa'
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError

      const verifiedFactor = factors.totp.find((factor) => factor.status === 'verified')
      if (verifiedFactor) {
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id })
        if (challengeError) throw challengeError
        setMfaFactorId(verifiedFactor.id)
        setMfaChallengeId(challenge.id)
        setMfaStage('challenge')
        return
      }

      // An interrupted first-time setup leaves an unverified factor behind.
      // Remove it before creating a fresh enrollment so the admin is not
      // trapped in a generic sign-in error on the next attempt.
      for (const factor of factors.totp.filter((item) => (item.status as string) === 'unverified')) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
        if (removeError) throw new Error(`Previous TOTP setup is incomplete: ${removeError.message}`)
      }

      const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Afínjú Admin Authenticator',
      })
      if (enrollmentError || !enrollment) throw enrollmentError || new Error('Unable to start TOTP setup')

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollment.id })
      if (challengeError) throw challengeError

      setMfaFactorId(enrollment.id)
      setMfaChallengeId(challenge.id)
      setEnrollmentQr(enrollment.totp.qr_code)
      setEnrollmentSecret(enrollment.totp.secret)
      setSecretCopied(false)
      setMfaStage('enroll')
    } catch (err: any) {
      console.error('Admin authentication failed', { step: currentStep, error: err })
      if (currentStep === 'mfa') {
        setMfaError(err.message || 'TOTP setup failed. Please try again.')
      } else {
        const msg = err.message === 'Invalid login credentials'
          ? 'Invalid admin credentials.'
          : 'Admin sign in failed. Please try again.'
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyMfa = async () => {
    if (!/^\d{6}$/.test(mfaCode)) {
      setMfaError('Enter the 6-digit code from your authenticator app.')
      return
    }

    setLoading(true)
    setMfaError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData.session?.user.id
      if (!uid) throw new Error('Your admin session expired. Please sign in again.')

      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      })
      if (error) throw error

      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assurance?.currentLevel !== 'aal2') throw new Error('TOTP verification did not complete.')
      finishAdminLogin(uid)
    } catch (err: any) {
      setMfaError(err.message || 'TOTP verification failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (mfaStage === 'password') {
      void handleSubmit(onPasswordSubmit)(event)
      return
    }
    event.preventDefault()
    void verifyMfa()
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-16 border-r border-white/10">
        <div>
          <p className="font-display text-xl tracking-[0.3em]">Afínjú OPS</p>
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-white/45 mt-3">Restricted Access</p>
        </div>
        <div className="max-w-sm">
          <p className="font-heading text-3xl italic text-white/90 mb-6">
            Internal Operations Portal
          </p>
          <div className="h-px w-24 bg-gold mb-6" />
          <p className="font-body text-white/50">
            For Afínjú staff and administrators only. All activity is monitored.
          </p>
        </div>
        <p className="font-sans text-xs tracking-wider text-white/30">© 2026 Afínjú Internal</p>
      </div>

      <div className="flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-display text-lg tracking-[0.3em] block lg:hidden mb-12 text-white/90">
            Afínjú
          </Link>

          <div className="mb-10">
            <p className="section-label mb-2 text-gold">Admin Portal</p>
            <h1 className="font-heading text-3xl flex items-center gap-2">
              <Shield size={22} strokeWidth={1.7} />
              Sign In
            </h1>
          </div>

          <form onSubmit={onFormSubmit} className="space-y-8">
            {mfaStage !== 'password' ? (
              <>
                <div className="space-y-3">
                  <p className="font-heading text-2xl text-white">
                    {mfaStage === 'enroll' ? 'Set up your authenticator' : 'Enter your authenticator code'}
                  </p>
                  <p className="font-body text-sm text-white/55">
                    {mfaStage === 'enroll'
                      ? 'Scan the QR code with Google Authenticator, 1Password, Authy, or Apple Passwords, then enter the 6-digit code.'
                      : 'Enter the current 6-digit code from your admin authenticator app.'}
                  </p>
                </div>

                {mfaStage === 'enroll' && (
                  <div className="space-y-4 text-center">
                    {enrollmentQr && <img src={enrollmentQr} alt="TOTP enrollment QR code" className="mx-auto h-48 w-48 bg-white p-3" />}
                    <div className="space-y-2">
                      <p className="font-sans text-[11px] tracking-wider text-white/45">
                        Can’t scan? Enter this setup key manually in your authenticator app:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 break-all text-[11px] text-white/85">{enrollmentSecret}</code>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(enrollmentSecret)
                            setSecretCopied(true)
                          }}
                          className="shrink-0 border border-white/20 px-3 py-2 font-sans text-[10px] uppercase tracking-wider text-white/65 hover:border-gold hover:text-gold"
                        >
                          {secretCopied ? 'Copied' : 'Copy key'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-sans text-xs tracking-[0.15em] uppercase text-white/60">Authenticator Code</label>
                  <input
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 font-sans text-lg tracking-[0.35em] placeholder:text-white/30 focus:ring-0 focus:border-gold transition-colors"
                  />
                  {mfaError && <p className="font-sans text-xs text-red-300">{mfaError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-gold text-black font-sans text-xs tracking-[0.2em] uppercase disabled:opacity-60 transition-opacity"
                >
                  {loading ? 'Verifying...' : mfaStage === 'enroll' ? 'Complete TOTP Setup' : 'Verify and Enter'}
                </button>
              </>
            ) : (
              <>
            <div className="space-y-1">
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-white/60">
                Work Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@company.com"
                className="w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 font-sans text-sm placeholder:text-white/30 focus:ring-0 focus:border-gold transition-colors"
              />
              {errors.email && <p className="font-sans text-xs text-red-300">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-sans text-xs tracking-[0.15em] uppercase text-white/60">
                  Password
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="font-sans text-[11px] text-white/45 hover:text-gold transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 pr-8 font-sans text-sm placeholder:text-white/30 focus:ring-0 focus:border-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 bottom-3 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="font-sans text-xs text-red-300">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gold text-black font-sans text-xs tracking-[0.2em] uppercase disabled:opacity-60 transition-opacity"
            >
              {loading ? 'Authenticating...' : 'Enter Admin Portal'}
            </button>
              </>
            )}
          </form>

          <p className="font-sans text-xs text-white/40 text-center mt-8">
            Admin access is provisioned internally. No self-registration.
          </p>
        </div>
      </div>
    </div>
  )
}
