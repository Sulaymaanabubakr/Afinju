import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-afinju-black text-afinju-cream py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="section-label text-gold/70 mb-6">Our Story</p>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl leading-tight mb-8">
              Built for the Man Who <span className="italic text-gold">Knows</span>.
            </h1>
            <div className="gold-rule-left" />
          </motion.div>
        </div>
      </section>

      {/* Brand story */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto space-y-10 font-body text-lg text-afinju-black/75 leading-relaxed">
          <p>
            AFINJU was not born from a business plan. It was born from a frustration — the kind that comes from watching
            men of genuine calibre dress beneath their worth. The kind that comes from walking into a room knowing you
            are the most capable person there, but having nothing on your body that communicates that truth.
          </p>
          <p>
            We believe that presence is a craft. That the way a man presents himself is not vanity — it is a statement of
            values. When a man invests in himself at the highest level, he signals to every room he enters: <em>I operate
            at a different standard.</em>
          </p>
          <div className="border-l-2 border-gold pl-8 py-2">
            <p className="font-heading text-2xl text-afinju-black italic leading-snug">
              "AFINJU is not for you if you cannot handle attention."
            </p>
          </div>
          <p>
            That is not a warning. It is a filter. We create for the men who have already decided. Who understand that
            cheap is the most expensive thing you can be. Who know that the right set of accessories can change how a
            room receives you before you open your mouth.
          </p>
          <p>
            The AFINJU Authority Set — our flagship launch collection — is the full expression of this philosophy.
            Six coordinated pieces, crafted from premium Nigerian leather, designed to work as one unified statement.
            From shoe to purse, cap to scent, polish to packaging, every element speaks the same language: <em>this man
            is decided.</em>
          </p>
          <p>
            We produce in limited quantities by design. Not as a marketing tactic. As a principle. The men who wear
            AFINJU are not common. The set should not be either.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-afinju-cream py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Our Principles</p>
            <h2 className="font-heading text-4xl">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'Premium Without Compromise', body: 'Every material, every stitch, every finish is held to the same question: is this worthy of the man who will wear it? If the answer is anything other than yes, it does not leave our workshop.' },
              { title: 'Limited by Design', body: 'Mass production and prestige are incompatible. We produce what we can make with absolute care. Nothing more. When it is gone, it is gone — and that is exactly the point.' },
              { title: 'Nigerian Excellence', body: 'AFINJU is made in Nigeria, for the African man of authority. We are not imitating anyone. We are setting the standard for what Nigerian luxury looks, feels, and communicates.' },
            ].map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="border-t border-black/10 pt-8"
              >
                <h3 className="font-heading text-xl mb-4">{v.title}</h3>
                <p className="font-body text-afinju-black/60 leading-relaxed">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <p className="section-label mb-4">Ready to Elevate?</p>
        <h2 className="font-heading text-4xl mb-8">Claim Your Position</h2>
        <Link to="/collections/launch-edition" className="btn-luxury inline-block text-sm py-4 px-12">
          View the Authority Set
        </Link>
      </section>
    </div>
  )
}
