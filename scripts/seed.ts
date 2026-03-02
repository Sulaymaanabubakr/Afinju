/**
 * AFINJU Seed Script
 * Populates Firestore with the flagship product, homepage content, and FAQ.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env var pointing to your service account JSON,
 * or set GOOGLE_APPLICATION_CREDENTIALS.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import path from 'path'

// Initialise Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require(path.resolve('./service-account.json'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function seed() {
  console.log('🌱  Starting AFINJU seed...\n')

  // ── Product ──────────────────────────────────────────────────────────────────
  const productId = 'afinju-authority-set-launch-v1'
  await db.collection('products').doc(productId).set({
    id: productId,
    name: 'AFINJU Authority Set — Launch Edition',
    slug: 'afinju-authority-set-launch-edition',
    description:
      'The complete authority set for the man who has decided that his standard is non-negotiable. ' +
      'Six coordinated pieces, crafted from premium Nigerian leather, engineered to communicate one clear message: ' +
      'this man is decided. Only ten men will own this launch edition. Once it is closed, it is closed.',
    features: [
      'Hand-crafted from full-grain Nigerian leather with bevelled edges and mirror finish',
      'Fully coordinated across all six pieces — same leather batch, same tone, unified aesthetic',
      'Each set produced to the buyer\'s exact shoe size, head size, and preferred colour',
      'Signature oil perfume formulated to last 8–12 hours — deep, masculine, authoritative',
      'Luxury black rigid packaging box with magnetic closure and satin lining',
      'Authentication card and AFINJU certificate of ownership included',
    ],
    items: [
      'Pure Skin Leather Half Shoe',
      'Matching Premium Purse',
      'Matching Gobi Cap',
      'Signature Oil Perfume',
      'Matching Polish Kit',
      'Luxury Black Packaging Box',
    ],
    price: 200000,
    compareAtPrice: 250000,
    currency: 'NGN',
    colors: ['Blue', 'Red', 'Black', 'Brown'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=90',
        alt: 'AFINJU Authority Set — Launch Edition',
        publicId: 'afinju/products/launch-v1/hero',
      },
      {
        url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=90',
        alt: 'AFINJU Authority Set — Leather Detail',
        publicId: 'afinju/products/launch-v1/detail-1',
      },
      {
        url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=1200&q=90',
        alt: 'AFINJU Authority Set — Full Collection',
        publicId: 'afinju/products/launch-v1/detail-2',
      },
    ],
    inventory: {
      launchEditionLimit: 10,
      soldCount: 0,
      allowBackorder: false,
    },
    seo: {
      title: 'AFINJU Authority Set — Launch Edition | Premium Nigerian Leather',
      description:
        'The complete authority set: leather half shoe, matching purse, Gobi cap, signature perfume, polish, and luxury box. Only 10 units. ₦200,000.',
    },
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  console.log('✅  Product created:', productId)

  // ── Homepage Content ─────────────────────────────────────────────────────────
  await db.collection('config').doc('content').set({
    announcementBar: {
      enabled: true,
      text: 'Only Ten Men Will Own This Launch Edition · Once It Is Closed, It Is Closed · AFINJU — Authority Set · Launch Price ₦200,000',
    },
    hero: {
      headline: 'AFINJU is not for you if you cannot handle attention.',
      subheadline:
        'The authority set for the man who has decided that his standard is non-negotiable. Six pieces. One statement. Ten men.',
      ctaText: 'Secure Your Position',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=90',
    },
    scarcityBanner: {
      enabled: true,
      text: 'Only 10 men will own this launch edition. Once it is closed, it is closed.',
    },
    updatedAt: Timestamp.now(),
  })
  console.log('✅  Homepage content set')

  // ── Store Settings ────────────────────────────────────────────────────────────
  await db.collection('config').doc('settings').set({
    storeName: 'AFINJU',
    whatsappNumber: '2347071861932',
    supportEmail: 'hello@afinju.com',
    shippingFee: 5000,
    paystackPublicKey: process.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
    instagramUrl: 'https://instagram.com/afinju',
    twitterUrl: '',
    updatedAt: Timestamp.now(),
  })
  console.log('✅  Store settings set')

  console.log('\n🚀  Seed complete. AFINJU is ready to launch.\n')
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
