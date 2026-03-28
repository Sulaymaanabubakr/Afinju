import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Menu, X, User, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/lib/store'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { useDismissiblePanel } from '@/hooks/useDismissiblePanel'
import { getStoreSettings } from '@/lib/db'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuShellRef = useRef<HTMLDivElement | null>(null)
  const { itemCount, openCart } = useCartStore()
  const { user } = useAuthStore()
  const location = useLocation()
  const count = itemCount()
  const { data: settings } = useQuery({ queryKey: ['store-settings'], queryFn: getStoreSettings })

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])
  useDismissiblePanel(menuShellRef, menuOpen, () => setMenuOpen(false))

  const navLinks = [
    { to: '/shop', label: 'Shop' },
    { to: '/collections/launch-edition', label: 'Launch Edition' },
    { to: '/about', label: 'Our Story' },
    { to: '/size-guide', label: 'Size Guide' },
  ]

  const announcementEnabled = settings?.announcementEnabled ?? true
  const announcementText = settings?.announcementText || 'Only Ten Men Will Own This Launch Edition · Once It Is Closed, It Is Closed · Afínjú - Authority Set'

  return (
    <>
      {/* Announcement Bar */}
      {announcementEnabled && (
        <div className="bg-afinju-black text-afinju-cream overflow-hidden py-2.5">
          <div className="flex marquee-track">
            {Array.from({ length: 2 }).map((_, i) => (
              <span
                key={i}
                className="flex min-w-full flex-shrink-0 items-center justify-center px-8 text-center font-sans text-xs tracking-[0.25em] uppercase"
              >
                {announcementText}
              </span>
            ))}
          </div>
        </div>
      )}

      <div ref={menuShellRef}>
        <header className={cn(
          'sticky top-0 z-50 transition-all duration-300 border-b border-black/5',
          scrolled ? 'bg-afinju-offwhite/95 backdrop-blur-md shadow-sm' : 'bg-afinju-offwhite'
        )}>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setMenuOpen(v => !v)} className="text-afinju-black">
              {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
          </div>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 hover:opacity-80 transition-opacity duration-300 lg:static lg:translate-x-0">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-black/8 bg-afinju-cream">
              <img src="/logo.png" alt="Afínjú" className="h-10 w-10 object-contain" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-sm font-bold tracking-[0.22em] text-afinju-black">Afínjú</span>
              <span className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-afinju-black/45">Authority Set</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => cn(
                  'font-sans text-xs tracking-[0.18em] uppercase transition-colors duration-200',
                  isActive ? 'text-gold' : 'text-afinju-black/70 hover:text-afinju-black'
                )}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-5">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/account"
                  className="text-afinju-black/70 hover:text-afinju-black transition-colors"
                  aria-label="My account"
                >
                  <User size={18} strokeWidth={1.5} />
                </Link>
                <button onClick={() => supabase.auth.signOut()} className="text-afinju-black/40 hover:text-afinju-black/70 transition-colors">
                  <LogOut size={16} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden lg:block font-sans text-xs tracking-[0.18em] uppercase text-afinju-black/70 hover:text-afinju-black transition-colors">
                Sign In
              </Link>
            )}

            <button onClick={openCart} className="relative text-afinju-black hover:text-gold transition-colors">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-gold text-white rounded-full text-[10px] font-sans font-medium flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            {user ? (
              <Link
                to="/account"
                className="inline-flex h-10 w-10 items-center justify-center text-afinju-black hover:text-gold transition-colors"
                aria-label="My account"
              >
                <User size={20} strokeWidth={1.5} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 w-10 items-center justify-center text-afinju-black hover:text-gold transition-colors"
                aria-label="Sign in"
              >
                <User size={20} strokeWidth={1.5} />
              </Link>
            )}

            <button onClick={openCart} className="relative text-afinju-black hover:text-gold transition-colors">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-gold text-white rounded-full text-[10px] font-sans font-medium flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
          </div>
        </header>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-x-0 top-[84px] z-40 bg-afinju-offwhite border-b border-black/10 shadow-xl"
            >
              <nav className="flex flex-col px-6 py-8 gap-6">
                {navLinks.map(({ to, label }) => (
                  <NavLink key={to} to={to}
                    className={({ isActive }) => cn(
                      'font-sans text-sm tracking-[0.2em] uppercase pb-3 border-b border-black/8',
                      isActive ? 'text-gold' : 'text-afinju-black'
                    )}
                  >
                    {label}
                  </NavLink>
                ))}
                {user ? (
                  <>
                    <Link to="/account" className="font-sans text-sm tracking-[0.2em] uppercase text-afinju-black/70">My Account</Link>
                    <button onClick={() => supabase.auth.signOut()} className="font-sans text-sm tracking-[0.2em] uppercase text-left text-afinju-black/40">Sign Out</button>
                  </>
                ) : (
                  <Link to="/login" className="font-sans text-sm tracking-[0.2em] uppercase text-afinju-black">Sign In / Register</Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
