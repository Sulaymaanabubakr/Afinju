import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Download, Search } from 'lucide-react'
import { getAllOrders } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from '@/types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useDismissiblePanel } from '@/hooks/useDismissiblePanel'
import { exportDatasetAs, type ExportFormat } from '@/lib/adminExport'

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
const GROUP_ORDER: OrderStatus[] = [
  'pending_payment',
  'paid',
  'confirmed',
  'packaging',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

const paymentBadge = (status: string) => {
  if (status === 'paid') return 'bg-green-50 text-green-700'
  if (status === 'refunded') return 'bg-red-50 text-red-700'
  return 'bg-yellow-50 text-yellow-700'
}

type ExportRow = {
  orderNumber: string
  customer: string
  phone: string
  email: string
  items: string
  delivery: string
  total: number
  payment: string
  status: string
  date: string
}

function buildExportRows(orders: Order[]): ExportRow[] {
  return orders.map((o) => ({
    orderNumber: o.orderNumber,
    customer: o.customerName,
    phone: o.customerPhone || '',
    email: o.customerEmail || '',
    items: (o.items || []).map((i) => `${i.productName} x${i.quantity}`).join(' | '),
    delivery: [o.deliveryAddress?.fullAddress, o.deliveryAddress?.city, o.deliveryAddress?.state].filter(Boolean).join(', '),
    total: Number(o.total || 0),
    payment: o.paymentStatus,
    status: ORDER_STATUS_LABELS[o.status] || o.status,
    date: format(o.createdAt, 'yyyy-MM-dd HH:mm'),
  }))
}

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('')
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const navigate = useNavigate()
  const exportMenuRef = useRef<HTMLDivElement | null>(null)
  useDismissiblePanel(exportMenuRef, exportOpen, () => setExportOpen(false))

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => getAllOrders(statusFilter || undefined),
    refetchOnWindowFocus: true,
  })

  const filtered = (orders || []).filter((o) => {
    if (!search) return true
    const s = search.toLowerCase()
    return o.customerName.toLowerCase().includes(s) ||
      o.orderNumber.toLowerCase().includes(s) ||
      o.customerPhone.includes(s)
  })
  const exportRows = useMemo(() => buildExportRows(filtered as Order[]), [filtered])
  const exportHeaders = ['Order Number', 'Customer', 'Phone', 'Email', 'Items', 'Delivery Address', 'Total (NGN)', 'Payment', 'Status', 'Date']
  const exportDatasetRows = useMemo(
    () =>
      exportRows.map((r) => [
        r.orderNumber,
        r.customer,
        r.phone,
        r.email,
        r.items,
        r.delivery,
        r.total,
        r.payment,
        r.status,
        r.date,
      ]),
    [exportRows]
  )

  const runExport = async (formatType: ExportFormat) => {
    if (!filtered.length) {
      toast.error('No orders to export.')
      return
    }
    setExporting(true)
    setExportOpen(false)
    try {
      await exportDatasetAs(formatType, {
        fileBase: `afinju-orders-${format(new Date(), 'yyyyMMdd-HHmm')}`,
        title: 'AFINJU Orders Report',
        headers: exportHeaders,
        rows: exportDatasetRows,
      })
      toast.success(`${formatType.toUpperCase()} exported.`)
    } catch (err) {
      console.error(err)
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const grouped = GROUP_ORDER
    .map((status) => ({
      status,
      label: ORDER_STATUS_LABELS[status],
      orders: filtered.filter((o) => o.status === status),
    }))
    .filter((group) => group.orders.length > 0)

  const renderOrdersTable = (rows: typeof filtered) => (
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
          {rows.map(order => (
            <tr
              key={order.id}
              className="hover:bg-black/2 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/orders/${order.id}`)}
            >
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Orders</h1>
          <p className="font-sans text-sm text-afinju-black/40">{orders?.length || 0} total orders</p>
        </div>
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={exporting}
            className="flex items-center gap-2 font-sans text-xs tracking-wider uppercase border border-black/20 px-4 py-2 hover:border-gold transition-colors disabled:opacity-50"
          >
            <Download size={13} strokeWidth={1.5} />
            {exporting ? 'Exporting...' : 'Export'}
            <ChevronDown size={12} strokeWidth={1.8} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-black/10 shadow-lg z-20">
              {[
                ['pdf', 'Export as PDF'],
                ['excel', 'Export as Excel'],
                ['doc', 'Export as DOC'],
                ['csv', 'Export as CSV'],
                ['png', 'Export as PNG'],
                ['jpg', 'Export as JPG'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => runExport(value as ExportFormat)}
                    className="w-full text-left px-3 py-2 text-xs font-sans tracking-wide hover:bg-black/5 transition-colors"
                  >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
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
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white border border-black/8 p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-black/8 p-12 text-center">
            <p className="font-sans text-sm text-afinju-black/40">No orders found.</p>
          </div>
        ) : statusFilter ? (
          <section className="bg-white border border-black/8 overflow-hidden">
            <div className="px-4 py-3 border-b border-black/8 bg-afinju-black/[0.015] flex items-center justify-between">
              <h2 className="font-display text-xs tracking-[0.18em] uppercase">{ORDER_STATUS_LABELS[statusFilter]}</h2>
              <span className="font-sans text-xs text-afinju-black/45">{filtered.length} order(s)</span>
            </div>
            {renderOrdersTable(filtered)}
          </section>
        ) : (
          grouped.map((group) => (
            <section key={group.status} className="bg-white border border-black/8 overflow-hidden">
              <div className="px-4 py-3 border-b border-black/8 bg-afinju-black/[0.015] flex items-center justify-between">
                <h2 className="font-display text-xs tracking-[0.18em] uppercase">{group.label}</h2>
                <span className="font-sans text-xs text-afinju-black/45">{group.orders.length} order(s)</span>
              </div>
              {renderOrdersTable(group.orders)}
            </section>
          ))
        )}
      </div>
    </div>
  )
}
