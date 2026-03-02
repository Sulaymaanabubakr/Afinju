import { useQuery } from '@tanstack/react-query'
import { getAllOrders } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types'

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="font-sans text-xs text-afinju-black/50 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-black/5">
        <div className="h-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-sans text-xs text-afinju-black/60 w-6 text-right">{value}</span>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { data: orders } = useQuery({ queryKey: ['admin-orders'], queryFn: () => getAllOrders() })

  const paidOrders = (orders || []).filter(o => o.paymentStatus === 'paid')
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0)
  const avgOrderValue = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0

  const statusCounts = (orders || []).reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const colorCounts = (orders || []).reduce((acc, o) => {
    o.items.forEach(item => {
      const c = item.preferences?.preferredColor
      if (c) acc[c] = (acc[c] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const shoeSizeCounts = (orders || []).reduce((acc, o) => {
    o.items.forEach(item => {
      const s = item.preferences?.shoeSize
      if (s) acc[s] = (acc[s] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const maxColor = Math.max(...Object.values(colorCounts), 1)
  const maxSize = Math.max(...Object.values(shoeSizeCounts), 1)

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl">Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatPrice(revenue) },
          { label: 'Paid Orders', value: paidOrders.length },
          { label: 'Avg Order Value', value: formatPrice(avgOrderValue) },
          { label: 'Total Orders', value: orders?.length || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-black/8 p-6">
            <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-afinju-black/40 mb-2">{label}</p>
            <p className="font-heading text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white border border-black/8 p-6 space-y-4">
          <h2 className="font-display text-xs tracking-[0.2em]">STATUS BREAKDOWN</h2>
          {Object.entries(statusCounts).length === 0 ? (
            <p className="font-sans text-sm text-afinju-black/30">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="font-sans text-xs text-afinju-black/60">
                    {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}
                  </span>
                  <span className="font-sans text-xs font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Color Preferences */}
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

        {/* Shoe Size Distribution */}
        <div className="bg-white border border-black/8 p-6 space-y-4">
          <h2 className="font-display text-xs tracking-[0.2em]">SHOE SIZES</h2>
          {Object.keys(shoeSizeCounts).length === 0 ? (
            <p className="font-sans text-sm text-afinju-black/30">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(shoeSizeCounts)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([size, count]) => (
                  <Bar key={size} label={size} value={count} max={maxSize} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
