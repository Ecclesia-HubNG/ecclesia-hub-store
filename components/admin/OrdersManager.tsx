'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateOrderStatus, bulkUpdateOrderStatus } from '@/lib/actions/orders'

type OrderItem = {
  product_id?: string
  name: string
  price: number
  quantity: number
  thumbnail?: string | null
}

type Order = {
  id: string
  customer_id: string | null
  status: string
  total: number
  items: OrderItem[]
  shipping_address: Record<string, string> | null
  payment_reference: string | null
  created_at: string
  customers: { full_name: string | null; email: string | null } | null
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: 'bg-amber-50 dark:bg-amber-950/30',  text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-400' },
  paid:       { bg: 'bg-blue-50 dark:bg-blue-950/30',    text: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-400' },
  processing: { bg: 'bg-blue-50 dark:bg-blue-950/30',    text: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-500' },
  shipped:    { bg: 'bg-purple-50 dark:bg-purple-950/30',text: 'text-purple-700 dark:text-purple-400',dot: 'bg-purple-400' },
  delivered:  { bg: 'bg-green-50 dark:bg-green-950/30',  text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500' },
  cancelled:  { bg: 'bg-gray-100 dark:bg-gray-800',      text: 'text-gray-500 dark:text-gray-400',    dot: 'bg-gray-400' },
  refunded:   { bg: 'bg-red-50 dark:bg-red-950/30',      text: 'text-red-700 dark:text-red-400',      dot: 'bg-red-400' },
}

const ALL_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  )
}

function fmt(n: number) {
  return '₦' + n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function exportOrdersCSV(orders: Order[]) {
  const headers = ['Order ID', 'Customer', 'Email', 'Status', 'Total', 'Items', 'Date']
  const rows = orders.map(o => [
    o.id.slice(0, 8).toUpperCase(),
    `"${(o.customers?.full_name ?? 'Guest').replace(/"/g, '""')}"`,
    `"${(o.customers?.email ?? '').replace(/"/g, '""')}"`,
    o.status,
    Number(o.total).toFixed(2),
    Array.isArray(o.items) ? o.items.length : 0,
    new Date(o.created_at).toLocaleDateString('en'),
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function InlineStatusSelect({ id, status }: { id: string; status: string }) {
  const [, startTransition] = useTransition()
  const [current, setCurrent] = useState(status)
  const [open, setOpen] = useState(false)
  const s = STATUS_COLORS[current] ?? STATUS_COLORS.pending

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize cursor-pointer transition-opacity hover:opacity-80 ${s.bg} ${s.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
        {current}
        <svg className="w-2.5 h-2.5 ml-0.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setCurrent(s)
                setOpen(false)
                const fd = new FormData()
                fd.set('id', id)
                fd.set('status', s)
                startTransition(() => updateOrderStatus(fd))
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-xs capitalize transition-colors ${current === s ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[s]?.dot ?? 'bg-gray-400'}`} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type StatusFilter = 'all' | typeof ALL_STATUSES[number]

export default function OrdersManager({ orders: initial }: { orders: Order[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'total_high' | 'total_low'>('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [, startBulkUpdate] = useTransition()

  const filtered = useMemo(() => {
    return initial.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const id = o.id.toLowerCase()
        const name = o.customers?.full_name?.toLowerCase() ?? ''
        const email = o.customers?.email?.toLowerCase() ?? ''
        const ref = o.payment_reference?.toLowerCase() ?? ''
        if (!id.includes(q) && !name.includes(q) && !email.includes(q) && !ref.includes(q)) return false
      }
      if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false
      if (dateTo && new Date(o.created_at) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [initial, search, statusFilter, dateFrom, dateTo])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'total_high': return Number(b.total) - Number(a.total)
        case 'total_low': return Number(a.total) - Number(b.total)
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [filtered, sortBy])

  const allSelected = sorted.length > 0 && sorted.every(o => selected.has(o.id))
  const someSelected = selected.size > 0

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); sorted.forEach(o => next.delete(o.id)); return next })
    } else {
      setSelected(prev => { const next = new Set(prev); sorted.forEach(o => next.add(o.id)); return next })
    }
  }

  const handleBulkStatus = (status: string) => {
    const ids = Array.from(selected)
    startBulkUpdate(async () => {
      await bulkUpdateOrderStatus(ids, status)
      setSelected(new Set())
    })
  }

  // Stats
  const revenue = initial
    .filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status))
    .reduce((s, o) => s + Number(o.total), 0)
  const pending = initial.filter(o => o.status === 'pending').length
  const inProgress = initial.filter(o => ['paid', 'processing', 'shipped'].includes(o.status)).length
  const delivered = initial.filter(o => o.status === 'delivered').length

  const stats = [
    { label: 'Total orders', value: initial.length.toLocaleString(), sub: 'All time' },
    { label: 'Revenue', value: fmt(revenue), sub: 'Paid + delivered' },
    { label: 'Pending', value: pending.toLocaleString(), sub: 'Awaiting action', accent: pending > 0 },
    { label: 'In progress', value: inProgress.toLocaleString(), sub: 'Paid / processing / shipped' },
  ]

  const dateLabel = dateFrom || dateTo
    ? `${dateFrom || '…'} → ${dateTo || '…'}`
    : 'Date range'

  const tabCounts: Record<string, number> = { all: initial.length }
  ALL_STATUSES.forEach(s => { tabCounts[s] = initial.filter(o => o.status === s).length })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{initial.length} total orders</p>
        </div>
        <button
          type="button"
          onClick={() => exportOrdersCSV(filtered)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.accent ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative w-72 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search order, customer, ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
          />
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Status filter dropdown */}
        <div className="relative">
          {showStatusDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />}
          <button
            type="button"
            onClick={() => { setShowStatusDropdown(p => !p); setShowSortDropdown(false); setShowDatePicker(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${statusFilter !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <span className="capitalize">{statusFilter === 'all' ? 'All statuses' : statusFilter}</span>
            <span className={`text-xs ${statusFilter !== 'all' ? 'text-gray-900/50 dark:text-white/50' : 'text-gray-400 dark:text-gray-600'}`}>{tabCounts[statusFilter] ?? 0}</span>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showStatusDropdown && (
            <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
              {(['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStatusFilter(s); setShowStatusDropdown(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm capitalize transition-colors ${statusFilter === s ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className="flex items-center gap-2">
                    {s !== 'all' && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[s]?.dot ?? 'bg-gray-400'}`} />}
                    {s === 'all' ? 'All statuses' : s}
                  </span>
                  <span className={`text-xs ${statusFilter === s ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{tabCounts[s] ?? 0}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Sort by */}
          <div className="relative">
            {showSortDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />}
            <button
              type="button"
              onClick={() => { setShowSortDropdown(p => !p); setShowDatePicker(false); setShowStatusDropdown(false) }}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${sortBy !== 'newest' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              Sort
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
                {([
                  ['newest', 'Newest first'],
                  ['oldest', 'Oldest first'],
                  ['total_high', 'Total: high → low'],
                  ['total_low', 'Total: low → high'],
                ] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => { setSortBy(val); setShowSortDropdown(false) }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${sortBy === val ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {label}
                    {sortBy === val && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date picker */}
          <div className="relative">
            {showDatePicker && <div className="fixed inset-0 z-10" onClick={() => setShowDatePicker(false)} />}
            <button
              type="button"
              onClick={() => setShowDatePicker(p => !p)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${dateFrom || dateTo ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              {dateLabel}
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-4 w-64">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none" />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button type="button" onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear dates</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result count */}
      {(search || statusFilter !== 'all' || dateFrom || dateTo) && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo('') }}
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors">Clear filters</button>
        </div>
      )}

      {/* Bulk action bar */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${someSelected ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl px-4 py-3 shadow-xl">
          <span className="text-sm font-medium whitespace-nowrap">{selected.size} selected</span>
          <div className="w-px h-4 bg-white/20 dark:bg-gray-900/20" />
          <button type="button" onClick={() => handleBulkStatus('shipped')}
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 dark:bg-gray-900/10 hover:bg-white/20 dark:hover:bg-gray-900/20 transition-colors whitespace-nowrap">
            Mark Shipped
          </button>
          <button type="button" onClick={() => handleBulkStatus('delivered')}
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 dark:bg-gray-900/10 hover:bg-white/20 dark:hover:bg-gray-900/20 transition-colors whitespace-nowrap">
            Mark Delivered
          </button>
          <button type="button" onClick={() => handleBulkStatus('cancelled')}
            className="text-sm font-medium px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 dark:text-red-600 hover:bg-red-500/30 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => setSelected(new Set())}
            className="text-white/60 dark:text-gray-900/60 hover:text-white dark:hover:text-gray-900 transition-colors ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            {initial.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <th className="pl-4 pr-2 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-gray-900 dark:accent-white cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {sorted.map(order => {
                const customer = order.customers
                const items: OrderItem[] = Array.isArray(order.items) ? order.items : []
                const thumbs = items.filter(i => i.thumbnail).slice(0, 3)
                return (
                  <tr key={order.id} className={`transition-colors ${selected.has(order.id) ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                    {/* Checkbox */}
                    <td className="pl-4 pr-2 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-gray-900 dark:accent-white cursor-pointer"
                      />
                    </td>

                    {/* Order */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white tracking-wide">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      {order.payment_reference && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[130px]">{order.payment_reference}</p>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer?.full_name ?? <span className="text-gray-400 font-normal">Guest</span>}
                      </p>
                      {customer?.email && <p className="text-xs text-gray-400 mt-0.5">{customer.email}</p>}
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {thumbs.length > 0 && (
                          <div className="flex -space-x-1.5">
                            {thumbs.map((item, i) => (
                              <img key={i} src={item.thumbnail!} alt="" className="w-6 h-6 rounded-md object-cover border border-white dark:border-gray-900 shrink-0" />
                            ))}
                          </div>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">{fmt(Number(order.total))}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <InlineStatusSelect id={order.id} status={order.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* View */}
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${order.id}`}
                        className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
