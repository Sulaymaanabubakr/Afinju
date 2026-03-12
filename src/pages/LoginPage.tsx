import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('return') || '/account'
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

      if (role === 'admin' || role === 'staff') {
        await signOut(auth)
        toast.error('Admin users must sign in through the admin portal.')
        navigate('/admin/login')
        return
      }

      toast.success('Welcome back.')
      navigate(returnTo)
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : 'Sign in failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-luxury relative min-h-screen overflow-hidden bg-afinju-black text-afinju-cream">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-gold/18 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #C9A84C 0, transparent 40%), radial-gradient(circle at 80% 70%, #C9A84C 0, transparent 45%)' }} />
      </div>

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex flex-col bg-afinju-black/70 border-r border-white/10 p-16 justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.09]" style={{ backgroundImage: 'radial-gradient(circle at 18% 20%, #C9A84C 0, transparent 52%), radial-gradient(circle at 80% 78%, #C9A84C 0, transparent 48%)' }} />
        <Link to="/" className="font-display text-xl tracking-[0.3em]">Afínjú</Link>
        <div className="max-w-sm relative">
          <p className="font-heading text-3xl italic text-gold/80 mb-6">
            "Not for you if you cannot handle attention."
          </p>
          <div className="gold-rule-left mb-6" />
          <p className="font-body text-afinju-cream/50 text-base">
            The Authority Set. Ten units. One standard.
          </p>
        </div>
        <p className="font-sans text-xs text-afinju-cream/20 tracking-wider">
          © 2024 Afínjú
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center px-6 py-10 md:px-8 md:py-14">
        <div className="w-full max-w-md border border-white/12 bg-black/45 px-6 py-8 shadow-[0_26px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-sm md:px-8 md:py-10">
          <div className="mb-10">
            <p className="section-label mb-2">Welcome Back</p>
            <h1 className="font-heading text-3xl text-afinju-cream">Sign In</h1>
            <p className="mt-3 font-body text-sm text-afinju-cream/55">
              Continue to your account dashboard and track your orders.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-1">
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-cream/55">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full bg-transparent border-0 border-b border-afinju-cream/25 pb-3 pt-2 font-sans text-sm text-afinju-cream placeholder:text-afinju-cream/30 focus:outline-none focus:border-gold transition-colors duration-200"
              />
              {errors.email && <p className="font-sans text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-cream/55">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="font-sans text-xs text-afinju-cream/45 hover:text-gold transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-0 border-b border-afinju-cream/25 pb-3 pt-2 pr-8 font-sans text-sm text-afinju-cream placeholder:text-afinju-cream/30 focus:outline-none focus:border-gold transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 bottom-3 text-afinju-cream/35 hover:text-afinju-cream transition-colors"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="font-sans text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="font-sans text-sm text-afinju-cream/55 text-center mt-8">
            New here?{' '}
            <Link to="/signup" className="text-afinju-cream hover:text-gold transition-colors font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
