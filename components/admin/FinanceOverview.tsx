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

const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

function ngn(amount: number) {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// ── Revenue bar chart (pure SVG) ─────────────────────────────────────────────
function RevenueChart({ orders }: { orders: Order[] }) {
  const data = useMemo(() => {
    const now = new Date()
    const months: { label: string; key: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en', { month: 'short' })
      const revenue = orders
        .filter(o => PAID_STATUSES.includes(o.status) && o.created_at.startsWith(key))
        .reduce((s, o) => s + o.total, 0)
      months.push({ label, key, revenue })
    }
    return months
  }, [orders])

  const max = Math.max(...data.map(d => d.revenue), 1)
  const chartH = 120
  const barW = 40
  const gap = 16
  const padL = 52
  const totalW = padL + data.length * (barW + gap) - gap + 8

  return (
    <svg viewBox={`0 0 ${totalW} ${chartH + 36}`} width="100%" preserveAspectRatio="xMidYMid meet" className="overflow-visible">
      {/* Y gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = chartH - t * chartH
        const val = max * t
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={totalW} y2={y} stroke="currentColor" strokeWidth={0.5} className="text-gray-200 dark:text-gray-700" strokeDasharray={t === 0 ? undefined : '3 3'} />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={9} className="fill-gray-400">
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max((d.revenue / max) * chartH, d.revenue > 0 ? 3 : 0)
        const x = padL + i * (barW + gap)
        const y = chartH - barH
        const isCurrentMonth = i === data.length - 1
        return (
          <g key={d.key}>
            <rect
              x={x} y={y} width={barW} height={barH} rx={5}
              className={isCurrentMonth ? 'fill-[#4A0F1C]' : 'fill-[#4A0F1C]/30 dark:fill-[#4A0F1C]/50'}
            />
            <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize={10} className="fill-gray-500 dark:fill-gray-400">
              {d.label}
            </text>
            {d.revenue > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} className="fill-[#6B1A2A] dark:fill-[#D4849A] font-medium">
                {d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : d.revenue}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:        'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
    processing:  'bg-blue-50  dark:bg-blue-950/40  text-blue-700  dark:text-blue-400',
    shipped:     'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400',
    delivered:   'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    pending:     'bg-amber-50  dark:bg-amber-950/40  text-amber-700  dark:text-amber-400',
    cancelled:   'bg-red-50    dark:bg-red-950/40    text-red-600    dark:text-red-400',
    refunded:    'bg-gray-100  dark:bg-gray-800      text-gray-600   dark:text-gray-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FinanceOverview({ orders }: { orders: Order[] }) {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  const revenue = orders.filter(o => PAID_STATUSES.includes(o.status))
  const pending = orders.filter(o => o.status === 'pending')

  const totalRevenue    = revenue.reduce((s, o) => s + o.total, 0)
  const thisMonthRev    = revenue.filter(o => o.created_at.startsWith(thisMonth)).reduce((s, o) => s + o.total, 0)
  const lastMonthRev    = revenue.filter(o => o.created_at.startsWith(lastMonth)).reduce((s, o) => s + o.total, 0)
  const pendingTotal    = pending.reduce((s, o) => s + o.total, 0)
  const avgOrderValue   = revenue.length > 0 ? Math.round(totalRevenue / revenue.length) : 0
  const monthChange     = pctChange(thisMonthRev, lastMonthRev)

  const stats = [
    {
      label: 'Total Revenue',
      value: ngn(totalRevenue),
      sub: `${revenue.length} paid orders`,
      accent: true,
    },
    {
      label: 'This Month',
      value: ngn(thisMonthRev),
      sub: monthChange >= 0 ? `+${monthChange}% vs last month` : `${monthChange}% vs last month`,
      positive: monthChange >= 0,
    },
    {
      label: 'Pending Payments',
      value: ngn(pendingTotal),
      sub: `${pending.length} order${pending.length !== 1 ? 's' : ''} awaiting payment`,
      warn: pendingTotal > 0,
    },
    {
      label: 'Avg Order Value',
      value: ngn(avgOrderValue),
      sub: 'across all paid orders',
    },
  ]

  const recent = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)

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

      {/* Chart + Recent */}
      <div className="grid grid-cols-5 gap-4">
        {/* Revenue chart */}
        <div className="col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue — Last 6 Months</h2>
              <p className="text-xs text-gray-400 mt-0.5">Paid, processing, shipped & delivered orders</p>
            </div>
          </div>
          <RevenueChart orders={orders} />
        </div>

        {/* Order status breakdown */}
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
            {recent.map(o => {
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
    </div>
  )
}
