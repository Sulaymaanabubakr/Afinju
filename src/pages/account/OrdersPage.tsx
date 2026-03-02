import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { getUserOrders } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types'
import { format } from 'date-fns'

const statusColors: Record<string, string> = {
  pending_payment: 'text-yellow-600 bg-yellow-50',
  paid: 'text-blue-600 bg-blue-50',
  confirmed: 'text-blue-600 bg-blue-50',
  packaging: 'text-purple-600 bg-purple-50',
  dispatched: 'text-indigo-600 bg-indigo-50',
  out_for_delivery: 'text-orange-600 bg-orange-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
  refunded: 'text-gray-600 bg-gray-50',
}

export default function OrdersPage() {
  const { user } = useAuthStore()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', user?.uid],
    queryFn: () => getUserOrders(user!.uid),
    enabled: !!user,
  })

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <Link to="/account" className="font-sans text-xs tracking-wider uppercase text-afinju-black/40 hover:text-gold mb-4 block transition-colors">
            ← Account
          </Link>
          <p className="section-label mb-2">Order History</p>
          <h1 className="font-heading text-4xl">My Orders</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="skeleton h-28" />
            ))}
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-24 border border-black/8">
            <p className="font-heading text-xl text-afinju-black/40 mb-4">No orders yet</p>
            <Link to="/shop" className="btn-luxury inline-block">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="flex items-center justify-between p-6 bg-white border border-black/8 hover:border-gold/40 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-heading text-base">{order.orderNumber}</p>
                    <span className={`font-sans text-[10px] px-2 py-0.5 tracking-wider uppercase ${statusColors[order.status] || 'text-gray-600 bg-gray-50'}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-afinju-black/50">
                    {format(order.createdAt, 'MMM dd, yyyy')} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-heading text-lg">{formatPrice(order.total)}</p>
                  <ChevronRight size={16} className="text-afinju-black/30 group-hover:text-gold transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
