import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Menu, X, User, LogOut } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useCartStore } from '@/lib/store'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { itemCount, openCart } = useCartStore()
  const { user, isAdmin } = useAuthStore()
  const location = useLocation()
  const count = itemCount()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const navLinks = [
    { to: '/shop', label: 'Shop' },
    { to: '/collections/launch-edition', label: 'Launch Edition' },
    { to: '/about', label: 'Our Story' },
    { to: '/size-guide', label: 'Size Guide' },
  ]

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-afinju-black text-afinju-cream overflow-hidden py-2.5">
        <div className="flex marquee-track">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex-shrink-0 px-12 font-sans text-xs tracking-[0.25em] uppercase">
              Only Ten Men Will Own This Launch Edition &nbsp;·&nbsp; Once It Is Closed, It Is Closed &nbsp;·&nbsp; AFINJU — Authority Set &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      <header className={cn(
        'sticky top-0 z-50 transition-all duration-300 border-b border-black/5',
        scrolled ? 'bg-afinju-offwhite/95 backdrop-blur-md shadow-sm' : 'bg-afinju-offwhite'
      )}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link to="/" className="font-display text-xl tracking-[0.3em] text-afinju-black hover:text-gold transition-colors duration-300">
            AFINJU
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

          <div className="flex items-center gap-5">
            {user ? (
              <div className="hidden lg:flex items-center gap-4">
                {isAdmin() && (
                  <Link to="/admin" className="font-sans text-xs tracking-[0.18em] uppercase text-gold hover:text-gold-dark transition-colors">
                    Admin
                  </Link>
                )}
                <Link to="/account" className="text-afinju-black/70 hover:text-afinju-black transition-colors">
                  <User size={18} strokeWidth={1.5} />
                </Link>
                <button onClick={() => signOut(auth)} className="text-afinju-black/40 hover:text-afinju-black/70 transition-colors">
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

            <button onClick={() => setMenuOpen(v => !v)} className="lg:hidden text-afinju-black">
              {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
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
                  {isAdmin() && <Link to="/admin" className="font-sans text-sm tracking-[0.2em] uppercase text-gold">Admin Dashboard</Link>}
                  <button onClick={() => signOut(auth)} className="font-sans text-sm tracking-[0.2em] uppercase text-left text-afinju-black/40">Sign Out</button>
                </>
              ) : (
                <Link to="/login" className="font-sans text-sm tracking-[0.2em] uppercase text-afinju-black">Sign In / Register</Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
