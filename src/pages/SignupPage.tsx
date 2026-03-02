import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
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
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      await updateProfile(cred.user, { displayName: data.displayName })
      toast.success('Account created. Welcome to AFINJU.')
      navigate('/account')
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email already in use. Try signing in.'
        : 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col bg-afinju-black text-afinju-cream p-16 justify-between">
        <Link to="/" className="font-display text-xl tracking-[0.3em]">AFINJU</Link>
        <div className="max-w-sm">
          <p className="font-heading text-3xl italic text-gold/80 mb-6">
            "Only ten men will own this launch edition."
          </p>
          <div className="gold-rule-left mb-6" />
          <p className="font-body text-afinju-cream/50">
            Create your account. Secure your position. Claim the authority set.
          </p>
        </div>
        <p className="font-sans text-xs text-afinju-cream/20 tracking-wider">© 2024 AFINJU</p>
      </div>

      <div className="flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="section-label mb-2">Join AFINJU</p>
            <h1 className="font-heading text-3xl">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            {[
              { name: 'displayName', label: 'Full Name', type: 'text', placeholder: 'Your name' },
              { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name} className="space-y-1">
                <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">{label}</label>
                <input
                  {...register(name as any)}
                  type={type}
                  placeholder={placeholder}
                  className="input-luxury"
                />
                {(errors as any)[name] && (
                  <p className="font-sans text-xs text-destructive">{(errors as any)[name].message}</p>
                )}
              </div>
            ))}

            <div className="space-y-1">
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  className="input-luxury pr-8"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-0 bottom-3 text-afinju-black/30 hover:text-afinju-black"
                >
                  {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="font-sans text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">Confirm Password</label>
              <input
                {...register('confirm')}
                type="password"
                placeholder="Repeat password"
                className="input-luxury"
              />
              {errors.confirm && <p className="font-sans text-xs text-destructive">{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-luxury w-full py-4 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="font-sans text-sm text-afinju-black/50 text-center mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-afinju-black hover:text-gold font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
