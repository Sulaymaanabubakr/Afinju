import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Download, Search } from 'lucide-react'
import { getAllOrders } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types'
import { format } from 'date-fns'

const STATUSES: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'All Orders' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const paymentBadge = (status: string) => {
  if (status === 'paid') return 'bg-green-50 text-green-700'
  if (status === 'refunded') return 'bg-red-50 text-red-700'
  return 'bg-yellow-50 text-yellow-700'
}

function exportCSV(orders: any[]) {
  const headers = ['Order Number', 'Customer', 'Phone', 'Total', 'Payment', 'Status', 'Date']
  const rows = orders.map(o => [
    o.orderNumber,
    o.customerName,
    o.customerPhone,
    o.total,
    o.paymentStatus,
    o.status,
    format(o.createdAt, 'yyyy-MM-dd'),
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `afinju-orders-${Date.now()}.csv`
  a.click()
}

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('')
  const [search, setSearch] = useState('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => getAllOrders(statusFilter || undefined),
  })

  const filtered = (orders || []).filter(o => {
    if (!search) return true
    const s = search.toLowerCase()
    return o.customerName.toLowerCase().includes(s) ||
      o.orderNumber.toLowerCase().includes(s) ||
      o.customerPhone.includes(s)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Orders</h1>
          <p className="font-sans text-sm text-afinju-black/40">{orders?.length || 0} total orders</p>
        </div>
        <button
          onClick={() => orders && exportCSV(orders)}
          className="flex items-center gap-2 font-sans text-xs tracking-wider uppercase border border-black/20 px-4 py-2 hover:border-gold transition-colors"
        >
          <Download size={13} strokeWidth={1.5} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-afinju-black/30" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by name, order number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-black/10 pl-9 pr-4 py-2 font-sans text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value as any)}
              className={`font-sans text-xs px-3 py-2 tracking-wider uppercase border transition-colors ${
                statusFilter === value
                  ? 'bg-afinju-black text-white border-afinju-black'
                  : 'border-black/15 hover:border-afinju-black'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-black/8 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-sans text-sm text-afinju-black/40">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5">
                  {['Order', 'Customer', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-[0.15em] uppercase text-afinju-black/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-black/2 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-sans text-xs font-medium">{order.orderNumber}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-sans text-sm font-medium">{order.customerName}</p>
                      <p className="font-sans text-xs text-afinju-black/40">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-sans text-sm">{formatPrice(order.total)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-sans text-[10px] px-2 py-1 uppercase tracking-wider ${paymentBadge(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-sans text-xs text-afinju-black/60">
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-sans text-xs text-afinju-black/40">
                        {format(order.createdAt, 'MMM dd, yyyy')}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-gold hover:text-gold-dark transition-colors"
                      >
                        <ChevronRight size={16} strokeWidth={1.5} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
