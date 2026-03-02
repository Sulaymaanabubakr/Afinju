import { Link } from 'react-router-dom'
import { BRAND_WHATSAPP } from '@/lib/utils'

export function Footer() {
  const year = new Date().getFullYear()

  const links = {
    Shop: [
      { to: '/shop', label: 'All Products' },
      { to: '/collections/launch-edition', label: 'Launch Edition' },
      { to: '/size-guide', label: 'Size Guide' },
    ],
    Brand: [
      { to: '/about', label: 'Our Story' },
      { to: '/faq', label: 'FAQ' },
      { to: '/contact', label: 'Contact' },
    ],
    Legal: [
      { to: '/terms', label: 'Terms of Service' },
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/shipping-returns', label: 'Shipping & Returns' },
    ],
  }

  return (
    <footer className="bg-afinju-black text-afinju-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="font-display text-2xl tracking-[0.25em] block mb-5">
              AFINJU
            </Link>
            <p className="font-body text-afinju-cream/45 text-base leading-relaxed max-w-xs mb-6">
              The authority set for the man who has decided that his standard is non-negotiable.
            </p>
            <a
              href={`https://wa.me/${BRAND_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.18em] uppercase text-gold/70 hover:text-gold transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-sans text-[10px] tracking-[0.25em] uppercase text-gold/60 mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {items.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="font-body text-sm text-afinju-cream/45 hover:text-afinju-cream transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-afinju-cream/25 tracking-wider">
            © {year} AFINJU. All rights reserved. Made in Nigeria.
          </p>
          <p className="font-body text-xs text-afinju-cream/20 italic">
            Authority is not given. It is worn.
          </p>
        </div>
      </div>
    </footer>
  )
}
