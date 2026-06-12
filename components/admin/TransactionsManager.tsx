'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Order = {
  id: string
  total: number
  status: string
  created_at: string
  payment_reference: string | null
  shipping_address: { firstName?: string; lastName?: string; email?: string; phone?: string } | null
}

const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

function ngn(amount: number) {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

type DatePreset = 'all' | 'today' | 'week' | 'month' | 'last_month' | '3months'
type StatusFilter = 'all' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'pending' | 'cancelled' | 'refunded'

const DATE_LABELS: Record<DatePreset, string> = {
  all:        'All time',
  today:      'Today',
  week:       'This week',
  month:      'This month',
  last_month: 'Last month',
  '3months':  'Last 3 months',
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  all:        'All statuses',
  paid:       'Paid',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  pending:    'Pending',
  cancelled:  'Cancelled',
  refunded:   'Refunded',
}

function getDateRange(preset: DatePreset): { from: Date; to: Date } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (preset === 'all') return null
  if (preset === 'today') return { from: today, to: now }
  if (preset === 'week') {
    const from = new Date(today)
    from.setDate(today.getDate() - today.getDay())
    return { from, to: now }
  }
  if (preset === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
  if (preset === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    return { from, to }
  }
  if (preset === '3months') {
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    return { from, to: now }
  }
  return null
}

function exportCSV(orders: Order[]) {
  const headers = ['Date', 'Order ID', 'Customer', 'Email', 'Amount (₦)', 'Status', 'Payment Ref']
  const rows = orders.map(o => {
    const customer = o.shipping_address ? `${o.shipping_address.firstName ?? ''} ${o.shipping_address.lastName ?? ''}`.trim() : ''
    const email = o.shipping_address?.email ?? ''
    return [
      new Date(o.created_at).toLocaleDateString('en-NG'),
      o.id.slice(0, 8).toUpperCase(),
      customer,
      email,
      o.total,
      o.status,
      o.payment_reference ?? '',
    ]
  })
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function TransactionsManager({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [showDateDd, setShowDateDd] = useState(false)
  const [showStatusDd, setShowStatusDd] = useState(false)

  const filtered = useMemo(() => {
    const range = getDateRange(datePreset)
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (range) {
        const d = new Date(o.created_at)
        if (d < range.from || d > range.to) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const customer = o.shipping_address ? `${o.shipping_address.firstName ?? ''} ${o.shipping_address.lastName ?? ''} ${o.shipping_address.email ?? ''}`.toLowerCase() : ''
        const ref = (o.payment_reference ?? '').toLowerCase()
        const id = o.id.toLowerCase()
        if (!customer.includes(q) && !ref.includes(q) && !id.includes(q)) return false
      }
      return true
    })
  }, [orders, search, statusFilter, datePreset])

  const totalRevenue  = filtered.filter(o => PAID_STATUSES.includes(o.status)).reduce((s, o) => s + o.total, 0)
  const pendingTotal  = filtered.filter(o => o.status === 'pending').reduce((s, o) => s + o.total, 0)
  const revenueCount  = filtered.filter(o => PAID_STATUSES.includes(o.status)).length

  const stats = [
    { label: 'Revenue', value: ngn(totalRevenue), sub: `${revenueCount} paid orders`, accent: true },
    { label: 'Total Orders', value: filtered.length.toString(), sub: 'matching filters' },
    { label: 'Pending', value: ngn(pendingTotal), sub: `${filtered.filter(o => o.status === 'pending').length} orders`, warn: pendingTotal > 0 },
    { label: 'Cancelled', value: filtered.filter(o => o.status === 'cancelled').length.toString(), sub: `${ngn(filtered.filter(o => o.status === 'cancelled').reduce((s, o) => s + o.total, 0))} lost` },
  ]

  const hasFilters = search || statusFilter !== 'all' || datePreset !== 'all'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{orders.length} total orders</p>
        </div>
        <button
          type="button"
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.warn ? 'text-amber-600 dark:text-amber-400' : s.accent ? 'text-[#4A0F1C] dark:text-[#D4849A]' : 'text-gray-900 dark:text-white'}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative w-64 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search customer, email, ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Date preset */}
        <div className="relative">
          {showDateDd && <div className="fixed inset-0 z-10" onClick={() => setShowDateDd(false)} />}
          <button type="button" onClick={() => { setShowDateDd(p => !p); setShowStatusDd(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${datePreset !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {DATE_LABELS[datePreset]}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showDateDd && (
            <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1">
              {(Object.keys(DATE_LABELS) as DatePreset[]).map(p => (
                <button key={p} type="button" onClick={() => { setDatePreset(p); setShowDateDd(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${datePreset === p ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {DATE_LABELS[p]}
                  {datePreset === p && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="relative">
          {showStatusDd && <div className="fixed inset-0 z-10" onClick={() => setShowStatusDd(false)} />}
          <button type="button" onClick={() => { setShowStatusDd(p => !p); setShowDateDd(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${statusFilter !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {STATUS_LABELS[statusFilter]}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showStatusDd && (
            <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1">
              {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => (
                <button key={s} type="button" onClick={() => { setStatusFilter(s); setShowStatusDd(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${statusFilter === s ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {STATUS_LABELS[s]}
                  {statusFilter === s && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        {hasFilters && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setDatePreset('all') }}
              className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400">{orders.length === 0 ? 'No transactions yet.' : 'No transactions match your filters.'}</p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Order</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Reference</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filtered.map(o => {
                const sa = o.shipping_address
                const customer = sa
                  ? (`${sa.firstName ?? ''} ${sa.lastName ?? ''}`.trim() || sa.email || '—')
                  : '—'
                const email = sa?.email ?? ''
                return (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <span className="block text-gray-300 dark:text-gray-600 mt-0.5">
                        {new Date(o.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-[#4A0F1C] dark:text-[#D4849A] hover:underline">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{customer}</p>
                      {email && <p className="text-xs text-gray-400 mt-0.5">{email}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{ngn(o.total)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {o.payment_reference
                        ? <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{o.payment_reference}</span>
                        : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Footer total */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
              <span className="text-xs text-gray-400">{filtered.length} transactions shown</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Revenue: <span className="text-[#4A0F1C] dark:text-[#D4849A]">{ngn(totalRevenue)}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
