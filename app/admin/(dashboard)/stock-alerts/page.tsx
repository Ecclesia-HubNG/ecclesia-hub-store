export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

const PAGE_SIZE = 30

export default async function StockAlertsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const supabase = createAdminClient()
  const q = searchParams.q?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1') || 1)

  // Summary counts always reflect full table regardless of search
  const [{ count: outOfStockTotal }, { count: lowStockTotal }] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('is_active', true).eq('stock', 0),
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('is_active', true).gt('stock', 0).lte('stock', 5),
  ])

  // Paginated data query
  let dataQuery = supabase
    .from('products')
    .select('id, name, slug, thumbnail, stock', { count: 'exact' })
    .eq('is_active', true)
    .lte('stock', 5)
    .order('stock', { ascending: true })
    .order('name')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (q) dataQuery = dataQuery.ilike('name', `%${q}%`)

  const { data: products, count: total } = await dataQuery

  const outOfStock = (products ?? []).filter(p => p.stock === 0)
  const lowStock = (products ?? []).filter(p => p.stock > 0 && p.stock <= 5)
  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE)

  const pageLink = (p: number) => `?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Stock Alerts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Products that are out of stock or running low. Update stock in the product editor.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="shrink-0 px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          Manage products
        </Link>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3.5 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{outOfStockTotal ?? 0}</span>
          <span className="text-xs text-red-600 dark:text-red-500">Out of stock</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{lowStockTotal ?? 0}</span>
          <span className="text-xs text-amber-600 dark:text-amber-500">Low stock (≤5)</span>
        </div>
      </div>

      {/* Search */}
      <form className="mb-5" method="GET">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by product name…"
            autoComplete="off"
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            Search
          </button>
          {q && (
            <Link
              href="/admin/stock-alerts"
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
        {q && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {total ?? 0} result{(total ?? 0) !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
          </p>
        )}
      </form>

      {outOfStock.length === 0 && lowStock.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-16 text-center">
          {q ? (
            <>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">No results</p>
              <p className="text-xs text-gray-400 mt-1">No low-stock products match &ldquo;{q}&rdquo;.</p>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 text-green-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">All stocked up</p>
              <p className="text-xs text-gray-400 mt-1">No products need restocking right now.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Out of stock */}
          {outOfStock.length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 overflow-hidden">
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                  Out of Stock — {outOfStock.length} product{outOfStock.length !== 1 ? 's' : ''} on this page
                </p>
              </div>
              <div className="divide-y divide-red-100 dark:divide-red-900/30">
                {outOfStock.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden">
                      {p.thumbnail && <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-red-500 font-semibold mt-0.5">Out of stock</p>
                    </div>
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low stock */}
          {lowStock.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  Low Stock — {lowStock.length} product{lowStock.length !== 1 ? 's' : ''} on this page
                </p>
              </div>
              <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden">
                      {p.thumbnail && <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">{p.stock} left</p>
                    </div>
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages} &middot; {total} total
          </span>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link
                href={pageLink(page - 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ← Prev
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-700 cursor-not-allowed">← Prev</span>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((item, i) =>
                item === '…' ? (
                  <span key={`e${i}`} className="w-7 text-center text-xs text-gray-400 dark:text-gray-600">…</span>
                ) : (
                  <Link
                    key={item}
                    href={pageLink(item as number)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-colors ${
                      item === page
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item}
                  </Link>
                )
              )}
            {page < totalPages ? (
              <Link
                href={pageLink(page + 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Next →
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-700 cursor-not-allowed">Next →</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
