import { useAuthStore } from '@/store/auth'
import { Link } from 'react-router-dom'
import { Package, User, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AccountPage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <p className="section-label mb-2">My Account</p>
          <h1 className="font-heading text-4xl">
            Welcome{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}.
          </h1>
        </div>

        <div className="space-y-3">
          <Link
            to="/account/orders"
            className="flex items-center justify-between p-6 bg-white border border-black/8 hover:border-gold/40 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-afinju-cream">
                <Package size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-heading text-base">My Orders</p>
                <p className="font-sans text-xs text-afinju-black/50">Track and manage your purchases</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-afinju-black/30 group-hover:text-gold transition-colors" />
          </Link>

          <div className="flex items-center justify-between p-6 bg-white border border-black/8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-afinju-cream">
                <User size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-heading text-base">{user?.displayName || 'Account'}</p>
                <p className="font-sans text-xs text-afinju-black/50">{user?.email || user?.phone || 'No email on file'}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-12 font-sans text-xs tracking-[0.18em] uppercase text-afinju-black/30 hover:text-afinju-black transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
