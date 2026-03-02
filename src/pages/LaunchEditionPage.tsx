import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { getProducts } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import ScarcityCounter from '@/components/shared/ScarcityCounter'

const PACKAGE_ITEMS = [
  { name: 'Pure Skin Leather Half Shoe', desc: 'Hand-crafted from premium Nigerian leather, bevelled edges, mirror finish' },
  { name: 'Matching Premium Purse', desc: 'Coordinated to the millimetre — same leather, same tone, same authority' },
  { name: 'Matching Gobi Cap', desc: 'The finishing touch. The signature of a man who notices everything' },
  { name: 'Signature Oil Perfume', desc: 'A scent that announces your arrival before you speak' },
  { name: 'Matching Polish Kit', desc: 'Maintain your investment. Your standards should never dip' },
  { name: 'Luxury Black Packaging Box', desc: 'A statement before you even open it. Gifting yourself is an act of authority' },
]

const AUTHORITY_COPY = [
  {
    number: '01',
    title: 'Attention is Currency',
    body: 'The moment you enter a room in AFINJU, the conversation changes. People notice. They wonder. That is not an accident. That is the design.',
  },
  {
    number: '02',
    title: 'No Assumptions Here',
    body: 'This is not for everyone. Either you understand what presence means — or you will remain comfortable. We are not trying to convince you.',
  },
  {
    number: '03',
    title: 'Cheap is the Real Waste',
    body: 'You spend on cheap things, replace them endlessly, and arrive nowhere. AFINJU is an investment with a permanent return: respect.',
  },
  {
    number: '04',
    title: 'Elevation is a Choice',
    body: 'The men who own rooms do not wait to be invited. They elevate their standard, and the world adjusts. AFINJU is that choice made visible.',
  },
  {
    number: '05',
    title: 'Confidence Wears Well',
    body: 'True confidence is not loud. It is the cut of your leather, the match of your accessories, the scent that stays after you leave.',
  },
  {
    number: '06',
    title: 'Premium is a Standard',
    body: 'Mediocrity is always available. So is excellence. The difference is the man who decides his floor is higher than most men\'s ceiling.',
  },
]

export default function LaunchEditionPage() {
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const product = products?.[0]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-afinju-black text-afinju-cream overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #C9A84C 0%, transparent 60%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-32 lg:py-44">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="scarcity-pill mb-8">
              Launch Edition — 10 Units Only
            </div>
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-8">
              AFINJU is not for you if you cannot handle{' '}
              <span className="text-gold italic">attention.</span>
            </h1>
            <div className="gold-rule-left mb-8" />
            <p className="font-body text-afinju-cream/60 text-xl mb-12 max-w-xl">
              The authority set for the man who has decided that his standard is non-negotiable.
              Once it is closed, it is closed.
            </p>
            {product && (
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  to={`/product/${product.slug}`}
                  className="btn-gold text-sm py-4 px-10"
                >
                  Claim Your Position — {formatPrice(product.price)}
                </Link>
                <div className="text-afinju-cream/40 text-sm font-sans line-through">
                  {formatPrice(product.compareAtPrice)}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Scarcity Counter */}
      {product && (
        <section className="bg-afinju-cream border-y border-black/8 py-10 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <ScarcityCounter
              limit={product.inventory.launchEditionLimit}
              sold={product.inventory.soldCount}
              large
            />
          </div>
        </section>
      )}

      {/* What's In The Box */}
      <section className="py-28 px-6 bg-afinju-offwhite">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label">The Complete Authority Set</p>
            <h2 className="font-heading text-4xl md:text-5xl mb-4">Six Pieces. One Standard.</h2>
            <div className="gold-rule mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-black/8">
            {PACKAGE_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-afinju-offwhite p-10 group hover:bg-afinju-cream transition-colors duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 border border-gold/40 flex items-center justify-center mt-1">
                    <Check size={14} className="text-gold" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl mb-2">{item.name}</h3>
                    <p className="font-body text-afinju-black/55 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Authority Copy Sections */}
      <section className="bg-afinju-black text-afinju-cream py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label text-gold/60">The Philosophy</p>
            <h2 className="font-heading text-4xl md:text-5xl text-afinju-cream">Why AFINJU</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {AUTHORITY_COPY.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="border-t border-white/10 pt-8"
              >
                <p className="font-display text-gold text-xs tracking-[0.3em] mb-4">{section.number}</p>
                <h3 className="font-heading text-2xl text-afinju-cream mb-4">{section.title}</h3>
                <p className="font-body text-afinju-cream/50 leading-relaxed">{section.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-28 px-6 bg-afinju-cream">
        <div className="max-w-3xl mx-auto text-center">
          <p className="section-label mb-6">For Those Who Qualify</p>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-8 leading-tight">
            Welcome. You are <span className="text-gold italic">AFINJU.</span>
          </h2>
          <div className="gold-rule mx-auto mb-8" />
          <p className="font-body text-xl text-afinju-black/65 mb-4 leading-relaxed">
            If you have read this far, you already know. You have not been looking for permission.
            You have been waiting for something worthy of your standards.
          </p>
          <p className="font-body text-xl text-afinju-black/65 mb-12 leading-relaxed">
            This is it. Only 10 men will own this launch edition.
            Will you be one of them?
          </p>
          {product && (
            <Link
              to={`/product/${product.slug}`}
              className="btn-luxury inline-flex items-center gap-3 text-sm py-5 px-12"
            >
              Secure Your Position
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
          )}
          <p className="font-sans text-xs tracking-wider text-afinju-black/30 mt-6 uppercase">
            Once it is closed, it is closed.
          </p>
        </div>
      </section>
    </div>
  )
}
