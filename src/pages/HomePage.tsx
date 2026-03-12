import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import ScarcityCounter from '@/components/shared/ScarcityCounter'
import { formatPrice } from '@/lib/utils'
import { getProducts } from '@/lib/db'

// Product images — replace with actual Cloudinary product photos when available
const HERO_IMAGE = 'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=1200&q=90'
const LEATHER_IMAGE = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=90'

const PACKAGE_ITEMS = [
  { name: 'Pure Skin Leather Half Shoe', desc: '(Black, Brown, Red and Blue)' },
  { name: 'Matching Premium Leather Purse', desc: '(Black, Brown, Red and Blue)' },
  { name: 'Matching Gobi Cap', desc: '(Black, Brown, Red and Blue)' },
  { name: 'Signature Oil Perfume', desc: 'A scent that announces your arrival' },
  { name: 'Luxury Black Packaging Box', desc: 'A statement before you even open it' },
]

const AUTHORITY_SECTIONS = [
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

const FAQ_ITEMS = [
  {
    q: 'How many sets are available?',
    a: 'Only 10. This is a launch edition. Once all 10 are claimed, the edition closes permanently. There will be no restock of this specific set.',
  },
  {
    q: 'How do I provide my size information?',
    a: 'During checkout, you will provide your shoe size, head circumference (in cm or inches), and preferred colour (Blue, Red, Black, or Brown). Refer to our Size Guide for measurements.',
  },
  {
    q: 'What is the delivery timeline?',
    a: 'Orders are dispatched within 3-5 working days of payment confirmation. Delivery within Lagos is 1-2 days. Other states: 2-4 days via GIG Logistics or similar.',
  },
  {
    q: 'Can I return or exchange?',
    a: 'Given the bespoke nature of this product (customized by size and colour), we do not accept returns except in the case of a manufacturing defect. Please review the Size Guide carefully before ordering.',
  },
]

export default function HomePage() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 700], ['0%', '30%'])
  const opacity = useTransform(scrollY, [0, 500], [1, 0])
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const product = products?.[0]
  const productLink = product ? `/product/${product.slug}` : '/shop'

  const soldCount = product?.inventory.soldCount ?? 3
  const totalLimit = product?.inventory.launchEditionLimit ?? 10

  return (
    <div className="bg-obsidian">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pb-24 overflow-hidden">
        {/* Background image */}
        <motion.div style={{ y }} className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt="Afínjú Authority Set"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/80 to-obsidian/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />
        </motion.div>

        <motion.div
          style={{ opacity }}
          className="relative z-10 w-full max-w-screen-xl mx-auto px-6 lg:px-12"
        >
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3 mb-5 justify-center"
            >
              <div className="h-px w-12 bg-gold-500" />
              <span className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold-400">
                Launch Edition - 10 Men Only
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-ivory leading-[0.95] tracking-tight"
            >
              Afínjú{' '}
              <span className="text-gold-400 italic">is not for everybody!</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-lg md:text-2xl font-body text-ivory/80 leading-relaxed max-w-2xl mx-auto"
            >
              If you find yourself in any of these 6 categories, don't bother to buy, Afínjú is absolutely not for you!
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-5 text-base md:text-xl font-body text-ivory/60 leading-relaxed max-w-xl mx-auto"
            >
              The complete Nigerian authority set. Six precision-crafted pieces. One undeniable statement.
            </motion.p>

            {/* Scarcity bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-6 flex justify-center"
            >
              <ScarcityCounter sold={soldCount} total={totalLimit} compact />
            </motion.div>

            {/* CTA — no price reveal yet */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-6 flex flex-wrap items-center gap-6 justify-center"
            >
              <Link to={productLink}>
                <Button variant="gold" size="lg" className="group">
                  Discover the Authority Set
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-body tracking-widest uppercase text-ivory/30">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-8 bg-gradient-to-b from-gold-500 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── Package Contents ────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-obsidian">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6 justify-center">
              <div className="h-px w-8 bg-gold-500" />
              <span className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold-400">
                The Authority Set
              </span>
              <div className="h-px w-8 bg-gold-500" />
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-ivory leading-tight text-center">
              Everything in one complete statement
            </h2>
            <p className="mt-6 font-body text-base md:text-lg text-ivory/55 leading-relaxed text-center max-w-2xl mx-auto">
              Shoes, purse, cap, scent, and presentation, composed as one coordinated set for the man who wants the full look to land at once.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto w-full max-w-[520px] overflow-hidden border border-white/10 bg-white/[0.03]"
            >
              <img
                src={LEATHER_IMAGE}
                alt="Afínjú Authority Set"
                className="w-full object-cover aspect-[4/5]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <div className="mx-auto max-w-sm border border-white/10 bg-obsidian/75 px-4 py-4 backdrop-blur-sm">
                  <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-gold-400">
                    Launch Composition
                  </p>
                  <p className="mt-2 font-heading text-xl md:text-2xl text-ivory">
                    Five essentials. One unmistakable finish.
                  </p>
                  <p className="mt-2 font-body text-xs md:text-sm text-ivory/55 leading-relaxed">
                    Each piece is selected to work together, not compete for attention.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 md:gap-5">
              {PACKAGE_ITEMS.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="flex min-h-[112px] flex-col items-center justify-center border border-white/8 bg-white/[0.03] px-3 py-4 text-center transition-colors hover:border-gold-500/25 hover:bg-white/[0.05] md:min-h-[136px] md:px-4 md:py-5"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gold-500/25 bg-gold-500/10 md:h-8 md:w-8">
                    <Check className="h-3 w-3 text-gold-500 md:h-3.5 md:w-3.5" />
                  </div>
                  <p className="mt-2 text-[12px] font-body font-semibold leading-snug text-ivory md:mt-3 md:text-sm">
                    {item.name}
                  </p>
                  <p className="mt-1 text-[10px] md:mt-1.5 md:text-xs font-body text-ivory/40 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Authority Sections ──────────────────────────────── */}
      <section className="py-24 md:py-32 bg-[#050505]">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-display text-3xl md:text-6xl font-bold text-ivory">
              6 reasons not to buy
            </h2>
            <p className="mt-4 font-body text-ivory/40 text-base md:text-lg max-w-2xl mx-auto">
              If you fall into any of these categories, please keep your money. Afínjú is absolutely not for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {AUTHORITY_SECTIONS.map((section, i) => (
              <motion.div
                key={section.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#050505] p-5 md:p-10 hover:bg-obsidian transition-colors group"
              >
                <span className="font-display text-5xl font-bold text-gold-500/20 group-hover:text-gold-500/30 transition-colors">
                  {section.number}
                </span>
                <h3 className="mt-3 font-heading text-base md:text-2xl font-bold text-ivory group-hover:text-gold-400 transition-colors">
                  {section.title}
                </h3>
                <p className="mt-3 font-body text-xs md:text-sm text-ivory/50 leading-relaxed">
                  {section.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Social Proof ─────────────────────────────── */}
      <section className="py-20 bg-[#050505]">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 text-center">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="h-px w-8 bg-gold-500" />
            <span className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold-400">
              Join the Movement
            </span>
            <div className="h-px w-8 bg-gold-500" />
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-ivory mb-6">
            Built for the Men Who Lead
          </h2>
          <p className="font-body text-base md:text-lg text-ivory/50 max-w-2xl mx-auto leading-relaxed">
            Designed for men who want coordinated presentation, confident finishing, and a look that reads clearly from the first glance.
          </p>
          <div className="mt-10">
            <Link to={productLink}>
              <Button variant="outline-gold" size="lg" className="group">
                Be Among the First
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="py-20 bg-obsidian">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <div className="h-px w-8 bg-gold-500" />
              <span className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold-400">
                Questions
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-ivory mb-12">
              What you should know.
            </h2>

            <Accordion type="single" collapsible className="space-y-0">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-white/10">
                  <AccordionTrigger className="text-ivory/80 hover:text-gold-400 text-sm md:text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-ivory/50">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-10 flex justify-center">
              <Link to="/faq">
                <Button variant="outline-gold" size="sm">
                  Full FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Price Reveal + Final CTA ───────────────────────────── */}
      <section className="py-24 md:py-40 bg-obsidian">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold text-ivory leading-tight">
              Welcome to the{' '}
              <span className="gold-shimmer block mt-2">Afínjú Men's Club.</span>
            </h2>

            <p className="mt-8 max-w-2xl mx-auto font-body text-base md:text-xl text-ivory/50 leading-relaxed">
              If you have passed these six categories, then you already understand the point: every piece was designed for one outcome. Impact.
            </p>

            <p className="mt-8 max-w-2xl mx-auto font-body text-base md:text-lg text-ivory/60 leading-relaxed italic">
              When you step out in Afínjú, you do not blend in. You command space. Eyes follow you. Conversations slow down.
            </p>

            <div className="mt-14">
              <p className="text-xs font-body tracking-[0.4em] uppercase text-gold-400 mb-4">Launch Price</p>
              <div className="flex items-baseline gap-4 justify-center">
                <span className="font-display text-4xl md:text-7xl font-bold text-ivory">
                  {formatPrice(product?.price ?? 200000)}
                </span>
                <span className="text-xl md:text-2xl font-body text-ivory/30 line-through">
                  {formatPrice(product?.compareAtPrice ?? 250000)}
                </span>
              </div>
              <p className="text-sm font-body text-gold-400/80 mt-2">
                You save {formatPrice((product?.compareAtPrice ?? 250000) - (product?.price ?? 200000))}
              </p>
            </div>

            <div className="mt-12">
              <ScarcityCounter sold={soldCount} total={totalLimit} className="max-w-md mx-auto mb-10" />
              <Link to={productLink}>
                <Button variant="gold" size="xl" className="group">
                  Order Your Authority Set
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
