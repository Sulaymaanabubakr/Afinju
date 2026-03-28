import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Truck, MessageCircle, Package } from 'lucide-react'
import { getOrderById } from '@/lib/db'
import { formatPrice, orderWhatsappLink } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types'
import { format } from 'date-fns'

export default function OrderDetailPage() {
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-xl mb-4">Order not found</p>
          <Link to="/account/orders" className="btn-luxury inline-block">My Orders</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/account/orders" className="font-sans text-xs tracking-wider uppercase text-afinju-black/40 hover:text-gold mb-8 block transition-colors">
          ← My Orders
        </Link>

        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="section-label mb-1">Order Detail</p>
            <h1 className="font-heading text-3xl">{order.orderNumber}</h1>
            <p className="font-sans text-sm text-afinju-black/40 mt-1">
              Placed {format(order.createdAt, 'MMMM dd, yyyy')}
            </p>
          </div>
          <a
            href={orderWhatsappLink(order.orderNumber || id!)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-green-500 text-green-700 px-4 py-2 font-sans text-xs tracking-wider hover:bg-green-600 hover:text-white transition-colors"
          >
            <MessageCircle size={12} />
            WhatsApp
          </a>
        </div>

        {/* Status Timeline */}
        <div className="bg-white border border-black/8 p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Package size={16} className="text-gold" strokeWidth={1.5} />
            <p className="font-display text-xs tracking-[0.2em]">DELIVERY PROGRESS</p>
          </div>
          <div className="space-y-4">
            {order.statusTimeline.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${i === order.statusTimeline.length - 1 ? 'bg-gold' : 'bg-black/20'}`} />
                  {i < order.statusTimeline.length - 1 && (
                    <div className="w-px flex-1 bg-black/10 my-1" />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="font-sans text-sm font-medium">{ORDER_STATUS_LABELS[entry.status]}</p>
                  {entry.note && (
                    <p className="font-sans text-xs text-afinju-black/50 mt-0.5 leading-relaxed">{entry.note}</p>
                  )}
                  <p className="font-sans text-xs text-afinju-black/30 mt-1">
                    {format(entry.timestamp, 'MMM dd, yyyy · h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-black/8 p-8 mb-6">
          <p className="font-display text-xs tracking-[0.2em] mb-6">ITEMS</p>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start pb-4 border-b border-black/5 last:border-0 last:pb-0">
                <div>
                  <p className="font-heading text-base">{item.productName}</p>
                  <p className="font-sans text-xs text-afinju-black/50 mt-1">
                    {item.preferences.preferredColor} · Shoe {item.preferences.shoeSize} · Head {item.preferences.headSize}
                  </p>
                  <p className="font-sans text-xs text-afinju-black/40">Qty: {item.quantity}</p>
                </div>
                <p className="font-sans text-sm">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-black/5 mt-6 pt-4 space-y-2">
            <div className="flex justify-between font-sans text-sm text-afinju-black/50">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between font-sans text-sm text-afinju-black/50">
              <span>Shipping</span><span>{formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between font-heading text-xl pt-2 border-t border-black/5">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white border border-black/8 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Truck size={16} className="text-gold" strokeWidth={1.5} />
            <p className="font-display text-xs tracking-[0.2em]">DELIVERY DETAILS</p>
          </div>
          <div className="font-sans text-sm space-y-1">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-afinju-black/60">{order.deliveryAddress.fullAddress}</p>
            <p className="text-afinju-black/60">{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
            <p className="text-afinju-black/60">{order.customerPhone}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
