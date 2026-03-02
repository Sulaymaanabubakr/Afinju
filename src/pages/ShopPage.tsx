import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/lib/db'
import { formatPrice, cloudinaryOptimize } from '@/lib/utils'
import ScarcityCounter from '@/components/shared/ScarcityCounter'

function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-1/3" />
    </div>
  )
}

export default function ShopPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="bg-afinju-black text-afinju-cream py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="section-label text-gold/70 mb-4">The Collection</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-[0.15em] mb-6">
            SHOP
          </h1>
          <div className="gold-rule mx-auto mb-6" />
          <p className="font-body text-afinju-cream/60 text-lg max-w-md mx-auto">
            Each piece is crafted for the man who understands that standards are not negotiable.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : !products?.length ? (
            <div className="text-center py-24">
              <p className="font-heading text-2xl text-afinju-black/40">Collection coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link to={`/product/${product.slug}`} className="group block">
                    {/* Image */}
                    <div className="product-img-wrap aspect-[3/4] bg-afinju-cream mb-6 relative overflow-hidden">
                      <img
                        src={product.images[0]?.url || '/placeholder-product.jpg'}
                        alt={product.images[0]?.alt || product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Launch Edition Badge */}
                      {product.inventory.launchEditionLimit > 0 && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-afinju-black text-afinju-cream font-sans text-[10px] tracking-[0.2em] uppercase px-3 py-1.5">
                            Launch Edition
                          </span>
                        </div>
                      )}
                      {/* Hover CTA */}
                      <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-afinju-black text-afinju-cream w-full py-3 flex items-center justify-center gap-2 font-sans text-xs tracking-[0.2em] uppercase">
                          View Details <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <h2 className="font-heading text-xl group-hover:text-gold transition-colors duration-200">
                        {product.name}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-base font-medium">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice > product.price && (
                          <span className="font-sans text-sm text-afinju-black/40 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      <ScarcityCounter
                        limit={product.inventory.launchEditionLimit}
                        sold={product.inventory.soldCount}
                        compact
                      />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
