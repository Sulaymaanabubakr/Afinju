import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
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
      await signInWithEmailAndPassword(auth, data.email, data.password)
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex flex-col bg-afinju-black text-afinju-cream p-16 justify-between">
        <Link to="/" className="font-display text-xl tracking-[0.3em]">AFINJU</Link>
        <div className="max-w-sm">
          <p className="font-heading text-3xl italic text-gold/80 mb-6">
            "Not for you if you cannot handle attention."
          </p>
          <div className="gold-rule-left mb-6" />
          <p className="font-body text-afinju-cream/50 text-base">
            The Authority Set. Ten units. One standard.
          </p>
        </div>
        <p className="font-sans text-xs text-afinju-cream/20 tracking-wider">
          © 2024 AFINJU
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-display text-lg tracking-[0.3em] block lg:hidden mb-12">
            AFINJU
          </Link>

          <div className="mb-10">
            <p className="section-label mb-2">Welcome Back</p>
            <h1 className="font-heading text-3xl">Sign In</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-1">
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input-luxury"
              />
              {errors.email && <p className="font-sans text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="font-sans text-xs text-afinju-black/40 hover:text-gold transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-luxury pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 bottom-3 text-afinju-black/30 hover:text-afinju-black transition-colors"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="font-sans text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-luxury w-full py-4 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="font-sans text-sm text-afinju-black/50 text-center mt-8">
            New here?{' '}
            <Link to="/signup" className="text-afinju-black hover:text-gold transition-colors font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
