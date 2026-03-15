/**
 * AFINJU Upload & Seed Script
 * 1. Uploads all product images from public/products/ to Cloudinary
 * 2. Seeds Firestore with all products using Cloudinary URLs
 *
 * Usage:
 *   npx tsx scripts/upload-and-seed.ts
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { v2 as cloudinary } from 'cloudinary'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// ── Config ──────────────────────────────────────────────────────────────────────
const serviceAccountPath = path.join(projectRoot, 'afinju-luxury-firebase-adminsdk-fbsvc-21d9c1b699.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

cloudinary.config({
  cloud_name: 'du782gsda',
  api_key: '987486131528321',
  api_secret: 'R5flpG3kxSma1OfPNpPrel-NGBo',
})

// ── Upload Helper ───────────────────────────────────────────────────────────────
async function uploadImage(filePath: string, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    resource_type: 'image',
  })
  console.log(`  ☁️  Uploaded: ${path.basename(filePath)} → ${result.secure_url}`)
  return result.secure_url
}

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱  AFINJU Upload & Seed\n')

  const productsDir = path.join(projectRoot, 'public', 'products')
  const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.png'))
  console.log(`📁  Found ${files.length} images in public/products/\n`)

  // Upload all images and build a URL map
  const urlMap: Record<string, string> = {}
  for (const file of files) {
    const filePath = path.join(productsDir, file)
    const url = await uploadImage(filePath, 'afinju/products')
    urlMap[file] = url
  }

  console.log(`\n✅  All ${files.length} images uploaded to Cloudinary\n`)

  // ── Image URL helpers ─────────────────────────────────────────────────────
  const img = (filename: string) => urlMap[filename] || `/products/${filename}`

  // ── Products ──────────────────────────────────────────────────────────────
  const products = [
    {
      id: 'afinju-authority-set-launch-v1',
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
        { url: img('afinju_red_hero_1773322751923.png'), alt: 'AFINJU Authority Set — Launch Edition', publicId: 'afinju/products/launch-v1/hero' },
        { url: img('afinju_red_detail_1773322771608.png'), alt: 'AFINJU Authority Set — Leather Detail', publicId: 'afinju/products/launch-v1/detail-1' },
        { url: img('afinju_red_lifestyle_1773322801188.png'), alt: 'AFINJU Authority Set — Full Collection', publicId: 'afinju/products/launch-v1/detail-2' },
      ],
      inventory: { launchEditionLimit: 10, soldCount: 0, allowBackorder: false },
    },
    {
      id: 'afinju-authority-set-red',
      name: 'AFINJU Authority Set — Red Velvet',
      slug: 'afinju-authority-set-red-velvet',
      description: 'The complete authority set for the man who has decided that his standard is non-negotiable. Six coordinated pieces, crafted from premium Nigerian leather and vibrant red velvet.',
      features: [
        'Vibrant red velvet finish with gold crest emblem',
        'Fully coordinated across all pieces',
        'Each set produced to the buyer\'s exact shoe size, head size',
        'Authentication card included',
      ],
      items: ['Red Velvet Half Shoe', 'Matching Red Velvet Clutch', 'Matching Red Gobi Cap'],
      price: 220000,
      compareAtPrice: 280000,
      currency: 'NGN',
      colors: ['Red'],
      images: [
        { url: img('afinju_red_hero_1773322751923.png'), alt: 'Red Authority Set Hero', publicId: 'afinju/products/red-hero' },
        { url: img('afinju_red_detail_1773322771608.png'), alt: 'Red Authority Set Detail', publicId: 'afinju/products/red-detail' },
        { url: img('afinju_red_lifestyle_1773322801188.png'), alt: 'Red Authority Set Lifestyle', publicId: 'afinju/products/red-lifestyle' },
      ],
      inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
    },
    {
      id: 'afinju-authority-set-blue',
      name: 'AFINJU Authority Set — Royal Blue',
      slug: 'afinju-authority-set-royal-blue',
      description: 'The complete authority set for the man who has decided that his standard is non-negotiable. Six coordinated pieces, crafted from premium Nigerian leather and royal blue velvet.',
      features: [
        'Royal blue velvet finish with gold crest emblem',
        'Fully coordinated across all pieces',
        'Each set produced to the buyer\'s exact shoe size, head size',
        'Authentication card included',
      ],
      items: ['Royal Blue Velvet Half Shoe', 'Matching Blue Velvet Clutch', 'Matching Blue Gobi Cap'],
      price: 220000,
      compareAtPrice: 280000,
      currency: 'NGN',
      colors: ['Blue'],
      images: [
        { url: img('afinju_blue_hero_1773322816739.png'), alt: 'Blue Authority Set Hero', publicId: 'afinju/products/blue-hero' },
        { url: img('afinju_blue_detail_1773322831998.png'), alt: 'Blue Authority Set Detail', publicId: 'afinju/products/blue-detail' },
        { url: img('afinju_blue_lifestyle_1773322849784.png'), alt: 'Blue Authority Set Lifestyle', publicId: 'afinju/products/blue-lifestyle' },
      ],
      inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
    },
    {
      id: 'afinju-authority-set-black',
      name: 'AFINJU Authority Set — Midnight Black',
      slug: 'afinju-authority-set-midnight-black',
      description: 'The complete authority set for the man who has decided that his standard is non-negotiable. Six coordinated pieces, crafted from premium Nigerian leather and deep midnight black velvet.',
      features: [
        'Midnight black velvet finish with gold crest emblem',
        'Fully coordinated across all pieces',
        'Each set produced to the buyer\'s exact shoe size, head size',
        'Authentication card included',
      ],
      items: ['Black Velvet Half Shoe', 'Matching Black Velvet Clutch', 'Matching Black Gobi Cap'],
      price: 220000,
      compareAtPrice: 280000,
      currency: 'NGN',
      colors: ['Black'],
      images: [
        { url: img('afinju_black_hero_1773322894522.png'), alt: 'Black Authority Set Hero', publicId: 'afinju/products/black-hero' },
        { url: img('afinju_black_detail_1773322910632.png'), alt: 'Black Authority Set Detail', publicId: 'afinju/products/black-detail' },
        { url: img('afinju_black_lifestyle_1773322925749.png'), alt: 'Black Authority Set Lifestyle', publicId: 'afinju/products/black-lifestyle' },
      ],
      inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
    },
    {
      id: 'afinju-authority-set-brown',
      name: 'AFINJU Authority Set — Chocolate Brown',
      slug: 'afinju-authority-set-chocolate-brown',
      description: 'The complete authority set for the man who has decided that his standard is non-negotiable. Six coordinated pieces, crafted from premium Nigerian leather and rich chocolate brown velvet.',
      features: [
        'Chocolate brown velvet finish with gold crest emblem',
        'Fully coordinated across all pieces',
        'Each set produced to the buyer\'s exact shoe size, head size',
        'Authentication card included',
      ],
      items: ['Brown Velvet Half Shoe', 'Matching Brown Velvet Clutch', 'Matching Brown Gobi Cap'],
      price: 220000,
      compareAtPrice: 280000,
      currency: 'NGN',
      colors: ['Brown'],
      images: [
        { url: img('afinju_brown_hero_1773322947363.png'), alt: 'Brown Authority Set Hero', publicId: 'afinju/products/brown-hero' },
        { url: img('afinju_brown_detail_1773322964094.png'), alt: 'Brown Authority Set Detail', publicId: 'afinju/products/brown-detail' },
        { url: img('afinju_brown_detail_1773322964094.png'), alt: 'Brown Authority Set Lifestyle', publicId: 'afinju/products/brown-lifestyle' },
      ],
      inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
    },
    {
      id: 'afinju-executive-leather-briefcase',
      name: 'AFINJU Executive Leather Briefcase',
      slug: 'afinju-executive-leather-briefcase',
      description: 'Premium Nigerian full-grain leather briefcase designed for the modern executive. Features brass hardware and microsuede interior lining.',
      features: ['Full-grain Nigerian leather', 'Brass hardware', 'Microsuede interior lining', 'Multiple internal compartments'],
      items: ['Leather Briefcase', 'Detachable Shoulder Strap', 'Dust Bag'],
      price: 150000,
      compareAtPrice: 180000,
      currency: 'NGN',
      colors: ['Brown', 'Black'],
      images: [
        { url: img('afinju_brown_hero_1773322947363.png'), alt: 'Briefcase Hero', publicId: 'afinju/products/briefcase-hero' },
        { url: img('afinju_brown_detail_1773322964094.png'), alt: 'Briefcase Detail', publicId: 'afinju/products/briefcase-detail' },
        { url: img('afinju_black_lifestyle_1773322925749.png'), alt: 'Briefcase Lifestyle', publicId: 'afinju/products/briefcase-lifestyle' },
      ],
      inventory: { launchEditionLimit: 200, soldCount: 0, allowBackorder: true },
    },
    {
      id: 'afinju-premium-leather-loafers',
      name: 'AFINJU Premium Leather Loafers',
      slug: 'afinju-premium-leather-loafers',
      description: 'Hand-stitched premium men\'s leather loafers, offering exceptional comfort and classic style for the discerning gentleman.',
      features: ['Full-grain leather', 'Hand-stitched detailing', 'Leather lining and sole', 'Cushioned insole'],
      items: ['Pair of Loafers', 'Dust Bag', 'Shoe Horn'],
      price: 120000,
      compareAtPrice: 150000,
      currency: 'NGN',
      colors: ['Brown', 'Black'],
      images: [
        { url: img('afinju_black_hero_1773322894522.png'), alt: 'Loafers Hero', publicId: 'afinju/products/loafers-hero' },
        { url: img('afinju_black_detail_1773322910632.png'), alt: 'Loafers Detail', publicId: 'afinju/products/loafers-detail' },
        { url: img('afinju_blue_lifestyle_1773322849784.png'), alt: 'Loafers Lifestyle', publicId: 'afinju/products/loafers-lifestyle' },
      ],
      inventory: { launchEditionLimit: 150, soldCount: 0, allowBackorder: true },
    },
    {
      id: 'afinju-signature-agbada-set',
      name: 'AFINJU Signature Agbada Set',
      slug: 'afinju-signature-agbada-set',
      description: 'A luxurious three-piece Agbada set crafted from premium Aso-Oke fabric, featuring intricate hand-embroidery.',
      features: ['Premium Aso-Oke fabric', 'Hand-embroidered details', 'Tailored fit', 'Breathable and comfortable'],
      items: ['Agbada (Outer Robe)', 'Buba (Inner Shirt)', 'Sokoto (Trousers)'],
      price: 350000,
      compareAtPrice: 400000,
      currency: 'NGN',
      colors: ['Blue', 'Black', 'Brown'],
      images: [
        { url: img('afinju_blue_hero_1773322816739.png'), alt: 'Agbada Hero', publicId: 'afinju/products/agbada-hero' },
        { url: img('afinju_blue_detail_1773322831998.png'), alt: 'Agbada Detail', publicId: 'afinju/products/agbada-detail' },
        { url: img('afinju_black_lifestyle_1773322925749.png'), alt: 'Agbada Lifestyle', publicId: 'afinju/products/agbada-lifestyle' },
      ],
      inventory: { launchEditionLimit: 30, soldCount: 0, allowBackorder: false },
    },
    {
      id: 'afinju-leather-mules',
      name: 'AFINJU Classic Leather Mules',
      slug: 'afinju-classic-leather-mules',
      description: 'Elegant backless leather mules, perfect for both traditional and smart-casual attire. Easy slip-on design with a sophisticated profile.',
      features: ['Genuine leather construction', 'Backless slip-on design', 'Low stacked heel', 'Durable outsole'],
      items: ['Pair of Mules', 'Storage Bag'],
      price: 85000,
      compareAtPrice: 100000,
      currency: 'NGN',
      colors: ['Black', 'Brown', 'Blue'],
      images: [
        { url: img('afinju_red_hero_1773322751923.png'), alt: 'Mules Hero', publicId: 'afinju/products/mules-hero' },
        { url: img('afinju_red_detail_1773322771608.png'), alt: 'Mules Detail', publicId: 'afinju/products/mules-detail' },
        { url: img('afinju_red_lifestyle_1773322801188.png'), alt: 'Mules Lifestyle', publicId: 'afinju/products/mules-lifestyle' },
      ],
      inventory: { launchEditionLimit: 100, soldCount: 0, allowBackorder: true },
    },
    {
      id: 'afinju-gobi-cap-collection',
      name: 'AFINJU Premium Gobi Cap',
      slug: 'afinju-premium-gobi-cap',
      description: 'The quintessential Yoruba cap (Fila), handcrafted to perfection. A symbol of pride, culture, and undeniable style.',
      features: ['Traditional Foldable Design', 'Hand-woven fabric', 'Structured base for shape retention', 'Available in multiple sizes'],
      items: ['Gobi Cap', 'Protective Box'],
      price: 45000,
      compareAtPrice: 55000,
      currency: 'NGN',
      colors: ['Red', 'Blue', 'Black', 'Brown'],
      images: [
        { url: img('afinju_brown_hero_1773322947363.png'), alt: 'Cap Hero', publicId: 'afinju/products/cap-hero' },
        { url: img('afinju_brown_detail_1773322964094.png'), alt: 'Cap Detail', publicId: 'afinju/products/cap-detail' },
        { url: img('afinju_blue_lifestyle_1773322849784.png'), alt: 'Cap Lifestyle', publicId: 'afinju/products/cap-lifestyle' },
      ],
      inventory: { launchEditionLimit: 500, soldCount: 0, allowBackorder: true },
    },
    {
      id: 'afinju-signature-oil-perfume',
      name: 'AFINJU Signature Oil Perfume',
      slug: 'afinju-signature-oil-perfume',
      description: 'A deep, masculine, and authoritative scent. Formulated as an oil to last 8-12 hours, leaving a memorable impression.',
      features: ['Concentrated oil formulation', '8-12 hour longevity', 'Woody and spicy notes', 'Premium glass bottle'],
      items: ['50ml Oil Perfume Bottle', 'Presentation Box'],
      price: 75000,
      compareAtPrice: 90000,
      currency: 'NGN',
      colors: [],
      images: [
        { url: img('afinju_black_hero_1773322894522.png'), alt: 'Perfume Hero', publicId: 'afinju/products/perfume-hero' },
        { url: img('afinju_black_detail_1773322910632.png'), alt: 'Perfume Detail', publicId: 'afinju/products/perfume-detail' },
        { url: img('afinju_red_lifestyle_1773322801188.png'), alt: 'Perfume Lifestyle', publicId: 'afinju/products/perfume-lifestyle' },
      ],
      inventory: { launchEditionLimit: 300, soldCount: 0, allowBackorder: true },
    },
  ]

  // ── Seed Firestore ────────────────────────────────────────────────────────
  console.log('📝  Seeding Firestore products...\n')

  for (const product of products) {
    await db.collection('products').doc(product.id).set({
      ...product,
      seo: {
        title: `${product.name} | Premium Nigerian Craftsmanship`,
        description: product.description,
      },
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    console.log(`  ✅  ${product.name}`)
  }

  // ── Seed Homepage Content ─────────────────────────────────────────────────
  console.log('\n📝  Seeding homepage content...\n')

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
      imageUrl: img('afinju_black_lifestyle_1773322925749.png'),
    },
    scarcityBanner: {
      enabled: true,
      text: 'Only 10 men will own this launch edition. Once it is closed, it is closed.',
    },
    updatedAt: Timestamp.now(),
  })
  console.log('  ✅  Homepage content')

  // ── Store Settings ────────────────────────────────────────────────────────
  await db.collection('config').doc('settings').set({
    storeName: 'AFINJU',
    whatsappNumber: '2347071861932',
    supportEmail: 'hello@afinju.com',
    shippingFee: 5000,
    paystackPublicKey: 'pk_test_99de4b14acaa95ef2ce3b8dd9d389064e4136d70',
    instagramUrl: 'https://instagram.com/afinju',
    twitterUrl: '',
    updatedAt: Timestamp.now(),
  })
  console.log('  ✅  Store settings')

  console.log('\n🚀  Done! All images uploaded to Cloudinary and Firestore seeded with 11 products.\n')
}

main().catch((err) => {
  console.error('❌  Failed:', err)
  process.exit(1)
})
