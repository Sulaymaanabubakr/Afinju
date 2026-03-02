import { useState } from 'react'
import { MessageCircle, Phone, Mail } from 'lucide-react'
import { helpWhatsappLink, BRAND_WHATSAPP } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, open WhatsApp with the message
    const msg = `Hello AFINJU, my name is ${form.name}. ${form.message}`
    window.open(`https://wa.me/${BRAND_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank')
    setSent(true)
    toast.success('Opening WhatsApp with your message.')
  }

  return (
    <div className="min-h-screen">
      <section className="bg-afinju-black text-afinju-cream py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="section-label text-gold/70 mb-4">Reach Us</p>
          <h1 className="font-heading text-5xl mb-6">Contact</h1>
          <div className="gold-rule-left" />
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Contact Info */}
          <div className="space-y-10">
            <div>
              <p className="section-label mb-4">Get In Touch</p>
              <p className="font-body text-lg text-afinju-black/65 leading-relaxed">
                For sizing questions, order enquiries, or anything else — we are available and responsive.
                WhatsApp is the fastest way to reach us.
              </p>
            </div>

            <div className="space-y-6">
              <a
                href={`https://wa.me/${BRAND_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-5 p-5 border border-black/8 hover:border-green-500/40 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-50 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="text-green-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-sans text-sm font-medium">WhatsApp (Preferred)</p>
                  <p className="font-sans text-xs text-afinju-black/50">+234 707 186 1932</p>
                </div>
              </a>

              <a
                href={`tel:+${BRAND_WHATSAPP}`}
                className="flex items-center gap-5 p-5 border border-black/8 hover:border-gold/40 transition-colors"
              >
                <div className="w-10 h-10 bg-afinju-cream flex items-center justify-center flex-shrink-0">
                  <Phone size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-sans text-sm font-medium">Phone</p>
                  <p className="font-sans text-xs text-afinju-black/50">+234 707 186 1932</p>
                </div>
              </a>
            </div>

            <div className="border-t border-black/8 pt-8">
              <p className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/40 mb-3">Response Time</p>
              <p className="font-body text-afinju-black/65">
                We respond to all messages within 2 hours during business hours (8am–9pm WAT, Monday–Saturday).
              </p>
            </div>
          </div>

          {/* Form */}
          <div>
            <p className="section-label mb-6">Send a Message</p>
            {sent ? (
              <div className="p-8 bg-afinju-cream text-center">
                <p className="font-heading text-xl mb-2">Message Sent</p>
                <p className="font-body text-afinju-black/60">Your WhatsApp message has been prepared. We will respond shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7">
                {[
                  { key: 'name', label: 'Your Name', placeholder: 'Enter your name', type: 'text' },
                  { key: 'email', label: 'Email (Optional)', placeholder: 'you@example.com', type: 'email' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key} className="space-y-1">
                    <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="input-luxury"
                      required={key === 'name'}
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={5}
                    placeholder="How can we help?"
                    className="input-luxury resize-none w-full"
                    required
                  />
                </div>
                <button type="submit" className="btn-luxury w-full py-4 flex items-center justify-center gap-2">
                  <MessageCircle size={14} strokeWidth={2} />
                  Send via WhatsApp
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
