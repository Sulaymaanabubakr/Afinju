import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
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
  const returnTo = searchParams.get('return') || '/admin'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password)
      const tokenResult = await cred.user.getIdTokenResult(true)
      const role = tokenResult.claims.role as string | undefined

      if (role !== 'admin' && role !== 'staff') {
        await signOut(auth)
        toast.error('Unauthorized. Use buyer login for customer accounts.')
        return
      }

      grantAdminAccess(cred.user.uid)
      toast.success('Admin access granted.')
      navigate(returnTo)
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid admin credentials.'
        : 'Admin sign in failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
          </form>

          <p className="font-sans text-xs text-white/40 text-center mt-8">
            Admin access is provisioned internally. No self-registration.
          </p>
          <p className="font-sans text-xs text-white/35 text-center mt-2">
            Customer account? <Link to="/login" className="text-white/70 hover:text-gold transition-colors">Use buyer login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
