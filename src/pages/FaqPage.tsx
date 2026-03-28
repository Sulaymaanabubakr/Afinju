import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQS = [
  {
    category: 'Ordering',
    items: [
      { q: 'How do I order the Afínjú Authority Set?', a: 'Click "Secure Your Position" on the product page. Select your colour, shoe size, and head size. All three are required before you can add to cart. Complete checkout with Flutterwave (card, bank transfer, or USSD). You will receive an order confirmation immediately.' },
      { q: 'Can I place an order via WhatsApp?', a: 'WhatsApp is available for size consultations and enquiries, but all purchases are processed through our secure checkout powered by Flutterwave. This ensures your payment is protected and your order is properly tracked.' },
      { q: 'Is the launch price permanent?', a: 'No. The current launch price is exclusive to this first edition of 10 units. Once all 10 launch units are claimed, pricing will increase for any future editions, if there are any.' },
    ],
  },
  {
    category: 'Sizing',
    items: [
      { q: 'How do I measure my shoe size?', a: 'We use EU sizing. Trace your foot on a flat surface, measure the length in centimetres, and use our size guide to convert. If you are between sizes, we recommend sizing up. Visit the Size Guide page for a detailed chart.' },
      { q: 'How do I measure my head size for the Gobi cap?', a: 'Use a soft tape measure and wrap it around your head approximately 1cm above your ears and across your forehead, where you would normally wear a hat. Our size guide shows the exact technique with visual reference.' },
      { q: 'What if my size is not available?', a: 'Our shoe sizes run from 38 to 47 EU and head sizes from 54cm to 63cm. If your size falls outside this range, please contact us via WhatsApp and we will advise on custom options for future editions.' },
    ],
  },
  {
    category: 'Delivery',
    items: [
      { q: 'Where do you deliver?', a: 'We deliver nationwide across all 36 states and the FCT. Delivery timelines vary by location. Lagos and Abuja typically receive orders within 3–5 business days. Other states may take 5–8 business days.' },
      { q: 'What is the shipping fee?', a: 'Flat-rate shipping of ₦5,000 applies to all orders nationwide. This covers insurance and careful handling of your luxury packaging.' },
      { q: 'How will I know my order has been shipped?', a: 'You will receive a status update on your account dashboard when your order is dispatched. We will also include a tracking reference in your status update note where applicable. You can also reach us via WhatsApp for a real-time update.' },
    ],
  },
  {
    category: 'Returns & Authenticity',
    items: [
      { q: 'What is your returns policy?', a: 'Because each Afínjú set is custom-made to your specifications (colour, shoe size, head size), we do not accept returns based on change of mind. If your item arrives damaged or does not match your order specifications, contact us within 48 hours of delivery and we will resolve it immediately.' },
      { q: 'How do I know my Afínjú set is authentic?', a: 'Every Afínjú Authority Set comes in a sealed luxury black box with an authentication card and order number. Your order will always be traceable from purchase through to delivery in your account dashboard. If you have concerns about an item\'s authenticity, contact us immediately.' },
      { q: 'What if my payment was deducted but I received no confirmation?', a: 'Do not panic. All payments are verified server-side through Flutterwave. If your payment cleared but you received no confirmation, log into your account to check your order status, or contact us via WhatsApp with your payment reference number and we will resolve it within 1 hour.' },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/10 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="group flex w-full flex-col items-center justify-center gap-3 py-5 text-center"
      >
        <span className="font-heading text-lg leading-snug text-afinju-black group-hover:text-gold-dark transition-colors duration-200">
          {q}
        </span>
        <span className="flex-shrink-0 text-gold-dark">
          {open ? <Minus size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-6 font-body text-base leading-relaxed text-afinju-black/65">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-afinju-black text-afinju-cream py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="section-label text-gold/70 mb-4">Got Questions?</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-[0.1em] mb-6">FAQ</h1>
          <div className="gold-rule mx-auto mb-6" />
          <p className="max-w-2xl mx-auto font-body text-lg leading-relaxed text-afinju-cream/60">
            Everything buyers usually ask before ordering, from sizing and delivery to payment and authenticity.
          </p>
        </div>
      </section>

      <section className="bg-afinju-offwhite py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 border-y border-black/8 py-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="section-label mb-4">Before You Order</p>
              <h2 className="font-heading text-3xl md:text-4xl leading-tight text-afinju-black max-w-2xl">
                Most questions come down to fit, delivery, and how the launch edition works.
              </h2>
              <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-afinju-black/62">
                Start with sizing if you are unsure of your measurements. Once that is clear, the rest of the process is straightforward.
              </p>
            </div>
            <div className="border border-black/10 bg-white/70 p-6 flex flex-col items-center">
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-gold-dark mb-3">
                Need direct help?
              </p>
              <p className="font-body text-sm leading-relaxed text-afinju-black/65">
                Use the size guide for measurements or message us on WhatsApp if you need help before checking out.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link to="/size-guide" className="border border-black/12 px-4 py-3 font-sans text-[11px] uppercase tracking-[0.18em] text-afinju-black transition-colors hover:border-gold hover:text-gold-dark">
                  Size Guide
                </Link>
                <Link to="/contact" className="border border-gold/30 px-4 py-3 font-sans text-[11px] uppercase tracking-[0.18em] text-gold-dark transition-colors hover:border-gold-dark">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {FAQS.map((cat) => (
              <a
                key={cat.category}
                href={`#${cat.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="border border-black/10 bg-white/70 px-4 py-3 font-sans text-[11px] uppercase tracking-[0.18em] text-afinju-black/75 transition-colors hover:border-gold hover:text-gold-dark"
              >
                {cat.category}
              </a>
            ))}
          </div>

          <div className="mt-12 space-y-8">
            {FAQS.map((cat, index) => (
              <section
                key={cat.category}
                id={cat.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                className="grid gap-6 border-t border-black/10 pt-8 lg:grid-cols-[0.28fr_0.72fr]"
              >
                <div className="lg:pr-8">
                  <p className="font-display text-xs tracking-[0.3em] text-gold-dark mb-3">0{index + 1}</p>
                  <h3 className="font-heading text-2xl md:text-3xl text-afinju-black leading-tight">
                    {cat.category}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-afinju-black/55">
                    {cat.category === 'Ordering' && 'How to buy, how payment works, and what the launch offer means.'}
                    {cat.category === 'Sizing' && 'Everything related to fit, measurements, and what to do if you are unsure.'}
                    {cat.category === 'Delivery' && 'Where we deliver, how long it takes, and what to expect after purchase.'}
                    {cat.category === 'Returns & Authenticity' && 'Policies, verification, and what happens if something goes wrong.'}
                  </p>
                </div>

                <div className="border border-black/10 bg-white/75 px-6 md:px-8">
                  {cat.items.map((item) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
