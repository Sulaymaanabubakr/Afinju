import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    category: 'Ordering',
    items: [
      { q: 'How do I order the AFINJU Authority Set?', a: 'Click "Secure Your Position" on the product page. Select your colour, shoe size, and head size. All three are required before you can add to cart. Complete checkout with Paystack (card, bank transfer, or USSD). You will receive an order confirmation immediately.' },
      { q: 'Can I place an order via WhatsApp?', a: 'WhatsApp is available for size consultations and enquiries, but all purchases are processed through our secure checkout powered by Paystack. This ensures your payment is protected and your order is properly tracked.' },
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
      { q: 'What is your returns policy?', a: 'Because each AFINJU set is custom-made to your specifications (colour, shoe size, head size), we do not accept returns based on change of mind. If your item arrives damaged or does not match your order specifications, contact us within 48 hours of delivery and we will resolve it immediately.' },
      { q: 'How do I know my AFINJU set is authentic?', a: 'Every AFINJU Authority Set comes in a sealed luxury black box with an authentication card and order number. Your order will always be traceable from purchase through to delivery in your account dashboard. If you have concerns about an item\'s authenticity, contact us immediately.' },
      { q: 'What if my payment was deducted but I received no confirmation?', a: 'Do not panic. All payments are verified server-side through Paystack. If your payment cleared but you received no confirmation, log into your account to check your order status, or contact us via WhatsApp with your payment reference number and we will resolve it within 1 hour.' },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/8 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-6 py-5 text-left group"
      >
        <span className="font-heading text-lg group-hover:text-gold transition-colors duration-200">{q}</span>
        <span className="flex-shrink-0 mt-1 text-gold">
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
            <p className="font-body text-base text-afinju-black/65 pb-6 leading-relaxed">{a}</p>
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
        <div className="max-w-3xl mx-auto text-center">
          <p className="section-label text-gold/70 mb-4">Got Questions?</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-[0.1em] mb-6">FAQ</h1>
          <div className="gold-rule mx-auto" />
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          {FAQS.map((cat) => (
            <div key={cat.category}>
              <p className="section-label mb-6 text-center">{cat.category}</p>
              <div>
                {cat.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
