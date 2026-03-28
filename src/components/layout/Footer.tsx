import { Link } from 'react-router-dom'
import { BRAND_WHATSAPP } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getStoreSettings } from '@/lib/db'

export function Footer() {
  const year = new Date().getFullYear()
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: getStoreSettings,
  })

  const cleanWhatsAppNumber = (settings?.whatsappNumber || BRAND_WHATSAPP).replace(/[^\d]/g, '')
  const whatsappUrl = settings?.whatsappUrl || `https://wa.me/${cleanWhatsAppNumber}`
  const supportEmail = settings?.supportEmail || ''
  const footerTagline = 'The authority set for the man who has decided that his standard is non-negotiable.'
  const socialLinks = [
    { name: 'Instagram', href: settings?.instagramUrl || '', icon: 'instagram' },
    { name: 'X', href: settings?.twitterUrl || '', icon: 'x' },
    { name: 'Facebook', href: settings?.facebookUrl || '', icon: 'facebook' },
    { name: 'WhatsApp', href: whatsappUrl, icon: 'whatsapp' },
    { name: 'TikTok', href: settings?.tiktokUrl || '', icon: 'tiktok' },
  ] as const

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16 items-start">
          {/* Brand */}
          <div className="md:col-span-2 flex flex-col items-center">
            <Link to="/" className="inline-flex items-center gap-4 mb-5">
              <img src="/logo.png" alt="Afínjú" className="h-14 w-14 rounded-2xl object-cover" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-sm font-bold tracking-[0.22em] text-afinju-cream">Afínjú</span>
                <span className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-afinju-cream/45">Authority Set</span>
              </span>
            </Link>
            <p className="font-body text-afinju-cream/45 text-base leading-relaxed max-w-xs mb-6">
              {footerTagline}
            </p>
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="mb-6 font-sans text-xs tracking-[0.18em] uppercase text-gold/70 hover:text-gold transition-colors"
              >
                {supportEmail}
              </a>
            )}
            <div className="flex items-center gap-3">
              {socialLinks.map((item) => (
                item.href ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.name}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 text-gold/75 hover:text-gold hover:border-gold transition-colors"
                  >
                    {item.icon === 'instagram' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="18" height="18" rx="5" />
                        <circle cx="12" cy="12" r="4.2" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    )}
                    {item.icon === 'x' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.9 2H22l-6.77 7.74L23 22h-6.08l-4.76-6.21L6.74 22H3.63l7.24-8.28L1 2h6.24l4.3 5.67L18.9 2zm-1.07 18h1.69L6.3 3.9H4.48L17.83 20z" />
                      </svg>
                    )}
                    {item.icon === 'facebook' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.5 8.5V6.8c0-.8.5-1.3 1.3-1.3H16V2.2c-.5-.1-1.6-.2-2.9-.2-3 0-4.9 1.8-4.9 5.2v1.3H5v3.8h3.3V22h4.1v-9.7h3.3l.5-3.8h-3.8z" />
                      </svg>
                    )}
                    {item.icon === 'whatsapp' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    )}
                    {item.icon === 'tiktok' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.5 3c.3 2.2 1.6 3.8 3.8 4.1v2.8c-1.4 0-2.7-.4-3.8-1.1v5.6c0 3.4-2.3 5.6-5.5 5.6-3 0-5.5-2.2-5.5-5.4 0-3.2 2.5-5.5 5.8-5.5.3 0 .6 0 .9.1V12c-.3-.1-.6-.1-.9-.1-1.7 0-3 1.1-3 2.8 0 1.6 1.2 2.7 2.8 2.7 1.7 0 2.8-1.1 2.8-3V3h2.8z" />
                      </svg>
                    )}
                  </a>
                ) : (
                  <span
                    key={item.name}
                    aria-label={`${item.name} (not configured)`}
                    title={`${item.name} link not set`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/25"
                  >
                    {item.icon === 'instagram' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="18" height="18" rx="5" />
                        <circle cx="12" cy="12" r="4.2" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    )}
                    {item.icon === 'x' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.9 2H22l-6.77 7.74L23 22h-6.08l-4.76-6.21L6.74 22H3.63l7.24-8.28L1 2h6.24l4.3 5.67L18.9 2zm-1.07 18h1.69L6.3 3.9H4.48L17.83 20z" />
                      </svg>
                    )}
                    {item.icon === 'facebook' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.5 8.5V6.8c0-.8.5-1.3 1.3-1.3H16V2.2c-.5-.1-1.6-.2-2.9-.2-3 0-4.9 1.8-4.9 5.2v1.3H5v3.8h3.3V22h4.1v-9.7h3.3l.5-3.8h-3.8z" />
                      </svg>
                    )}
                    {item.icon === 'whatsapp' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    )}
                    {item.icon === 'tiktok' && (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.5 3c.3 2.2 1.6 3.8 3.8 4.1v2.8c-1.4 0-2.7-.4-3.8-1.1v5.6c0 3.4-2.3 5.6-5.5 5.6-3 0-5.5-2.2-5.5-5.4 0-3.2 2.5-5.5 5.8-5.5.3 0 .6 0 .9.1V12c-.3-.1-.6-.1-.9-.1-1.7 0-3 1.1-3 2.8 0 1.6 1.2 2.7 2.8 2.7 1.7 0 2.8-1.1 2.8-3V3h2.8z" />
                      </svg>
                    )}
                  </span>
                )
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title} className="flex flex-col items-center">
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
        <div className="border-t border-white/8 pt-8 flex flex-col items-center gap-4">
          <p className="font-sans text-xs text-afinju-cream/25 tracking-wider">
            © {year} Afínjú. All rights reserved. Made in Nigeria.
          </p>
          <p className="font-body text-xs text-afinju-cream/20 italic">
            Authority is not given. It is worn.
          </p>
        </div>
      </div>
    </footer>
  )
}
