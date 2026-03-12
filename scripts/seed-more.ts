import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import path from 'path'

// Initialise Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require(path.resolve('./service-account.json'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function seedMore() {
  console.log('🌱  Starting AFINJU seed for more products...\n')

  const products = [
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
      items: [
        'Red Velvet Half Shoe',
        'Matching Red Velvet Clutch',
        'Matching Red Gobi Cap',
      ],
      price: 220000,
      compareAtPrice: 280000,
      currency: 'NGN',
      colors: ['Red'],
      images: [
        { url: '/products/afinju_red_hero_1773322751923.png', alt: 'Red Authority Set Hero', publicId: 'local/red-hero' },
        { url: '/products/afinju_red_detail_1773322771608.png', alt: 'Red Authority Set Detail', publicId: 'local/red-detail' },
        { url: '/products/afinju_red_lifestyle_1773322801188.png', alt: 'Red Authority Set Lifestyle', publicId: 'local/red-lifestyle' },
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
      items: [
        'Royal Blue Velvet Half Shoe',
        'Matching Blue Velvet Clutch',
        'Matching Blue Gobi Cap',
      ],
      price: 220000,
      compareAtPrice: 280000,
      currency: 'NGN',
      colors: ['Blue'],
      images: [
        { url: '/products/afinju_blue_hero_1773322816739.png', alt: 'Blue Authority Set Hero', publicId: 'local/blue-hero' },
        { url: '/products/afinju_blue_detail_1773322831998.png', alt: 'Blue Authority Set Detail', publicId: 'local/blue-detail' },
        { url: '/products/afinju_blue_lifestyle_1773322849784.png', alt: 'Blue Authority Set Lifestyle', publicId: 'local/blue-lifestyle' },
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
      items: [
        'Black Velvet Half Shoe',
        'Matching Black Velvet Clutch',
        'Matching Black Gobi Cap',
      ],
      price: 220000,
      compareAtPrice: 280000,
      currency: 'NGN',
      colors: ['Black'],
      images: [
        { url: '/products/afinju_black_hero_1773322894522.png', alt: 'Black Authority Set Hero', publicId: 'local/black-hero' },
        { url: '/products/afinju_black_detail_1773322910632.png', alt: 'Black Authority Set Detail', publicId: 'local/black-detail' },
        { url: '/products/afinju_black_lifestyle_1773322925749.png', alt: 'Black Authority Set Lifestyle', publicId: 'local/black-lifestyle' },
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
      items: [
        'Brown Velvet Half Shoe',
        'Matching Brown Velvet Clutch',
        'Matching Brown Gobi Cap',
      ],
      price: 220000,
      compareAtPrice: 280000,
      currency: 'NGN',
      colors: ['Brown'],
      images: [
        { url: '/products/afinju_brown_hero_1773322947363.png', alt: 'Brown Authority Set Hero', publicId: 'local/brown-hero' },
        { url: '/products/afinju_brown_detail_1773322964094.png', alt: 'Brown Authority Set Detail', publicId: 'local/brown-detail' },
        // Placeholder for missing lifestyle shot due to rate limit, fallback to detail shot
        { url: '/products/afinju_brown_detail_1773322964094.png', alt: 'Brown Authority Set Lifestyle', publicId: 'local/brown-lifestyle' },
      ],
      inventory: { launchEditionLimit: 50, soldCount: 0, allowBackorder: false },
    },
    // The following 6 products are placeholders with generic unsplash URLs
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
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=90', alt: 'Briefcase Hero', publicId: 'local/briefcase-hero' },
        { url: 'https://images.unsplash.com/photo-1547949007-56e6ca97bcda?w=1200&q=90', alt: 'Briefcase Detail', publicId: 'local/briefcase-detail' },
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=90', alt: 'Briefcase Lifestyle', publicId: 'local/briefcase-lifestyle' },
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
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=90', alt: 'Loafers Hero', publicId: 'local/loafers-hero' },
        { url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=90', alt: 'Loafers Detail', publicId: 'local/loafers-detail' },
        { url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=1200&q=90', alt: 'Loafers Lifestyle', publicId: 'local/loafers-lifestyle' },
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
        { url: 'https://images.unsplash.com/photo-1540224871915-bc8ffb782bdf?w=1200&q=90', alt: 'Agbada Hero', publicId: 'local/agbada-hero' },
        { url: 'https://images.unsplash.com/photo-1512408389658-0ce8a4be0178?w=1200&q=90', alt: 'Agbada Detail', publicId: 'local/agbada-detail' },
        { url: 'https://images.unsplash.com/photo-1540224871915-bc8ffb782bdf?w=1200&q=90', alt: 'Agbada Lifestyle', publicId: 'local/agbada-lifestyle' },
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
      price: 850000,
      compareAtPrice: 100000,
      currency: 'NGN',
      colors: ['Black', 'Brown', 'Blue'],
      images: [
        { url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&q=90', alt: 'Mules Hero', publicId: 'local/mules-hero' },
        { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=90', alt: 'Mules Detail', publicId: 'local/mules-detail' },
        { url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&q=90', alt: 'Mules Lifestyle', publicId: 'local/mules-lifestyle' },
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
        { url: 'https://images.unsplash.com/photo-1533682805518-48d1f5b8cb3a?w=1200&q=90', alt: 'Cap Hero', publicId: 'local/cap-hero' },
        { url: 'https://images.unsplash.com/photo-1588661706680-e3f421b8eb58?w=1200&q=90', alt: 'Cap Detail', publicId: 'local/cap-detail' },
        { url: 'https://images.unsplash.com/photo-1533682805518-48d1f5b8cb3a?w=1200&q=90', alt: 'Cap Lifestyle', publicId: 'local/cap-lifestyle' },
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
        { url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90', alt: 'Perfume Hero', publicId: 'local/perfume-hero' },
        { url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90', alt: 'Perfume Detail', publicId: 'local/perfume-detail' },
        { url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=90', alt: 'Perfume Lifestyle', publicId: 'local/perfume-lifestyle' },
      ],
      inventory: { launchEditionLimit: 300, soldCount: 0, allowBackorder: true },
    }
  ]

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
    console.log('✅  Product created:', product.id)
  }

  console.log('\n🚀  Seed complete. Added 10 products.\n')
}

seedMore().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
