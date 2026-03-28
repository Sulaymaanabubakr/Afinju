import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      setSent(true)
    } catch {
      toast.error('Failed to send reset email. Check the address and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-xl tracking-[0.3em] block mb-12">Afínjú</Link>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-heading text-2xl mb-2">Check Your Inbox</h2>
              <p className="font-sans text-sm text-afinju-black/50">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
            <Link to="/login" className="btn-luxury inline-block">Return to Sign In</Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <p className="section-label mb-2">Account Recovery</p>
              <h1 className="font-heading text-3xl">Forgot Password?</h1>
              <p className="font-sans text-sm text-afinju-black/50 mt-3">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-1">
                <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-luxury"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-luxury w-full py-4 disabled:opacity-60">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="font-sans text-sm text-center mt-8">
              <Link to="/login" className="text-afinju-black/50 hover:text-gold transition-colors">
                ← Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
