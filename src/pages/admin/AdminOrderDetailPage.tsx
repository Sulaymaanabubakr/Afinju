import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, MessageCircle, Mail, ChevronDown } from 'lucide-react'
import { getOrderById, updateOrderStatus } from '@/lib/db'
import { formatPrice, whatsappLink, BRAND_WHATSAPP } from '@/lib/utils'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ALL_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'confirmed', label: 'Order Confirmed' },
  { value: 'packaging', label: 'Being Packaged' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('')
  const [note, setNote] = useState('')
  const [internalNote, setInternalNote] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: () => updateOrderStatus(
      id!,
      newStatus as OrderStatus,
      note || undefined,
      internalNote || undefined
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      setNote('')
      setInternalNote('')
      setNewStatus('')
      toast.success('Order status updated.')
    },
    onError: () => toast.error('Failed to update status.'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="font-sans text-sm text-afinju-black/40">Order not found.</p>
        <Link to="/admin/orders" className="btn-outline inline-block mt-4">Back to Orders</Link>
      </div>
    )
  }

  const waGreeting = `Hello ${order.customerName}, this is AFINJU regarding your order #${order.orderNumber}.`
  const waLink = whatsappLink(order.customerPhone, waGreeting)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/orders" className="font-sans text-xs text-afinju-black/40 hover:text-gold mb-2 block transition-colors">
            ← Orders
          </Link>
          <h1 className="font-heading text-2xl">{order.orderNumber}</h1>
          <p className="font-sans text-sm text-afinju-black/40">
            {format(order.createdAt, 'MMMM dd, yyyy · h:mm a')}
          </p>
        </div>
        <span className={`font-sans text-xs px-3 py-1.5 uppercase tracking-wider ${
          order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          {order.paymentStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="bg-white border border-black/8 p-6">
            <h2 className="font-display text-xs tracking-[0.2em] mb-4">CUSTOMER</h2>
            <div className="space-y-2 mb-6">
              <p className="font-heading text-base">{order.customerName}</p>
              <p className="font-sans text-sm text-afinju-black/60">{order.customerPhone}</p>
              {order.customerAltPhone && (
                <p className="font-sans text-sm text-afinju-black/60">Alt: {order.customerAltPhone}</p>
              )}
              {order.customerEmail && (
                <p className="font-sans text-sm text-afinju-black/60">{order.customerEmail}</p>
              )}
            </div>

            {/* Outreach */}
            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:${order.customerPhone}`}
                className="flex items-center gap-2 border border-black/15 px-4 py-2 font-sans text-xs tracking-wider hover:border-afinju-black transition-colors"
              >
                <Phone size={12} strokeWidth={2} /> Call
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-green-500 text-green-700 px-4 py-2 font-sans text-xs tracking-wider hover:bg-green-600 hover:text-white transition-colors"
              >
                <MessageCircle size={12} strokeWidth={2} /> WhatsApp
              </a>
              {order.customerEmail && (
                <a
                  href={`mailto:${order.customerEmail}?subject=Your AFINJU Order ${order.orderNumber}`}
                  className="flex items-center gap-2 border border-black/15 px-4 py-2 font-sans text-xs tracking-wider hover:border-afinju-black transition-colors"
                >
                  <Mail size={12} strokeWidth={2} /> Email
                </a>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border border-black/8 p-6">
            <h2 className="font-display text-xs tracking-[0.2em] mb-4">ORDER ITEMS</h2>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start pb-4 border-b border-black/5 last:pb-0 last:border-0">
                  <div>
                    <p className="font-heading text-sm">{item.productName}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="font-sans text-xs text-afinju-black/50 bg-black/5 px-2 py-0.5">
                        {item.preferences.preferredColor}
                      </span>
                      <span className="font-sans text-xs text-afinju-black/50 bg-black/5 px-2 py-0.5">
                        Shoe {item.preferences.shoeSize}
                      </span>
                      <span className="font-sans text-xs text-afinju-black/50 bg-black/5 px-2 py-0.5">
                        Head {item.preferences.headSize}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-afinju-black/40 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-sans text-sm">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-black/5 mt-4 pt-4 space-y-1">
              <div className="flex justify-between font-sans text-xs text-afinju-black/50">
                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between font-sans text-xs text-afinju-black/50">
                <span>Shipping</span><span>{formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-heading text-lg">
                <span>Total</span><span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white border border-black/8 p-6">
            <h2 className="font-display text-xs tracking-[0.2em] mb-4">DELIVERY ADDRESS</h2>
            <p className="font-sans text-sm text-afinju-black/70">
              {order.deliveryAddress.fullAddress}<br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state}
              {order.deliveryAddress.landmark && <><br /><span className="text-afinju-black/40">Near: {order.deliveryAddress.landmark}</span></>}
            </p>
          </div>

          {/* Payment */}
          {order.paymentReference && (
            <div className="bg-white border border-black/8 p-6">
              <h2 className="font-display text-xs tracking-[0.2em] mb-3">PAYMENT REFERENCE</h2>
              <code className="font-sans text-sm bg-black/5 px-3 py-1.5">{order.paymentReference}</code>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white border border-black/8 p-6">
            <h2 className="font-display text-xs tracking-[0.2em] mb-4">UPDATE STATUS</h2>
            <div className="space-y-4">
              <div className="relative">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full border border-black/15 px-3 py-2 font-sans text-sm bg-white focus:outline-none focus:border-gold appearance-none"
                >
                  <option value="">Select new status...</option>
                  {ALL_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-afinju-black/40 pointer-events-none" />
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Customer-facing note (optional)"
                rows={2}
                className="w-full border border-black/10 px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:border-gold transition-colors"
              />

              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Internal note (not shown to customer)"
                rows={2}
                className="w-full border border-black/10 px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:border-gold transition-colors bg-yellow-50/50"
              />

              <button
                onClick={() => newStatus && updateMutation.mutate()}
                disabled={!newStatus || updateMutation.isPending}
                className="btn-luxury w-full text-xs py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white border border-black/8 p-6">
            <h2 className="font-display text-xs tracking-[0.2em] mb-4">STATUS HISTORY</h2>
            <div className="space-y-3">
              {[...order.statusTimeline].reverse().map((entry, i) => (
                <div key={i} className="border-l-2 border-black/10 pl-3 py-1">
                  <p className="font-sans text-xs font-medium">{ORDER_STATUS_LABELS[entry.status]}</p>
                  {entry.note && (
                    <p className="font-sans text-xs text-afinju-black/50 mt-0.5">{entry.note}</p>
                  )}
                  {entry.internalNote && (
                    <p className="font-sans text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 mt-0.5">
                      🔒 {entry.internalNote}
                    </p>
                  )}
                  <p className="font-sans text-[10px] text-afinju-black/30 mt-1">
                    {format(entry.timestamp, 'MMM dd · h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
