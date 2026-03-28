import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  displayName: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.displayName } }
      })
      if (error) throw error
      toast.success('Account created. Welcome to Afínjú.')
      navigate('/account')
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-luxury relative min-h-screen overflow-hidden bg-afinju-black text-afinju-cream">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -right-20 h-72 w-72 rounded-full bg-gold/18 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle at 70% 18%, #C9A84C 0, transparent 40%), radial-gradient(circle at 20% 78%, #C9A84C 0, transparent 45%)' }} />
      </div>

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col bg-afinju-black/70 border-r border-white/10 p-16 justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.09]" style={{ backgroundImage: 'radial-gradient(circle at 18% 20%, #C9A84C 0, transparent 52%), radial-gradient(circle at 80% 78%, #C9A84C 0, transparent 48%)' }} />
        <Link to="/" className="font-display text-xl tracking-[0.3em]">Afínjú</Link>
        <div className="max-w-sm relative">
          <p className="font-heading text-3xl italic text-gold/80 mb-6">
            "Only ten men will own this launch edition."
          </p>
          <div className="gold-rule-left mb-6" />
          <p className="font-body text-afinju-cream/50">
            Create your account. Secure your position. Claim the authority set.
          </p>
        </div>
        <p className="font-sans text-xs text-afinju-cream/20 tracking-wider">© 2024 Afínjú</p>
      </div>

      <div className="flex items-center justify-center px-6 py-10 md:px-8 md:py-14">
        <div className="w-full max-w-md border border-white/12 bg-black/45 px-6 py-8 shadow-[0_26px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-sm md:px-8 md:py-10">
          <div className="mb-10">
            <p className="section-label mb-2">Join Afínjú</p>
            <h1 className="font-heading text-3xl text-afinju-cream">Create Account</h1>
            <p className="mt-3 font-body text-sm text-afinju-cream/55">
              Create your profile to place orders and track every update.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            {[
              { name: 'displayName', label: 'Full Name', type: 'text', placeholder: 'Your name' },
              { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name} className="space-y-1">
                <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-cream/55">{label}</label>
                <input
                  {...register(name as any)}
                  type={type}
                  placeholder={placeholder}
                  className="w-full bg-transparent border-0 border-b border-afinju-cream/25 pb-3 pt-2 font-sans text-sm text-afinju-cream placeholder:text-afinju-cream/30 focus:outline-none focus:border-gold transition-colors duration-200"
                />
                {(errors as any)[name] && (
                  <p className="font-sans text-xs text-destructive">{(errors as any)[name].message}</p>
                )}
              </div>
            ))}

            <div className="space-y-1">
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-cream/55">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  className="w-full bg-transparent border-0 border-b border-afinju-cream/25 pb-3 pt-2 pr-8 font-sans text-sm text-afinju-cream placeholder:text-afinju-cream/30 focus:outline-none focus:border-gold transition-colors duration-200"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-0 bottom-3 text-afinju-cream/35 hover:text-afinju-cream transition-colors"
                >
                  {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="font-sans text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-cream/55">Confirm Password</label>
              <input
                {...register('confirm')}
                type="password"
                placeholder="Repeat password"
                className="w-full bg-transparent border-0 border-b border-afinju-cream/25 pb-3 pt-2 font-sans text-sm text-afinju-cream placeholder:text-afinju-cream/30 focus:outline-none focus:border-gold transition-colors duration-200"
              />
              {errors.confirm && <p className="font-sans text-xs text-destructive">{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full py-4 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="font-sans text-sm text-afinju-cream/55 text-center mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-afinju-cream hover:text-gold font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
