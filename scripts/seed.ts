/**
 * AFINJU Seed Script (Supabase Migration)
 * Populates Postgres with the flagship product, homepage content, and FAQ.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('🌱  Starting AFINJU seed...\n')

  // ── Product ──────────────────────────────────────────────────────────────────
  const productId = 'afinju-authority-set-launch-v1'
  const { error: productError } = await supabase.from('products').upsert({
    slug: 'afinju-authority-set-launch-edition',
    name: 'AFINJU Authority Set — Launch Edition',
    description:
      'The complete authority set for the man who has decided that his standard is non-negotiable. ' +
      'Six coordinated pieces, crafted from premium Nigerian leather, engineered to communicate one clear message: ' +
      'this man is decided. Only ten men will own this launch edition. Once it is closed, it is closed.',
    price: 200000,
    inventory: {
      launchEditionLimit: 10,
      soldCount: 0,
    },
    images: [
      {
        url: '/products/afinju_red_hero_1773322751923.png',
        alt: 'AFINJU Authority Set — Launch Edition',
      },
      {
        url: '/products/afinju_red_detail_1773322771608.png',
        alt: 'AFINJU Authority Set — Leather Detail',
      },
      {
        url: '/products/afinju_red_lifestyle_1773322801188.png',
        alt: 'AFINJU Authority Set — Full Collection',
      },
    ],
    status: 'active',
  }, { onConflict: 'slug' })
  
  if (productError) throw productError
  console.log('✅  Product created:', productId)

  // ── Homepage Content ─────────────────────────────────────────────────────────
  const { error: contentError } = await supabase.from('config').upsert({
    id: 'content',
    data: {
      announcementBar: {
        enabled: true,
        text: 'Only Ten Men Will Own This Launch Edition · Once It Is Closed, It Is Closed · AFINJU — Authority Set · Launch Price ₦200,000',
      },
      hero: {
        headline: 'AFINJU is not for you if you cannot handle attention.',
        subheadline:
          'The authority set for the man who has decided that his standard is non-negotiable. Six pieces. One statement. Ten men.',
        ctaText: 'Secure Your Position',
        imageUrl: '/products/afinju_black_lifestyle_1773322925749.png',
      },
    }
  })
  
  if (contentError) throw contentError
  console.log('✅  Homepage content set')

  // ── Store Settings ────────────────────────────────────────────────────────────
  const { error: settingsError } = await supabase.from('config').upsert({
    id: 'settings',
    data: {
      storeName: 'AFINJU',
      whatsappNumber: '2347071861932',
      supportEmail: 'hello@afinju.com',
      shippingFee: 5000,
    }
  })
  if (settingsError) throw settingsError
  console.log('✅  Store settings set')

  console.log('\n🚀  Seed complete. AFINJU is ready to launch.\n')
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
