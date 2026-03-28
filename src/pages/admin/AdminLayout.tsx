import { Outlet, NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, ShoppingBag, Package, Users,
  Settings, Layout, BarChart3, Menu, X, LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/content', label: 'Content', icon: Layout },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen flex bg-[#F8F7F5]">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 bg-afinju-black text-afinju-cream flex flex-col',
        'transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <Link to="/" className="font-display text-sm tracking-[0.25em]">Afínjú</Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-white/5">
          <p className="font-sans text-[10px] text-white/30 tracking-[0.2em] uppercase">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150',
                'font-sans text-xs tracking-[0.1em]',
                isActive
                  ? 'bg-gold/15 text-gold'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              )}
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="font-sans text-xs text-gold">
                {user?.displayName?.[0] || user?.email?.[0] || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-sans text-xs text-white/70 truncate">{user?.displayName || 'Admin'}</p>
              <p className="font-sans text-[10px] text-white/30 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 font-sans text-xs text-white/30 hover:text-white/60 transition-colors w-full"
          >
            <LogOut size={12} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-black/8 flex items-center px-6 justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-afinju-black"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <Link
              to="/"
              className="font-sans text-xs tracking-wider uppercase text-afinju-black/40 hover:text-gold transition-colors"
            >
              View Store
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
