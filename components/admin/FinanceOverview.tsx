'use client'

import { useMemo } from 'react'
import Link from 'next/link'

type Order = {
  id: string
  total: number
  status: string
  created_at: string
  shipping_address: { firstName?: string; lastName?: string; email?: string } | null
  payment_reference: string | null
}

type Product = {
  id: string
  name: string
  price: number
  cost_price: number | null
  stock: number
  is_active: boolean
}

const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

function ngn(amount: number) {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtShort(val: number) {
  if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `₦${Math.round(val / 1_000)}k`
  return `₦${val}`
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ── Revenue bar chart (CSS-based — no SVG scaling issues) ────────────────────
function RevenueChart({ orders }: { orders: Order[] }) {
  const data = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en', { month: 'short' })
      const revenue = orders
        .filter(o => PAID_STATUSES.includes(o.status) && o.created_at.startsWith(key))
        .reduce((s, o) => s + o.total, 0)
      return { label, key, revenue, isCurrent: i === 5 }
    })
  }, [orders])

  const maxRev = Math.max(...data.map(d => d.revenue))
  const hasData = maxRev > 0

  return (
    <div>
      {/* Bars */}
      <div className="flex items-end gap-2 h-28">
        {data.map(d => {
          const pct = hasData && maxRev > 0
            ? Math.max((d.revenue / maxRev) * 100, d.revenue > 0 ? 3 : 0)
            : 0
          return (
            <div key={d.key} className="flex-1 flex flex-col items-center justify-end gap-[3px] h-full">
              {/* Value label — always reserve space to keep bars flush at bottom */}
              <span className={`text-[9px] font-medium leading-none tabular-nums ${d.revenue > 0 ? 'text-[#6B1A2A] dark:text-[#D4849A]' : 'invisible'}`}>
                {fmtShort(d.revenue)}
              </span>
              {/* Bar */}
              <div
                className={`w-full rounded-[3px] transition-all duration-500 ${
                  d.isCurrent
                    ? 'bg-[#4A0F1C] dark:bg-[#6B1A2A]'
                    : 'bg-[#4A0F1C]/20 dark:bg-[#4A0F1C]/35'
                }`}
                style={{ height: hasData ? `${pct}%` : '4px' }}
              />
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {!hasData && (
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2">
          Revenue will appear once orders are marked paid
        </p>
      )}

      {/* Month labels */}
      <div className="flex gap-2 mt-2.5">
        {data.map(d => (
          <div key={d.key} className="flex-1 text-center">
            <span className={`text-[10px] ${d.isCurrent ? 'text-[#4A0F1C] dark:text-[#D4849A] font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:       'bg-green-50  dark:bg-green-950/40  text-green-700  dark:text-green-400',
    processing: 'bg-blue-50   dark:bg-blue-950/40   text-blue-700   dark:text-blue-400',
    shipped:    'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400',
    delivered:  'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    pending:    'bg-amber-50  dark:bg-amber-950/40  text-amber-700  dark:text-amber-400',
    cancelled:  'bg-red-50    dark:bg-red-950/40    text-red-600    dark:text-red-400',
    refunded:   'bg-gray-100  dark:bg-gray-800      text-gray-600   dark:text-gray-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FinanceOverview({ orders, products = [] }: { orders: Order[]; products?: Product[] }) {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  const revenue = orders.filter(o => PAID_STATUSES.includes(o.status))
  const pending = orders.filter(o => o.status === 'pending')

  const totalRevenue  = revenue.reduce((s, o) => s + o.total, 0)
  const thisMonthRev  = revenue.filter(o => o.created_at.startsWith(thisMonth)).reduce((s, o) => s + o.total, 0)
  const lastMonthRev  = revenue.filter(o => o.created_at.startsWith(lastMonth)).reduce((s, o) => s + o.total, 0)
  const pendingTotal  = pending.reduce((s, o) => s + o.total, 0)
  const avgOrderValue = revenue.length > 0 ? Math.round(totalRevenue / revenue.length) : 0
  const monthChange   = pctChange(thisMonthRev, lastMonthRev)

  const stats = [
    { label: 'Total Revenue',    value: ngn(totalRevenue),  sub: `${revenue.length} paid orders`, accent: true },
    { label: 'This Month',       value: ngn(thisMonthRev),  sub: (monthChange >= 0 ? `+${monthChange}%` : `${monthChange}%`) + ' vs last month', positive: monthChange >= 0 },
    { label: 'Pending Payments', value: ngn(pendingTotal),  sub: `${pending.length} order${pending.length !== 1 ? 's' : ''} awaiting`, warn: pendingTotal > 0 },
    { label: 'Avg Order Value',  value: ngn(avgOrderValue), sub: 'across paid orders' },
  ]

  const recent = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)

  // Inventory value
  const totalSellValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const totalCostValue = products.reduce((s, p) => p.cost_price != null ? s + p.cost_price * p.stock : s, 0)
  const potentialProfit = totalCostValue > 0 ? totalSellValue - totalCostValue : null
  const productsWithCost = products.filter(p => p.cost_price != null).length
  const totalUnits = products.reduce((s, p) => s + p.stock, 0)
  const topByValue = [...products]
    .filter(p => p.stock > 0)
    .sort((a, b) => b.price * b.stock - a.price * a.stock)
    .slice(0, 5)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Finance Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenue and payment summary</p>
        </div>
        <Link
          href="/admin/finance/transactions"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          All Transactions
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.warn ? 'text-amber-600 dark:text-amber-400' : s.accent ? 'text-[#4A0F1C] dark:text-[#D4849A]' : 'text-gray-900 dark:text-white'}`}>
              {s.value}
            </p>
            {s.sub && (
              <p className={`text-xs mt-1 ${s.positive !== undefined ? (s.positive ? 'text-green-600 dark:text-green-400' : 'text-red-500') : 'text-gray-400'}`}>
                {s.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue — Last 6 Months</h2>
            <p className="text-xs text-gray-400 mt-0.5">Paid, processing, shipped & delivered orders</p>
          </div>
          <RevenueChart orders={orders} />
        </div>

        <div className="col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Order Breakdown</h2>
          <div className="space-y-3">
            {(['paid', 'processing', 'shipped', 'delivered', 'pending', 'cancelled', 'refunded'] as const).map(status => {
              const count = orders.filter(o => o.status === status).length
              const total = orders.filter(o => o.status === status).reduce((s, o) => s + o.total, 0)
              if (count === 0) return null
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={status} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{count}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{ngn(total)}</span>
                </div>
              )
            })}
            {orders.length === 0 && (
              <p className="text-xs text-gray-400 py-4 text-center">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mt-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          <Link href="/admin/finance/transactions" className="text-xs text-[#4A0F1C] dark:text-[#D4849A] hover:underline underline-offset-2">
            View all →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Order</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-xs text-gray-400">No transactions yet</td>
              </tr>
            ) : recent.map(o => {
              const customer = o.shipping_address
                ? `${o.shipping_address.firstName ?? ''} ${o.shipping_address.lastName ?? ''}`.trim() || o.shipping_address.email || '—'
                : '—'
              return (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-[#4A0F1C] dark:text-[#D4849A] hover:underline">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{customer}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">{ngn(o.total)}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Inventory Value */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Inventory Value</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Worth of all products currently in stock
              {productsWithCost < products.length && (
                <span className="ml-1 text-amber-500 dark:text-amber-400">
                  · Cost price set on {productsWithCost}/{products.length} products
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Sell Price Total</p>
            <p className="text-2xl font-bold text-[#4A0F1C] dark:text-[#D4849A]">{ngn(totalSellValue)}</p>
            <p className="text-xs text-gray-400 mt-1">{totalUnits.toLocaleString()} units in stock</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Cost Price Total</p>
            {totalCostValue > 0 ? (
              <>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{ngn(totalCostValue)}</p>
                <p className="text-xs text-gray-400 mt-1">Based on {productsWithCost} products with cost set</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-300 dark:text-gray-600">—</p>
                <p className="text-xs text-gray-400 mt-1">Add cost prices to products to calculate</p>
              </>
            )}
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Potential Gross Profit</p>
            {potentialProfit != null ? (
              <>
                <p className={`text-2xl font-bold ${potentialProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {potentialProfit >= 0 ? '+' : ''}{ngn(potentialProfit)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalCostValue > 0 ? `${Math.round((potentialProfit / totalCostValue) * 100)}% margin on cost` : ''}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-300 dark:text-gray-600">—</p>
                <p className="text-xs text-gray-400 mt-1">Set cost prices to see margin</p>
              </>
            )}
          </div>
        </div>

        {/* Top products by inventory value */}
        {topByValue.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Products by Inventory Value</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Product</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Units</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Unit Price</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Cost Price</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Sell Value</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Cost Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {topByValue.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{p.stock.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-gray-900 dark:text-white">{ngn(p.price)}</td>
                    <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400">
                      {p.cost_price != null ? ngn(p.cost_price) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-[#4A0F1C] dark:text-[#D4849A]">{ngn(p.price * p.stock)}</td>
                    <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">
                      {p.cost_price != null ? ngn(p.cost_price * p.stock) : <span className="text-gray-300 dark:text-gray-600">—</span>}
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
