import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import ScarcityCounter from '@/components/shared/ScarcityCounter'
import { useHomepageContent } from '@/lib/queries'
import { formatPrice } from '@/lib/utils'

// Placeholder product image (Cloudinary)
const HERO_IMAGE = 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=1200&q=90'
const PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90'
const LEATHER_IMAGE = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=90'

const PACKAGE_ITEMS = [
  { name: 'Pure Skin Leather Half Shoe', desc: 'Hand-crafted from premium Nigerian leather' },
  { name: 'Matching Premium Purse', desc: 'Coordinated to perfection' },
  { name: 'Matching Gobi Cap', desc: 'The finishing touch of authority' },
  { name: 'Signature Oil Perfume', desc: 'A scent that announces your arrival' },
  { name: 'Matching Polish Kit', desc: 'Maintain your investment' },
  { name: 'Luxury Black Packaging Box', desc: 'A statement before you even open it' },
]

const AUTHORITY_SECTIONS = [
  {
    number: '01',
    title: 'Attention is Currency',
    body: 'The moment you enter a room in AFINJU, the conversation changes. People notice. They wonder. That is not an accident. That is the design.',
  },
  {
    number: '02',
    title: 'No Assumptions Here',
    body: 'This is not for everyone. We are not trying to convince you. Either you understand what presence means — or you will remain comfortable.',
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
    title: 'Premium Standards Persist',
    body: 'Every item in the Authority Set is selected against one criterion: would the most deliberate man in Nigeria be proud to wear this?',
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
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // In production, fetch from Firestore
  const soldCount = 3 // Demo value
  const totalLimit = 10

  return (
    <div className="bg-obsidian">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pb-24 overflow-hidden">
        {/* Background image */}
        <motion.div style={{ y }} className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt="AFINJU Authority Set"
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
          <div className="max-w-3xl lg:max-w-4xl lg:mx-auto lg:text-center">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3 mb-5 lg:justify-center"
            >
              <div className="h-px w-12 bg-gold-500" />
              <span className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold-400">
                Launch Edition — 10 Men Only
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-ivory leading-[0.95] tracking-tight"
            >
              AFINJU{' '}
              <span className="text-gold-400 italic">is not for you</span>
              <br />
              if you cannot handle attention.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-5 text-lg md:text-xl font-body text-ivory/60 leading-relaxed max-w-xl lg:mx-auto"
            >
              The complete Nigerian authority set. Six precision-crafted pieces. One undeniable statement.
            </motion.p>

            {/* Scarcity bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-6 lg:flex lg:justify-center"
            >
              <ScarcityCounter sold={soldCount} total={totalLimit} compact />
            </motion.div>

            {/* Price + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-6 flex flex-wrap items-center gap-6 lg:justify-center"
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl lg:text-4xl font-bold text-ivory">
                    {formatPrice(200000)}
                  </span>
                  <span className="text-lg font-body text-ivory/40 line-through">
                    {formatPrice(250000)}
                  </span>
                </div>
                <p className="text-xs font-body text-gold-400 tracking-widest uppercase mt-1">
                  Launch Price — Save ₦50,000
                </p>
              </div>
              <Link to="/product/afinju-authority-set-launch-edition">
                <Button variant="gold" size="lg" className="group">
                  Secure Your Position
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
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-gold-500" />
                <span className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold-400">
                  The Authority Set
                </span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-ivory leading-tight">
                Six pieces.
                <br />
                <span className="text-gold-400 italic">One identity.</span>
              </h2>
              <p className="mt-6 font-body text-ivory/50 leading-relaxed">
                Every item in the AFINJU Authority Set is carefully matched, sourced, and assembled to create a unified statement of premium Nigerian excellence.
              </p>

              <div className="mt-10 space-y-4">
                {PACKAGE_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 border border-white/5 hover:border-gold-500/20 transition-colors"
                  >
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gold-500/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-gold-500" />
                    </div>
                    <div>
                      <p className="text-sm font-body font-semibold text-ivory">{item.name}</p>
                      <p className="text-xs font-body text-ivory/40 mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative overflow-hidden">
                <img
                  src={LEATHER_IMAGE}
                  alt="AFINJU Authority Set"
                  className="w-full object-cover aspect-[4/5]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/50 to-transparent" />
              </div>
              {/* Floating price badge */}
              <div className="absolute -bottom-6 -left-6 bg-gold-500 text-obsidian p-6">
                <p className="text-xs font-body font-bold tracking-widest uppercase">Launch Price</p>
                <p className="font-display text-3xl font-bold mt-1">₦200,000</p>
              </div>
            </motion.div>
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
            <h2 className="font-display text-4xl md:text-6xl font-bold text-ivory">
              Why AFINJU?
            </h2>
            <p className="mt-4 font-body text-ivory/40 text-lg">
              The truths no one tells men about presence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {AUTHORITY_SECTIONS.map((section, i) => (
              <motion.div
                key={section.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#050505] p-8 md:p-10 hover:bg-obsidian transition-colors group"
              >
                <span className="font-display text-5xl font-bold text-white/5 group-hover:text-gold-500/10 transition-colors">
                  {section.number}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-ivory group-hover:text-gold-400 transition-colors">
                  {section.title}
                </h3>
                <p className="mt-4 font-body text-sm text-ivory/50 leading-relaxed">
                  {section.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Welcome / CTA Block ─────────────────────────────── */}
      <section className="py-24 md:py-40 bg-obsidian relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-gold-500/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-gold-500/8" />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12 bg-gold-500/50" />
              <span className="text-xs font-body tracking-[0.4em] uppercase text-gold-400">Welcome</span>
              <div className="h-px w-12 bg-gold-500/50" />
            </div>

            <h2 className="font-display text-5xl md:text-7xl font-bold text-ivory leading-tight">
              You are{' '}
              <span className="gold-shimmer">AFINJU.</span>
            </h2>

            <p className="mt-8 max-w-2xl mx-auto font-body text-xl text-ivory/50 leading-relaxed">
              If you have read this far, you already know. This is not about shoes, caps, or perfume. This is about who you are when you walk into a room. The Authority Set simply makes it visible.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <p className="font-body text-sm text-ivory/40 italic">
                "Once it is closed, it is closed."
              </p>
            </div>

            <div className="mt-10">
              <ScarcityCounter sold={soldCount} total={totalLimit} className="max-w-md mx-auto mb-10" />
              <Link to="/product/afinju-authority-set-launch-edition">
                <Button variant="gold" size="xl" className="group">
                  Claim Your Launch Edition
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <p className="mt-4 text-xs font-body text-ivory/30 tracking-widest uppercase">
                Only {totalLimit - soldCount} positions remaining
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials placeholder ─────────────────────────── */}
      <section className="py-20 bg-[#050505]">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px w-8 bg-gold-500" />
            <span className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold-400">
              From Men Who Own Rooms
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'I walked into my board meeting wearing AFINJU. The room went quiet. The deal was already half-closed before I spoke.',
                name: 'Emeka O.',
                location: 'Lagos, NG',
              },
              {
                quote: 'The craftsmanship is unlike anything I have seen from a Nigerian brand. International quality, Nigerian soul.',
                name: 'Tunde A.',
                location: 'Abuja, NG',
              },
              {
                quote: 'My wife asked if I was wearing a new cologne before I even entered the room. The AFINJU oil perfume is exceptional.',
                name: 'Chidi M.',
                location: 'Port Harcourt, NG',
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-8 border border-white/5 hover:border-gold-500/20 transition-colors"
              >
                <div className="flex gap-1 mb-6">
                  {Array(5).fill(0).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-gold-500 text-gold-500" />
                  ))}
                </div>
                <p className="font-body text-sm text-ivory/70 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <span className="font-display text-xs font-bold text-gold-400">
                      {t.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-body font-semibold text-ivory">{t.name}</p>
                    <p className="text-xs font-body text-ivory/40">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="py-20 bg-obsidian">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-8 bg-gold-500" />
              <span className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold-400">
                Questions
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ivory mb-12">
              What you should know.
            </h2>

            <Accordion type="single" collapsible className="space-y-0">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-white/10">
                  <AccordionTrigger className="text-ivory/80 hover:text-gold-400 text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-ivory/50">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-10">
              <Link to="/faq">
                <Button variant="outline-gold" size="sm">
                  Full FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
