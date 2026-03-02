import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, HelpCircle, Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import { getProductBySlug } from '@/lib/db'
import { useCartStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { cloudinaryUrl } from '@/lib/cloudinary'
import ScarcityCounter from '@/components/shared/ScarcityCounter'
import { SHOE_SIZES, HEAD_SIZES, PRODUCT_COLORS, type ProductColor } from '@/types'
import { helpWhatsappLink } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: !!slug,
  })

  const [selectedImage, setSelectedImage] = useState(0)
  const [shoeSize, setShoeSize] = useState('')
  const [headSize, setHeadSize] = useState('')
  const [preferredColor, setPreferredColor] = useState<ProductColor | ''>('')
  const [qty, setQty] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const remaining = product
    ? product.inventory.launchEditionLimit - product.inventory.soldCount
    : 0

  const validate = () => {
    const e: Record<string, string> = {}
    if (!shoeSize) e.shoeSize = 'Please select your shoe size'
    if (!headSize) e.headSize = 'Please select your head size'
    if (!preferredColor) e.preferredColor = 'Please select a colour'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAddToCart = () => {
    if (!product || !validate()) return

    if (remaining <= 0) {
      toast.error('This edition is sold out.')
      return
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0]?.url || '',
      price: product.price,
      quantity: qty,
      preferences: {
        shoeSize,
        headSize,
        preferredColor: preferredColor as ProductColor,
      },
    })
    openCart()
    toast.success('Added to your selection.')
  }

  const handleBuyNow = () => {
    if (!product || !validate()) return
    handleAddToCart()
    navigate('/checkout')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="skeleton aspect-[3/4] lg:aspect-auto" />
        <div className="p-12 space-y-6">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-6 w-1/4" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl mb-4">Product not found</h2>
          <a href="/shop" className="btn-luxury">Back to Shop</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Images */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {/* Main image */}
          <div className="aspect-[4/5] bg-afinju-cream overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                src={cloudinaryUrl(product.images[selectedImage]?.url || '', { width: 1000, height: 1250, quality: 'auto' })}
                alt={product.images[selectedImage]?.alt || product.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-20 overflow-hidden transition-all duration-200 ${selectedImage === i
                      ? 'ring-1 ring-offset-1 ring-gold'
                      : 'opacity-60 hover:opacity-100'
                    }`}
                >
                  <img
                    src={cloudinaryUrl(img.url, { width: 128, height: 160, quality: 'auto' })}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="px-8 py-16 lg:px-14 xl:px-20 space-y-10">
          {/* Header */}
          <div>
            <div className="scarcity-pill mb-4">
              Launch Edition - {remaining > 0 ? `${remaining} Remaining` : 'Sold Out'}
            </div>
            <h1 className="font-heading text-3xl md:text-4xl leading-tight mb-4">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="font-sans text-2xl font-medium">{formatPrice(product.price)}</span>
              {product.compareAtPrice > product.price && (
                <>
                  <span className="font-sans text-lg text-afinju-black/40 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="bg-gold/10 text-gold-dark font-sans text-xs px-2 py-0.5 tracking-wider">
                    SAVE {formatPrice(product.compareAtPrice - product.price)}
                  </span>
                </>
              )}
            </div>
            <div className="mt-4">
              <ScarcityCounter
                limit={product.inventory.launchEditionLimit}
                sold={product.inventory.soldCount}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <p className="font-body text-base text-afinju-black/70 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* What's Included */}
          {product.items?.length > 0 && (
            <div>
              <p className="section-label mb-4">What's Included</p>
              <ul className="space-y-2">
                {product.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check size={14} className="text-gold flex-shrink-0" strokeWidth={2} />
                    <span className="font-sans text-sm text-afinju-black/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="h-px bg-black/8" />

          {/* ── PREFERENCE SELECTION (REQUIRED) ── */}
          <div className="space-y-8">
            <p className="font-display text-xs tracking-[0.25em] text-afinju-black/50">
              CUSTOMISE YOUR SET - ALL FIELDS REQUIRED
            </p>

            {/* Color */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-sans text-xs tracking-[0.15em] uppercase">
                  Preferred Colour
                  {errors.preferredColor && (
                    <span className="ml-2 text-destructive text-[10px]">{errors.preferredColor}</span>
                  )}
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                {PRODUCT_COLORS.map((color) => {
                  const colorMap: Record<string, string> = {
                    Blue: '#1E3A8A',
                    Red: '#991B1B',
                    Black: '#0A0A0A',
                    Brown: '#78350F',
                  }
                  return (
                    <button
                      key={color}
                      onClick={() => { setPreferredColor(color); setErrors(e => ({ ...e, preferredColor: '' })) }}
                      className={`group relative flex flex-col items-center gap-2 transition-all duration-150`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${preferredColor === color
                            ? 'border-gold scale-110'
                            : 'border-transparent hover:border-black/30'
                          }`}
                        style={{ backgroundColor: colorMap[color] }}
                      />
                      <span className={`font-sans text-[10px] tracking-wider uppercase transition-colors ${preferredColor === color ? 'text-afinju-black' : 'text-afinju-black/40'
                        }`}>
                        {color}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Shoe Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-sans text-xs tracking-[0.15em] uppercase">
                  Shoe Size (EU)
                  {errors.shoeSize && (
                    <span className="ml-2 text-destructive text-[10px]">{errors.shoeSize}</span>
                  )}
                </label>
                <a
                  href="/size-guide"
                  className="font-sans text-[10px] tracking-wider uppercase text-gold flex items-center gap-1"
                >
                  <HelpCircle size={11} /> Guide
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {SHOE_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setShoeSize(size); setErrors(e => ({ ...e, shoeSize: '' })) }}
                    className={`w-12 h-12 border font-sans text-sm transition-all duration-150 ${shoeSize === size
                        ? 'bg-afinju-black text-afinju-cream border-afinju-black'
                        : 'border-black/20 hover:border-afinju-black'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Head Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-sans text-xs tracking-[0.15em] uppercase">
                  Head Size
                  {errors.headSize && (
                    <span className="ml-2 text-destructive text-[10px]">{errors.headSize}</span>
                  )}
                </label>
                <a
                  href="/size-guide"
                  className="font-sans text-[10px] tracking-wider uppercase text-gold flex items-center gap-1"
                >
                  <HelpCircle size={11} /> How to Measure
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {HEAD_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setHeadSize(size); setErrors(e => ({ ...e, headSize: '' })) }}
                    className={`px-3 h-10 border font-sans text-xs tracking-wider transition-all duration-150 ${headSize === size
                        ? 'bg-afinju-black text-afinju-cream border-afinju-black'
                        : 'border-black/20 hover:border-afinju-black'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <label className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/50">Qty</label>
            <div className="flex items-center border border-black/20">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span className="w-10 text-center font-sans text-sm">{qty}</span>
              <button
                onClick={() => setQty(Math.min(remaining, qty + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* CTAs */}
          {remaining > 0 ? (
            <div className="space-y-3">
              <button onClick={handleBuyNow} className="btn-gold w-full text-sm py-4">
                Secure Your Position - {formatPrice(product.price * qty)}
              </button>
              <button onClick={handleAddToCart} className="btn-outline w-full text-xs">
                Add to Cart
              </button>
            </div>
          ) : (
            <div className="text-center py-6 border border-black/10">
              <p className="font-display text-sm tracking-[0.2em] text-afinju-black/40">SOLD OUT</p>
              <p className="font-body text-sm text-afinju-black/40 mt-1">This launch edition is closed.</p>
            </div>
          )}

          {/* Trust */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/8">
            {[
              { icon: ShieldCheck, text: 'Secure Paystack Payment' },
              { icon: Truck, text: 'Nationwide Delivery' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon size={14} className="text-gold flex-shrink-0" strokeWidth={1.5} />
                <span className="font-sans text-xs text-afinju-black/50">{text}</span>
              </div>
            ))}
          </div>

          {/* WhatsApp help */}
          <a
            href={helpWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border border-black/8 hover:border-gold/40 transition-colors duration-200 group"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
              alt="WhatsApp"
              className="w-5 h-5"
            />
            <div>
              <p className="font-sans text-xs font-medium">Need help with sizing?</p>
              <p className="font-sans text-[10px] text-afinju-black/40 tracking-wider">Chat with us on WhatsApp</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-afinju-black/30 group-hover:text-gold transition-colors" />
          </a>
        </div>
      </div>

      {/* Features Section */}
      {product.features?.length > 0 && (
        <section className="border-t border-black/8 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <p className="section-label text-center mb-12">Craftsmanship Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {product.features.map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <span className="font-display text-gold text-xs mt-1">0{i + 1}</span>
                  <p className="font-body text-base text-afinju-black/70">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
