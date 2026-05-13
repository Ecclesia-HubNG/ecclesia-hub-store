import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SalesChart } from '@/components/admin/SalesChart'
import { OrderStatusBreakdown } from '@/components/admin/OrderStatusBreakdown'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getLast30Days() {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function fmtDay(iso: string) {
  const [, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={`rounded-xl p-5 border ${
      accent
        ? 'bg-[#4A0F1C] border-[#4A0F1C] text-white'
        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          accent ? 'bg-white/15' : 'bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30'
        }`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
      <p className={`text-sm mt-0.5 ${accent ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
        {label}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? 'text-white/50' : 'text-gray-400 dark:text-gray-600'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  paid:       'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  processing: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  shipped:    'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  delivered:  'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  cancelled:  'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
  refunded:   'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

// ─── icons ───────────────────────────────────────────────────────────────────

const icons = {
  revenue: (white?: boolean) => (
    <svg className={`w-5 h-5 ${white ? 'text-white' : 'text-[#6B1A2A]'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  orders: () => (
    <svg className="w-5 h-5 text-[#6B1A2A]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  customers: () => (
    <svg className="w-5 h-5 text-[#6B1A2A]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  products: () => (
    <svg className="w-5 h-5 text-[#6B1A2A]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
    </svg>
  ),
  warning: () => (
    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const [
    { data: orders },
    { count: customerCount },
    { data: products },
  ] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('id, name, stock, is_active, thumbnail, price'),
  ])

  // ── aggregates ──────────────────────────────────────────────────────────
  const revenueStatuses = ['paid', 'processing', 'shipped', 'delivered']
  const totalRevenue = orders
    ?.filter(o => revenueStatuses.includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0) ?? 0

  const totalOrders = orders?.length ?? 0
  const pendingOrders = orders?.filter(o => o.status === 'pending').length ?? 0
  const totalProducts = products?.length ?? 0
  const activeProducts = products?.filter(p => p.is_active).length ?? 0
  const lowStock = products?.filter(p => p.stock <= 5 && p.stock > 0) ?? []
  const outOfStock = products?.filter(p => p.stock === 0) ?? []

  // ── sales chart data (last 30 days) ─────────────────────────────────────
  const days = getLast30Days()
  const salesByDay = days.map(day => {
    const dayOrders = orders?.filter(o => {
      const d = o.created_at?.split('T')[0]
      return d === day && revenueStatuses.includes(o.status)
    }) ?? []
    return {
      date: fmtDay(day),
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
      orders: dayOrders.length,
    }
  })

  // ── order status breakdown ───────────────────────────────────────────────
  const statusCounts = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    .map(status => ({
      status,
      count: orders?.filter(o => o.status === status).length ?? 0,
    }))
    .filter(s => s.count > 0)

  // ── recent transactions ──────────────────────────────────────────────────
  const recentOrders = orders?.slice(0, 8) ?? []

  return (
    <div className="p-8 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          accent
          label="Total Revenue"
          value={fmt(totalRevenue)}
          sub={`${recentOrders.filter(o => revenueStatuses.includes(o.status)).length} paid orders`}
          icon={icons.revenue(true)}
        />
        <StatCard
          label="Total Orders"
          value={totalOrders.toString()}
          sub={`${pendingOrders} pending`}
          icon={icons.orders()}
        />
        <StatCard
          label="Customers"
          value={(customerCount ?? 0).toString()}
          sub="Registered accounts"
          icon={icons.customers()}
        />
        <StatCard
          label="Products"
          value={totalProducts.toString()}
          sub={`${activeProducts} active`}
          icon={icons.products()}
        />
      </div>

      {/* Sales chart + Order breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sales chart */}
        <div className="xl:col-span-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Sales overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Revenue over the last 30 days</p>
            </div>
          </div>
          <SalesChart data={salesByDay} />
        </div>

        {/* Order status breakdown */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Order status</h2>
          <p className="text-xs text-gray-400 mb-6">Breakdown of {totalOrders} orders</p>
          <OrderStatusBreakdown data={statusCounts} total={totalOrders} />
        </div>
      </div>

      {/* Recent transactions + Stock alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="xl:col-span-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent transactions</h2>
            <Link href="/admin/orders" className="text-xs text-[#6B1A2A] dark:text-[#D4849A] hover:underline">
              View all →
            </Link>
          </div>
          {!recentOrders.length ? (
            <p className="text-sm text-gray-400 text-center py-12">No transactions yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">ID</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-400">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">
                      {fmt(Number(order.total))}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">
                      {new Date(order.created_at).toLocaleDateString('en', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Stock alerts */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Stock alerts</h2>
            <Link href="/admin/products" className="text-xs text-[#6B1A2A] dark:text-[#D4849A] hover:underline">
              Manage →
            </Link>
          </div>

          {!outOfStock.length && !lowStock.length ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">All stocked up</p>
              <p className="text-xs text-gray-400 mt-1">No stock alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {outOfStock.map(p => (
                <div key={p.id} className="px-6 py-3 flex items-center gap-3">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-red-500 font-medium">Out of stock</p>
                  </div>
                  {icons.warning()}
                </div>
              ))}
              {lowStock.map(p => (
                <div key={p.id} className="px-6 py-3 flex items-center gap-3">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-amber-500">{p.stock} left</p>
                  </div>
                  {icons.warning()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
