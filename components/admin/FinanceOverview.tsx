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
function niceMax(v: number) {
  if (v <= 0) return 0
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  for (const s of [1, 2, 2.5, 5, 10]) {
    if (s * mag >= v) return s * mag
  }
  return v
}

function fmtY(val: number) {
  if (val === 0) return '₦0'
  if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`
  return `₦${val}`
}

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
      const isCurrent = i === 5
      return { label, key, revenue, isCurrent }
    })
  }, [orders])

  const rawMax = Math.max(...data.map(d => d.revenue))
  const hasData = rawMax > 0
  const max = niceMax(rawMax) || 100_000 // fallback scale when no data

  const chartH = 130
  const padT = 16
  const padB = 36
  const padL = 60
  const padR = 12
  const barW = 36
  const cols = data.length
  const innerW = 420 // fixed inner width, SVG scales via viewBox
  const colW = (innerW - padL - padR) / cols
  const totalW = innerW
  const totalH = chartH + padT + padB

  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="overflow-visible"
    >
      {/* Y gridlines + labels */}
      {yTicks.map(t => {
        const y = padT + chartH - t * chartH
        const val = max * t
        return (
          <g key={t}>
            <line
              x1={padL} y1={y} x2={totalW - padR} y2={y}
              strokeWidth={0.75}
              stroke={t === 0 ? 'currentColor' : 'currentColor'}
              strokeDasharray={t === 0 ? undefined : '4 3'}
              className={t === 0 ? 'text-gray-300 dark:text-gray-700' : 'text-gray-200 dark:text-gray-800'}
            />
            <text
              x={padL - 8} y={y + 3.5}
              textAnchor="end" fontSize={8.5}
              className="fill-gray-400 dark:fill-gray-500"
            >
              {fmtY(val)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = hasData ? Math.max((d.revenue / max) * chartH, d.revenue > 0 ? 4 : 0) : 0
        const cx = padL + i * colW + colW / 2
        const x = cx - barW / 2
        const y = padT + chartH - barH
        return (
          <g key={d.key}>
            {/* Placeholder bar (empty state) */}
            {!hasData && (
              <rect
                x={x} y={padT + chartH - 6} width={barW} height={6} rx={3}
                className="fill-gray-200 dark:fill-gray-800"
              />
            )}
            {/* Actual bar */}
            {hasData && (
              <rect
                x={x} y={y} width={barW} height={barH} rx={4}
                className={d.isCurrent ? 'fill-[#4A0F1C] dark:fill-[#6B1A2A]' : 'fill-[#4A0F1C]/25 dark:fill-[#4A0F1C]/40'}
              />
            )}
            {/* Value label above bar */}
            {hasData && d.revenue > 0 && (
              <text
                x={cx} y={y - 5}
                textAnchor="middle" fontSize={8}
                className="fill-[#6B1A2A] dark:fill-[#D4849A]"
              >
                {fmtY(d.revenue)}
              </text>
            )}
            {/* Month label */}
            <text
              x={cx} y={padT + chartH + padB - 16}
              textAnchor="middle" fontSize={10}
              className={d.isCurrent ? 'fill-[#4A0F1C] dark:fill-[#D4849A] font-semibold' : 'fill-gray-500 dark:fill-gray-400'}
            >
              {d.label}
            </text>
          </g>
        )
      })}

      {/* Empty state overlay */}
      {!hasData && (
        <text
          x={totalW / 2} y={padT + chartH / 2 + 4}
          textAnchor="middle" fontSize={11}
          className="fill-gray-400 dark:fill-gray-500"
        >
          No revenue data yet — orders will appear once paid
        </text>
      )}
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
