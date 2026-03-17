import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { getProducts } from '@/lib/db'
import ScarcityCounter from '@/components/shared/ScarcityCounter'

const PACKAGE_ITEMS = [
  { name: 'Pure Skin Leather/Suede Half Shoe', desc: '(Black, Brown, Red and Blue)' },
  { name: 'Matching Premium Leather Purse', desc: '(Black, Brown, Red and Blue)' },
  { name: 'Matching Gobi Cap', desc: '(Black, Brown, Red and Blue)' },
  { name: 'Signature Oil Perfume', desc: 'A scent that announces your arrival before you speak' },
  { name: 'Luxury Black Packaging Box', desc: 'A statement before you even open it. Gifting yourself is an act of authority' },
]

const AUTHORITY_COPY = [
  {
    number: '01',
    title: 'If You Cannot Stand Public Attention.',
    body: 'When you step out in this half shoe, matching purse and Gobi cap, you will not blend in. You will command space. Eyes will follow you. Conversations will pause. If you prefer to enter quietly and leave unnoticed, this is not your package. Afínjú does not whisper. It announces.',
  },
  {
    number: '02',
    title: 'If You Prefer To Go Unnoticed.',
    body: 'This set is built for visible occasions. It draws compliments, attention, and questions. If you prefer a quieter presence, it will feel like too much. If that makes you uncomfortable, keep your money.',
  },
  {
    number: '03',
    title: 'If You Cannot Handle Assumptions.',
    body: 'Afínjú comes with a professionally formulated signature oil perfume. It is designed to be noticed. When you enter a room, your presence arrives before you speak. If you are not ready for that level of attention, Afínjú is not for you.',
  },
  {
    number: '04',
    title: 'If You Still Think Cheap Is Smart.',
    body: 'This is not a market purchase. This is identity, finish, and positioning. If you measure value only by price instead of presentation, Afínjú is not for you.',
  },
  {
    number: '05',
    title: 'If You Are Afraid Of Elevation.',
    body: 'This combination changes perception. People respond differently when a look feels complete. If you are not ready for that shift, Afínjú is not for you.',
  },
  {
    number: '06',
    title: 'If You Lack Confidence',
    body: 'This package amplifies who you are. If you are unsure of yourself, it will expose it. Afínjú is bold and it amplifies presence. If you are not ready to carry that confidence, it is not for you.',
  },
]

export default function LaunchEditionPage() {
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const product = products?.find(p => p.id === 'afinju-authority-set-launch-v1') || products?.[0]

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
            className="max-w-3xl mx-auto text-center"
          >
            <div className="scarcity-pill mb-8">
              Launch Edition - 10 Units Only
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-8">
              Afínjú is not for{' '}
              <span className="text-gold italic">everybody!</span>
            </h1>
            <div className="gold-rule mx-auto mb-8" />
            <p className="font-body text-afinju-cream/60 text-xl mb-12 max-w-xl mx-auto">
              If You Fall Into Any Of These 6 Categories, AFINJU is absolutely NOT FOR YOU!
            </p>
            {product && (
              <div className="flex flex-wrap items-center gap-6 justify-center">
                <Link
                  to={`/product/${product.slug}`}
                  className="btn-gold text-sm py-4 px-10"
                >
                  Claim Your Position
                </Link>
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
            <h2 className="font-heading text-4xl md:text-5xl mb-4">What does Afínjú package contain?</h2>
            <div className="gold-rule mx-auto" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-black/8">
            {PACKAGE_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-afinju-offwhite p-5 md:p-10 group hover:bg-afinju-cream transition-colors duration-300"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 border border-gold/40 flex items-center justify-center mt-1">
                    <Check size={14} className="text-gold" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-heading text-base md:text-xl mb-2 leading-snug">{item.name}</h3>
                    <p className="font-body text-sm md:text-base text-afinju-black/55 leading-relaxed">{item.desc}</p>
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
            <p className="section-label text-gold/60">The Filter</p>
            <h2 className="font-heading text-4xl md:text-5xl text-afinju-cream">PLEASE KEEP YOUR MONEY!</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
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
                <h3 className="font-heading text-lg md:text-2xl text-afinju-cream mb-4">{section.title}</h3>
                <p className="font-body text-sm md:text-base text-afinju-cream/50 leading-relaxed">{section.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-28 px-6 bg-afinju-cream">
        <div className="max-w-3xl mx-auto text-center">
          <p className="section-label mb-6">For Those Who Qualify</p>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-5xl mb-8 leading-tight">
            Welcome to the <span className="text-gold italic block mt-2">Afínjú Men's Club.</span>
          </h2>
          <div className="gold-rule mx-auto mb-8" />
          <p className="font-body text-xl text-afinju-black/65 mb-4 leading-relaxed">
            If you have passed these six categories, then congratulations. Every piece was designed for one outcome: impact.
          </p>
          <p className="font-body text-xl text-afinju-black/65 mb-12 leading-relaxed">
            When you step out in Afínjú, you do not blend in. You command space. Eyes follow you. Conversations slow down.
          </p>
          <div className="max-w-xl mx-auto mb-10 border border-gold/20 bg-white/40 px-6 py-6">
            <p className="font-sans text-[10px] tracking-[0.24em] uppercase text-gold-dark">
              Launch Details
            </p>
            <p className="mt-4 font-body text-base text-afinju-black/70 leading-relaxed">
              Only for the first ten men to order. Includes free delivery within 2 to 5 days.
            </p>
            <a
              href="https://wa.me/2347071861932"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-5 items-center justify-center border border-gold/30 px-6 py-3 font-sans text-xs tracking-[0.16em] uppercase text-gold-dark transition-colors hover:border-gold-dark hover:text-gold-dark"
            >
              Send sizing details on WhatsApp
            </a>
          </div>
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
