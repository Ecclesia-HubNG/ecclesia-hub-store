'use client'

import { useState, useMemo } from 'react'

type Customer = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  shipping_address: unknown
}

type SortBy = 'newest' | 'oldest' | 'name_asc' | 'name_desc'
type HasOrdersFilter = 'all' | 'yes' | 'no'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function CustomersManager({
  customers,
  orderCustomerIds,
}: {
  customers: Customer[]
  orderCustomerIds: string[]
}) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [hasOrders, setHasOrders] = useState<HasOrdersFilter>('all')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const orderSet = useMemo(() => new Set(orderCustomerIds), [orderCustomerIds])

  const filtered = useMemo(() => {
    let result = customers.filter(c => {
      if (search) {
        const q = search.toLowerCase()
        if (!(c.full_name ?? '').toLowerCase().includes(q) && !(c.email ?? '').toLowerCase().includes(q)) return false
      }
      if (hasOrders === 'yes' && !orderSet.has(c.id)) return false
      if (hasOrders === 'no' && orderSet.has(c.id)) return false
      return true
    })

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name_asc': return (a.full_name ?? '').localeCompare(b.full_name ?? '')
        case 'name_desc': return (b.full_name ?? '').localeCompare(a.full_name ?? '')
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return result
  }, [customers, search, sortBy, hasOrders, orderSet])

  const hasFilters = search !== '' || hasOrders !== 'all'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{customers.length} total</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative w-64 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Has orders filter */}
        <div className="flex items-center gap-1">
          {(['all', 'yes', 'no'] as const).map(val => {
            const label = val === 'all' ? 'All customers' : val === 'yes' ? 'Has orders' : 'No orders'
            return (
              <button
                key={val}
                type="button"
                onClick={() => setHasOrders(val)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${hasOrders === val ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Sort by */}
        <div className="relative ml-auto">
          {showSortDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />}
          <button
            type="button"
            onClick={() => setShowSortDropdown(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${sortBy !== 'newest' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
            Sort
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
              {([
                ['newest', 'Newest first'],
                ['oldest', 'Oldest first'],
                ['name_asc', 'Name A → Z'],
                ['name_desc', 'Name Z → A'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setSortBy(val); setShowSortDropdown(false) }}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${sortBy === val ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
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

        {hasFilters && (
          <>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => { setSearch(''); setHasOrders('all') }}
              className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Table */}
      {!filtered.length ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
          <p className="text-sm text-gray-400">
            {customers.length === 0 ? 'No customers yet.' : 'No customers match your filters.'}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Shipping address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map(c => {
                const name = c.full_name || c.email?.split('@')[0] || 'Unknown'
                const address = c.shipping_address as { city?: string; state?: string } | null
                const hasOrder = orderSet.has(c.id)
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8C4CB] dark:bg-[#4A0F1C]/40 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#4A0F1C] dark:text-[#D4849A]">{getInitials(name)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white leading-tight">{name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {c.phone ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {address?.city
                        ? `${address.city}${address.state ? `, ${address.state}` : ''}`
                        : <span className="text-gray-300 dark:text-gray-600">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {hasOrder
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">Has orders</span>
                        : <span className="text-xs text-gray-400 dark:text-gray-600">No orders</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
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
