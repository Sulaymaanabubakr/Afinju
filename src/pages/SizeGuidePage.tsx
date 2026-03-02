export default function SizeGuidePage() {
  const shoeData = [
    { eu: '38', uk: '5', us: '6', cm: '24.0' },
    { eu: '39', uk: '6', us: '7', cm: '24.6' },
    { eu: '40', uk: '6.5', us: '7.5', cm: '25.3' },
    { eu: '41', uk: '7', us: '8', cm: '25.9' },
    { eu: '42', uk: '8', us: '9', cm: '26.6' },
    { eu: '43', uk: '9', us: '10', cm: '27.3' },
    { eu: '44', uk: '9.5', us: '10.5', cm: '27.9' },
    { eu: '45', uk: '10', us: '11', cm: '28.6' },
    { eu: '46', uk: '11', us: '12', cm: '29.3' },
    { eu: '47', uk: '12', us: '13', cm: '30.0' },
  ]

  const headData = [
    { cm: '54', inches: '21 ¼' },
    { cm: '55', inches: '21 ⅝' },
    { cm: '56', inches: '22' },
    { cm: '57', inches: '22 ½' },
    { cm: '58', inches: '22 ⅞' },
    { cm: '59', inches: '23 ¼' },
    { cm: '60', inches: '23 ⅝' },
    { cm: '61', inches: '24' },
    { cm: '62', inches: '24 ⅜' },
    { cm: '63', inches: '24 ¾' },
  ]

  return (
    <div className="min-h-screen">
      <section className="bg-afinju-black text-afinju-cream py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="section-label text-gold/70 mb-4">Precision Matters</p>
          <h1 className="font-heading text-5xl mb-6">Size Guide</h1>
          <div className="gold-rule-left mb-6" />
          <p className="font-body text-afinju-cream/55">
            AFINJU is crafted to your exact dimensions. Taking accurate measurements ensures your authority set fits perfectly.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-20">
          {/* Shoe Size */}
          <div>
            <p className="section-label mb-3">Shoe Size</p>
            <h2 className="font-heading text-3xl mb-4">How to Measure Your Foot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
              <div className="space-y-5 font-body text-afinju-black/65 leading-relaxed">
                <p>For best results, measure in the evening when your feet are at their largest (feet swell slightly throughout the day).</p>
                <ol className="space-y-3">
                  {[
                    'Place a blank sheet of paper on a hard floor and stand on it with your weight evenly distributed.',
                    'Trace the outline of your foot carefully, keeping the pen vertical against your foot.',
                    'Measure the distance from the heel mark to the tip of your longest toe in centimetres.',
                    'Use the table on the right to find your EU size.',
                    'If you fall between sizes, choose the larger size.',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-display text-gold text-xs mt-0.5">0{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-black/8">
                  <thead className="bg-afinju-cream">
                    <tr>
                      {['EU', 'UK', 'US', 'Foot Length (cm)'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-[0.15em] uppercase text-afinju-black/50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {shoeData.map(row => (
                      <tr key={row.eu} className="hover:bg-afinju-cream/40 transition-colors">
                        <td className="px-4 py-3 font-sans text-sm font-semibold text-gold">{row.eu}</td>
                        <td className="px-4 py-3 font-sans text-sm">{row.uk}</td>
                        <td className="px-4 py-3 font-sans text-sm">{row.us}</td>
                        <td className="px-4 py-3 font-sans text-sm">{row.cm} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="h-px bg-black/8" />

          {/* Head Size */}
          <div>
            <p className="section-label mb-3">Head Size (Gobi Cap)</p>
            <h2 className="font-heading text-3xl mb-4">How to Measure Your Head</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-5 font-body text-afinju-black/65 leading-relaxed">
                <p>Use a soft measuring tape or a piece of string. Do not use a metal ruler — it cannot wrap around the head accurately.</p>
                <ol className="space-y-3">
                  {[
                    'Stand in front of a mirror so you can see the tape placement clearly.',
                    'Place the tape approximately 1cm above your ears.',
                    'Bring it across your forehead at mid-height — not at the hairline.',
                    'The tape should sit where a hat would naturally rest.',
                    'Note the measurement in centimetres. If using string, mark it and measure against a ruler.',
                    'If your measurement falls between two sizes, choose the larger one.',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-display text-gold text-xs mt-0.5">0{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-black/8">
                  <thead className="bg-afinju-cream">
                    <tr>
                      {['Circumference (cm)', 'Circumference (inches)'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-[0.15em] uppercase text-afinju-black/50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {headData.map(row => (
                      <tr key={row.cm} className="hover:bg-afinju-cream/40 transition-colors">
                        <td className="px-4 py-3 font-sans text-sm font-semibold text-gold">{row.cm} cm</td>
                        <td className="px-4 py-3 font-sans text-sm">{row.inches}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-afinju-cream p-8 text-center">
            <p className="font-heading text-xl mb-3">Still Unsure?</p>
            <p className="font-body text-afinju-black/60 mb-5">Our team can walk you through the measurement process personally.</p>
            <a
              href={`https://wa.me/2347071861932?text=${encodeURIComponent('Hello AFINJU, I need help measuring my size before ordering.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-luxury inline-block text-xs py-3 px-8"
            >
              Get Sizing Help via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
