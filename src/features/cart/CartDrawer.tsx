import { AnimatePresence, motion } from 'framer-motion'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { cloudinaryUrl } from '@/lib/cloudinary'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total } = useCartStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-afinju-offwhite flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-black/8">
              <div>
                <h2 className="font-display text-sm tracking-[0.2em]">Your Selection</h2>
                {items.length > 0 && (
                  <p className="font-sans text-xs text-afinju-black/40 mt-0.5">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={closeCart}
                className="text-afinju-black/40 hover:text-afinju-black transition-colors p-1"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <ShoppingBag size={40} strokeWidth={1} className="text-afinju-black/20" />
                  <div>
                    <p className="font-heading text-lg text-afinju-black/40">Your cart is empty</p>
                    <p className="font-sans text-xs text-afinju-black/30 mt-1 tracking-wider">The authority set awaits.</p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="btn-outline mt-4 text-xs"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      {/* Image */}
                      <div className="w-20 h-24 flex-shrink-0 bg-afinju-cream overflow-hidden">
                        <img
                          src={cloudinaryUrl(item.productImage, { width: 160, height: 192, quality: 'auto' })}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-sm leading-tight">{item.productName}</h3>
                        {item.preferences && (
                          <div className="mt-1 space-y-0.5">
                            <p className="font-sans text-xs text-afinju-black/50">
                              Color: {item.preferences.preferredColor}
                            </p>
                            <p className="font-sans text-xs text-afinju-black/50">
                              Shoe: {item.preferences.shoeSize} · Head: {item.preferences.headSize}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 border border-black/20 text-sm flex items-center justify-center hover:border-black transition-colors"
                            >
                              −
                            </button>
                            <span className="font-sans text-sm w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 border border-black/20 text-sm flex items-center justify-center hover:border-black transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-afinju-black/30 hover:text-destructive transition-colors"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <p className="font-sans text-sm font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/8 px-8 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs tracking-widest uppercase text-afinju-black/50">Subtotal</span>
                  <span className="font-heading text-lg">{formatPrice(total())}</span>
                </div>
                <p className="font-sans text-xs text-afinju-black/40">Shipping calculated at checkout</p>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="btn-luxury w-full text-center block"
                >
                  Proceed to Checkout
                </Link>
                <button
                  onClick={closeCart}
                  className="btn-outline w-full text-center text-xs"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
