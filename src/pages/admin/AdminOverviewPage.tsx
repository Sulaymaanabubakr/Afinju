import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ShoppingBag, Users, TrendingUp, Package } from 'lucide-react'
import { getAllOrders, getProducts, getAllUsers } from '@/lib/db'
import { formatPrice } from '@/lib/utils'

function StatCard({ label, value, icon: Icon, sub, href }: {
  label: string
  value: string | number
  icon: any
  sub?: string
  href?: string
}) {
  const inner = (
    <div className="bg-white p-6 border border-black/8 hover:border-gold/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <p className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/40">{label}</p>
        <Icon size={16} strokeWidth={1.5} className="text-gold" />
      </div>
      <p className="font-heading text-2xl">{value}</p>
      {sub && <p className="font-sans text-xs text-afinju-black/40 mt-1">{sub}</p>}
    </div>
  )
  return href ? <Link to={href}>{inner}</Link> : <div>{inner}</div>
}

export default function AdminOverviewPage() {
  const { data: orders } = useQuery({ queryKey: ['admin-orders'], queryFn: () => getAllOrders() })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: getAllUsers })

  const paidOrders = orders?.filter(o => o.paymentStatus === 'paid') || []
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0)
  const product = products?.[0]
  const remaining = product
    ? product.inventory.launchEditionLimit - product.inventory.soldCount
    : 10

  const recentOrders = (orders || []).slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl mb-1">Dashboard</h1>
        <p className="font-sans text-sm text-afinju-black/40">AFINJU Admin Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatPrice(revenue)}
          icon={TrendingUp}
          sub={`${paidOrders.length} paid orders`}
          href="/admin/orders"
        />
        <StatCard
          label="Total Orders"
          value={orders?.length || 0}
          icon={ShoppingBag}
          sub="All time"
          href="/admin/orders"
        />
        <StatCard
          label="Units Remaining"
          value={`${remaining}/10`}
          icon={Package}
          sub="Launch edition"
          href="/admin/products"
        />
        <StatCard
          label="Customers"
          value={users?.length || 0}
          icon={Users}
          sub="Registered accounts"
          href="/admin/customers"
        />
      </div>

      {/* Launch Edition Progress */}
      <div className="bg-white border border-black/8 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg">Launch Edition Progress</h2>
          <span className="font-sans text-xs text-afinju-black/40">
            {product?.inventory.soldCount || 0} / {product?.inventory.launchEditionLimit || 10} claimed
          </span>
        </div>
        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-700"
            style={{ width: `${((product?.inventory.soldCount || 0) / (product?.inventory.launchEditionLimit || 10)) * 100}%` }}
          />
        </div>
        <p className="font-sans text-xs text-afinju-black/40 mt-2">
          {remaining} position{remaining !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-black/8">
        <div className="flex items-center justify-between p-6 border-b border-black/5">
          <h2 className="font-heading text-lg">Recent Orders</h2>
          <Link to="/admin/orders" className="font-sans text-xs text-gold hover:text-gold-dark transition-colors tracking-wider uppercase">
            View All
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="p-6 font-sans text-sm text-afinju-black/40">No orders yet.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-black/2 transition-colors"
              >
                <div>
                  <p className="font-sans text-sm font-medium">{order.customerName}</p>
                  <p className="font-sans text-xs text-afinju-black/40">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-sm">{formatPrice(order.total)}</p>
                  <span className={`font-sans text-[10px] uppercase tracking-wider ${
                    order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
