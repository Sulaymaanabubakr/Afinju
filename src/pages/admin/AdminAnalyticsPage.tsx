import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllOrders } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types'
import { ChevronDown, Download, TrendingUp } from 'lucide-react'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'
import { exportDatasetAs, type ExportFormat } from '@/lib/adminExport'
import { useDismissiblePanel } from '@/hooks/useDismissiblePanel'

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="font-sans text-xs text-afinju-black/50 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-black/5">
        <div className="h-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-sans text-xs text-afinju-black/60 w-8 text-right">{value}</span>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: '#B0893E',
  paid: '#1F7A53',
  confirmed: '#2D5B9A',
  packaging: '#6D5A99',
  dispatched: '#1D7A8C',
  out_for_delivery: '#3C7C4C',
  delivered: '#2C9A5F',
  cancelled: '#9A3232',
  refunded: '#8D3F3F',
}

const PERIODS: Array<{ value: '7d' | '30d' | '90d' | 'all'; label: string }> = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
]

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement | null>(null)
  useDismissiblePanel(exportMenuRef, exportOpen, () => setExportOpen(false))

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => getAllOrders(),
    refetchOnWindowFocus: true,
  })

  const filteredOrders = useMemo(() => {
    const all = orders || []
    if (period === 'all') return all
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const cutoff = subDays(new Date(), days)
    return all.filter((o) => o.createdAt >= cutoff)
  }, [orders, period])

  const paidOrders = filteredOrders.filter((o) => o.paymentStatus === 'paid')
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0)
  const avgOrderValue = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0
  const pendingOrders = filteredOrders.filter((o) => o.paymentStatus === 'unpaid').length
  const conversionRate = filteredOrders.length ? Math.round((paidOrders.length / filteredOrders.length) * 100) : 0

  const statusCounts = filteredOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const colorCounts = filteredOrders.reduce((acc, o) => {
    o.items.forEach((item) => {
      const c = item.preferences?.preferredColor
      if (c) acc[c] = (acc[c] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const shoeSizeCounts = filteredOrders.reduce((acc, o) => {
    o.items.forEach((item) => {
      const s = item.preferences?.shoeSize
      if (s) acc[s] = (acc[s] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const headSizeCounts = filteredOrders.reduce((acc, o) => {
    o.items.forEach((item) => {
      const s = item.preferences?.headSize
      if (s) acc[s] = (acc[s] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const productCounts = filteredOrders.reduce((acc, o) => {
    o.items.forEach((item) => {
      acc[item.productName] = (acc[item.productName] || 0) + Number(item.quantity || 0)
    })
    return acc
  }, {} as Record<string, number>)

  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const trendDays = period === '7d' ? 7 : period === '30d' ? 14 : period === '90d' ? 30 : 30
  const revenueTrend = Array.from({ length: trendDays }, (_, i) => {
    const day = subDays(new Date(), trendDays - 1 - i)
    const key = format(day, 'yyyy-MM-dd')
    const dayRevenue = paidOrders
      .filter((o) => format(o.createdAt, 'yyyy-MM-dd') === key)
      .reduce((sum, o) => sum + o.total, 0)
    return {
      key,
      label: format(day, 'dd MMM'),
      revenue: dayRevenue,
    }
  })
  const maxTrend = Math.max(...revenueTrend.map((d) => d.revenue), 1)
  const maxColor = Math.max(...Object.values(colorCounts), 1)
  const maxShoe = Math.max(...Object.values(shoeSizeCounts), 1)
  const maxHead = Math.max(...Object.values(headSizeCounts), 1)

  const statusTotal = Object.values(statusCounts).reduce((sum, v) => sum + v, 0)
  const statusEntries = Object.entries(statusCounts).sort(([, a], [, b]) => b - a)
  const statusGradient = statusEntries.length
    ? (() => {
        let start = 0
        const stops = statusEntries.map(([status, count]) => {
          const pct = (count / statusTotal) * 100
          const end = start + pct
          const color = STATUS_COLORS[status] || '#B0893E'
          const segment = `${color} ${start}% ${end}%`
          start = end
          return segment
        })
        return `conic-gradient(${stops.join(', ')})`
      })()
    : 'conic-gradient(#efefef 0% 100%)'

  const analyticsExportRows = useMemo(() => {
    const rows: Array<Array<string | number>> = [
      ['Overview', 'Filtered Orders', filteredOrders.length],
      ['Overview', 'Paid Orders', paidOrders.length],
      ['Overview', 'Revenue', revenue],
      ['Overview', 'Avg Order Value', avgOrderValue],
      ['Overview', 'Pending Payments', pendingOrders],
      ['Overview', 'Conversion Rate %', conversionRate],
    ]
    statusEntries.forEach(([status, count]) => rows.push(['Status Breakdown', ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status, count]))
    Object.entries(colorCounts).forEach(([color, count]) => rows.push(['Colour Demand', color, count]))
    Object.entries(shoeSizeCounts).forEach(([size, count]) => rows.push(['Shoe Size Demand', size, count]))
    Object.entries(headSizeCounts).forEach(([size, count]) => rows.push(['Head Size Demand', size, count]))
    topProducts.forEach(([product, count]) => rows.push(['Top Products', product, count]))
    revenueTrend.forEach((point) => rows.push(['Revenue Trend', point.label, point.revenue]))
    return rows
  }, [filteredOrders.length, paidOrders.length, revenue, avgOrderValue, pendingOrders, conversionRate, statusEntries, colorCounts, shoeSizeCounts, headSizeCounts, topProducts, revenueTrend])

  const runExport = async (formatType: ExportFormat) => {
    if (!filteredOrders.length) {
      toast.error('No analytics data to export.')
      return
    }
    setExporting(true)
    setExportOpen(false)
    try {
      await exportDatasetAs(formatType, {
        fileBase: `afinju-analytics-${Date.now()}`,
        title: `AFINJU Analytics Report (${PERIODS.find((p) => p.value === period)?.label || 'Custom'})`,
        headers: ['Section', 'Metric', 'Value'],
        rows: analyticsExportRows,
      })
      toast.success(`${formatType.toUpperCase()} exported.`)
    } catch (err) {
      console.error(err)
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Analytics</h1>
          <p className="font-sans text-sm text-afinju-black/40">Detailed performance insights for admin decisions.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`font-sans text-xs px-3 py-2 tracking-wider uppercase border transition-colors ${
                  period === p.value ? 'bg-afinju-black text-white border-afinju-black' : 'border-black/15 hover:border-afinju-black'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
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
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Revenue', value: formatPrice(revenue) },
          { label: 'Paid Orders', value: paidOrders.length },
          { label: 'Avg Order', value: formatPrice(avgOrderValue) },
          { label: 'Filtered Orders', value: filteredOrders.length },
          { label: 'Pending', value: pendingOrders },
          { label: 'Conversion', value: `${conversionRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-black/8 p-5">
            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-afinju-black/40 mb-2">{label}</p>
            <p className="font-heading text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend chart */}
        <div className="lg:col-span-2 bg-white border border-black/8 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs tracking-[0.2em]">REVENUE TREND</h2>
            <span className="inline-flex items-center gap-1 font-sans text-xs text-emerald-700">
              <TrendingUp size={12} strokeWidth={1.8} />
              Paid Orders Only
            </span>
          </div>
          {revenueTrend.every((d) => d.revenue === 0) ? (
            <p className="font-sans text-sm text-afinju-black/30">No revenue data in selected period.</p>
          ) : (
            <div className="h-56 flex items-end gap-2 border-b border-black/10 pb-6">
              {revenueTrend.map((point) => (
                <div key={point.key} className="flex-1 min-w-0 text-center group">
                  <div
                    className="w-full bg-gold/80 group-hover:bg-gold transition-colors"
                    style={{ height: `${Math.max(4, (point.revenue / maxTrend) * 180)}px` }}
                    title={`${point.label}: ${formatPrice(point.revenue)}`}
                  />
                  <p className="mt-2 font-sans text-[10px] text-afinju-black/45 truncate">{point.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status distribution donut */}
        <div className="bg-white border border-black/8 p-6 space-y-5">
          <h2 className="font-display text-xs tracking-[0.2em]">STATUS DISTRIBUTION</h2>
          {statusEntries.length === 0 ? (
            <p className="font-sans text-sm text-afinju-black/30">No data yet.</p>
          ) : (
            <>
              <div className="mx-auto w-40 h-40 rounded-full" style={{ background: statusGradient }} />
              <div className="space-y-2">
                {statusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-sans text-xs text-afinju-black/60">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[status] || '#B0893E' }} />
                      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}
                    </span>
                    <span className="font-sans text-xs font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color preferences */}
        <div className="bg-white border border-black/8 p-6 space-y-4">
          <h2 className="font-display text-xs tracking-[0.2em]">COLOUR DEMAND</h2>
          {Object.keys(colorCounts).length === 0 ? (
            <p className="font-sans text-sm text-afinju-black/30">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(colorCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([color, count]) => (
                  <Bar key={color} label={color} value={count} max={maxColor} />
                ))}
            </div>
          )}
        </div>

        {/* Shoe sizes */}
        <div className="bg-white border border-black/8 p-6 space-y-4">
          <h2 className="font-display text-xs tracking-[0.2em]">SHOE SIZE DEMAND</h2>
          {Object.keys(shoeSizeCounts).length === 0 ? (
            <p className="font-sans text-sm text-afinju-black/30">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(shoeSizeCounts)
                .sort(([a], [b]) => String(a).localeCompare(String(b), undefined, { numeric: true }))
                .map(([size, count]) => (
                  <Bar key={size} label={size} value={count} max={maxShoe} />
                ))}
            </div>
          )}
        </div>

        {/* Head sizes */}
        <div className="bg-white border border-black/8 p-6 space-y-4">
          <h2 className="font-display text-xs tracking-[0.2em]">HEAD SIZE DEMAND</h2>
          {Object.keys(headSizeCounts).length === 0 ? (
            <p className="font-sans text-sm text-afinju-black/30">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(headSizeCounts)
                .sort(([a], [b]) => String(a).localeCompare(String(b), undefined, { numeric: true }))
                .map(([size, count]) => (
                  <Bar key={size} label={size} value={count} max={maxHead} />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Top products table */}
      <div className="bg-white border border-black/8 p-6 space-y-4">
        <h2 className="font-display text-xs tracking-[0.2em]">TOP PRODUCTS BY QUANTITY SOLD</h2>
        {topProducts.length === 0 ? (
          <p className="font-sans text-sm text-afinju-black/30">No product demand data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/8">
                  <th className="px-3 py-2 text-left font-sans text-[10px] tracking-[0.15em] uppercase text-afinju-black/40">Product</th>
                  <th className="px-3 py-2 text-left font-sans text-[10px] tracking-[0.15em] uppercase text-afinju-black/40">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map(([product, count]) => (
                  <tr key={product} className="border-b border-black/5">
                    <td className="px-3 py-3 font-sans text-sm">{product}</td>
                    <td className="px-3 py-3 font-sans text-sm">{count}</td>
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
