import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, Package, Truck, Clock, MessageCircle } from 'lucide-react'
import { getOrderById } from '@/lib/db'
import { formatPrice, orderWhatsappLink } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types'
import { format } from 'date-fns'

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
    refetchOnWindowFocus: true,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="font-heading text-xl mb-4">Order not found</p>
          <Link to="/account/orders" className="btn-luxury">View My Orders</Link>
        </div>
      </div>
    )
  }

  const isPaid = order.paymentStatus === 'paid'
  const waLink = orderWhatsappLink(order.orderNumber || id!)

  return (
    <div className="min-h-screen bg-afinju-offwhite py-20 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Status header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-16"
        >
          {isPaid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-green-600" strokeWidth={1.5} />
              </div>
              <p className="section-label mb-2">Order Confirmed</p>
              <h1 className="font-heading text-3xl mb-3">Thank You.</h1>
              <p className="font-body text-afinju-black/60">
                You are now part of the select ten. Your authority set is being prepared.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-6">
                <Clock size={32} className="text-yellow-600" strokeWidth={1.5} />
              </div>
              <p className="section-label mb-2">Payment Pending</p>
              <h1 className="font-heading text-3xl mb-3">Order Received</h1>
              <p className="font-body text-afinju-black/60">
                Your order is saved. Complete payment to confirm your position.
              </p>
            </>
          )}
        </motion.div>

        {/* Order details card */}
        <div className="bg-white border border-black/8 p-8 space-y-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-xs text-afinju-black/40 tracking-wider uppercase">Order Number</p>
              <p className="font-heading text-lg">{order.orderNumber || id}</p>
            </div>
            <div className="text-right">
              <p className="font-sans text-xs text-afinju-black/40 tracking-wider uppercase">Date</p>
              <p className="font-sans text-sm">{format(order.createdAt, 'MMM dd, yyyy')}</p>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-black/5 pt-6 space-y-4">
            <p className="font-display text-xs tracking-[0.2em]">YOUR ORDER</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <p className="font-heading text-base">{item.productName}</p>
                  <p className="font-sans text-xs text-afinju-black/50 mt-1">
                    {item.preferences.preferredColor} · Shoe {item.preferences.shoeSize} · Head {item.preferences.headSize}
                  </p>
                  <p className="font-sans text-xs text-afinju-black/50">Qty: {item.quantity}</p>
                </div>
                <p className="font-sans text-sm">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-black/5 pt-6 space-y-2">
            <div className="flex justify-between font-sans text-sm">
              <span className="text-afinju-black/50">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between font-sans text-sm">
              <span className="text-afinju-black/50">Shipping</span>
              <span>{formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-heading text-xl border-t border-black/5 pt-3 mt-3">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Delivery */}
          <div className="border-t border-black/5 pt-6">
            <p className="font-display text-xs tracking-[0.2em] mb-3">DELIVERY TO</p>
            <div className="flex gap-3">
              <Truck size={16} className="text-gold flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-sans text-sm font-medium">{order.customerName}</p>
                <p className="font-sans text-sm text-afinju-black/60">
                  {order.deliveryAddress.fullAddress}, {order.deliveryAddress.city}, {order.deliveryAddress.state}
                </p>
                <p className="font-sans text-sm text-afinju-black/60">{order.customerPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white border border-black/8 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Package size={16} className="text-gold" strokeWidth={1.5} />
            <p className="font-display text-xs tracking-[0.2em]">ORDER STATUS</p>
          </div>
          <div className="space-y-4">
            {order.statusTimeline.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === order.statusTimeline.length - 1 ? 'bg-gold' : 'bg-afinju-black/20'}`} />
                  {i < order.statusTimeline.length - 1 && (
                    <div className="w-px flex-1 bg-black/10 my-1.5" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-sans text-sm font-medium">
                    {ORDER_STATUS_LABELS[entry.status]}
                  </p>
                  {entry.note && (
                    <p className="font-sans text-xs text-afinju-black/50 mt-0.5">{entry.note}</p>
                  )}
                  <p className="font-sans text-xs text-afinju-black/30 mt-1">
                    {format(entry.timestamp, 'MMM dd, yyyy · h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/account/orders" className="btn-outline flex-1 text-center">
            Track My Orders
          </Link>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 border border-green-600 text-green-700 py-4 px-6 font-sans text-xs tracking-[0.18em] uppercase hover:bg-green-600 hover:text-white transition-colors duration-200"
          >
            <MessageCircle size={14} />
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  )
}
