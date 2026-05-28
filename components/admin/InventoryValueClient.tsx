'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Product = {
  id: string
  name: string
  price: number
  cost_price: number | null
  stock: number
  is_active: boolean
}

function ngn(amount: number) {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const PAGE_SIZE = 25

export default function InventoryValueClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Summary stats always across ALL in-stock products (not filtered)
  const inStock = useMemo(() => products.filter(p => p.stock > 0), [products])
  const totalUnits = inStock.reduce((s, p) => s + p.stock, 0)
  const totalSellValue = inStock.reduce((s, p) => s + p.price * p.stock, 0)
  const totalCostValue = inStock.reduce((s, p) => p.cost_price != null ? s + p.cost_price * p.stock : s, 0)
  const potentialProfit = totalCostValue > 0 ? totalSellValue - totalCostValue : null
  const productsWithCost = inStock.filter(p => p.cost_price != null).length

  // Sorted by sell value desc
  const sorted = useMemo(
    () => [...inStock].sort((a, b) => b.price * b.stock - a.price * a.stock),
    [inStock]
  )

  // Search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return sorted
    const q = search.toLowerCase()
    return sorted.filter(p => p.name.toLowerCase().includes(q))
  }, [sorted, search])

  // Reset page when search changes
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Pagination pages array
  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '…')[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Inventory Value</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Worth of all products currently in stock
            {productsWithCost > 0 && productsWithCost < inStock.length && (
              <span className="ml-2 text-amber-500 dark:text-amber-400 text-xs">
                · Cost price set on {productsWithCost} of {inStock.length} products
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/products"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
          Manage Products
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Sell Price Total</p>
          <p className="text-3xl font-bold text-[#4A0F1C] dark:text-[#D4849A]">{ngn(totalSellValue)}</p>
          <p className="text-xs text-gray-400 mt-1.5">
            {totalUnits.toLocaleString()} units · {inStock.length} products in stock
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Cost Price Total</p>
          {totalCostValue > 0 ? (
            <>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{ngn(totalCostValue)}</p>
              <p className="text-xs text-gray-400 mt-1.5">Based on {productsWithCost} products with cost set</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-300 dark:text-gray-600">—</p>
              <p className="text-xs text-gray-400 mt-1.5">
                Add cost prices to products to calculate.{' '}
                <Link href="/admin/products" className="text-[#6B1A2A] dark:text-[#D4849A] underline underline-offset-2">
                  Edit products →
                </Link>
              </p>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Potential Gross Profit</p>
          {potentialProfit != null ? (
            <>
              <p className={`text-3xl font-bold ${potentialProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {potentialProfit >= 0 ? '+' : ''}{ngn(potentialProfit)}
              </p>
              <p className="text-xs text-gray-400 mt-1.5">
                {totalCostValue > 0 ? `${Math.round((potentialProfit / totalCostValue) * 100)}% margin on cost` : ''}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-300 dark:text-gray-600">—</p>
              <p className="text-xs text-gray-400 mt-1.5">Set cost prices to products to see margin</p>
            </>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">

        {/* Table header: title + search */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
            Products in Stock
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({search ? `${filtered.length} of ${inStock.length}` : inStock.length})
            </span>
          </h2>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {productsWithCost === 0 && !search && (
            <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 shrink-0">
              No cost prices set — edit products to add them
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">
              {inStock.length === 0 ? 'No products currently in stock.' : `No products match "${search}".`}
            </p>
            {inStock.length === 0 && (
              <Link href="/admin/products" className="text-sm text-[#6B1A2A] dark:text-[#D4849A] mt-1 inline-block hover:underline">
                Manage products →
              </Link>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Product</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Units</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Unit Price</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Cost Price</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Sell Value</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Cost Value</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paged.map(p => {
                  const sellValue = p.price * p.stock
                  const costValue = p.cost_price != null ? p.cost_price * p.stock : null
                  const margin = costValue != null && costValue > 0
                    ? Math.round(((sellValue - costValue) / costValue) * 100)
                    : null
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="font-medium text-gray-900 dark:text-white hover:text-[#4A0F1C] dark:hover:text-[#D4849A] transition-colors"
                        >
                          {p.name}
                        </Link>
                        {!p.is_active && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">Inactive</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                        {p.stock.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-900 dark:text-white tabular-nums">
                        {ngn(p.price)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {p.cost_price != null
                          ? <span className="text-gray-700 dark:text-gray-300">{ngn(p.cost_price)}</span>
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-[#4A0F1C] dark:text-[#D4849A] tabular-nums">
                        {ngn(sellValue)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {costValue != null
                          ? <span className="text-gray-700 dark:text-gray-300">{ngn(costValue)}</span>
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {margin != null
                          ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${margin >= 0 ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
                              {margin >= 0 ? '+' : ''}{margin}%
                            </span>
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals footer — always reflects ALL in-stock, not current page */}
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-900/80 border-t-2 border-gray-200 dark:border-gray-700 font-semibold">
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">All stock total</td>
                  <td className="px-5 py-3 text-right text-sm text-gray-700 dark:text-gray-300 tabular-nums">{totalUnits.toLocaleString()}</td>
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 text-right text-sm text-[#4A0F1C] dark:text-[#D4849A] tabular-nums">{ngn(totalSellValue)}</td>
                  <td className="px-5 py-3 text-right text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                    {totalCostValue > 0 ? ngn(totalCostValue) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm">
                    {potentialProfit != null && totalCostValue > 0
                      ? <span className={potentialProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                          {potentialProfit >= 0 ? '+' : ''}{Math.round((potentialProfit / totalCostValue) * 100)}%
                        </span>
                      : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  {pageNums.map((item, i) =>
                    item === '…' ? (
                      <span key={`e${i}`} className="w-7 text-center text-xs text-gray-400 dark:text-gray-600">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item as number)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                          item === page
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
