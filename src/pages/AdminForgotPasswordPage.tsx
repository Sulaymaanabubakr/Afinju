import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminForgotPasswordPage() {
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
    <div className="min-h-screen bg-[#0B0D10] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/admin/login" className="font-display text-xl tracking-[0.3em] block mb-12 text-white/90">
          Afínjú OPS
        </Link>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-300" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-heading text-2xl mb-2">Check Your Inbox</h2>
              <p className="font-sans text-sm text-white/55">
                Password reset link sent to <strong>{email}</strong>
              </p>
            </div>
            <Link to="/admin/login" className="inline-block py-3 px-6 bg-gold text-black font-sans text-xs tracking-[0.18em] uppercase">
              Return To Admin Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <p className="font-sans text-xs tracking-[0.15em] uppercase text-gold mb-2">Admin Recovery</p>
              <h1 className="font-heading text-3xl">Reset Password</h1>
              <p className="font-sans text-sm text-white/55 mt-3">
                Enter your provisioned admin/staff email to receive a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-1">
                <label className="font-sans text-xs tracking-[0.15em] uppercase text-white/60">
                  Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 font-sans text-sm placeholder:text-white/30 focus:ring-0 focus:border-gold transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gold text-black font-sans text-xs tracking-[0.2em] uppercase disabled:opacity-60 transition-opacity"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="font-sans text-xs text-white/40 text-center mt-8">
              Admin accounts are provisioned by internal setup only.
            </p>
            <p className="font-sans text-sm text-center mt-2">
              <Link to="/admin/login" className="text-white/60 hover:text-gold transition-colors">
                ← Back to Admin Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
