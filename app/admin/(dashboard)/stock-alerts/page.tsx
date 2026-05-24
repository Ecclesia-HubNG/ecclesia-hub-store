import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function StockAlertsPage() {
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, thumbnail, price, stock, is_active')
    .eq('is_active', true)
    .lte('stock', 5)
    .order('stock', { ascending: true })
    .order('name')

  const outOfStock = (products ?? []).filter(p => p.stock === 0)
  const lowStock = (products ?? []).filter(p => p.stock > 0 && p.stock <= 5)

  return (
    <div className="p-8 max-w-3xl">
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
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-3.5 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{outOfStock.length}</span>
          <span className="text-xs text-red-600 dark:text-red-500">Out of stock</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{lowStock.length}</span>
          <span className="text-xs text-amber-600 dark:text-amber-500">Low stock (≤5)</span>
        </div>
      </div>

      {outOfStock.length === 0 && lowStock.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-16 text-center">
          <svg className="w-10 h-10 text-green-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">All stocked up</p>
          <p className="text-xs text-gray-400 mt-1">No products need restocking right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Out of stock */}
          {outOfStock.length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 overflow-hidden">
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                  Out of Stock — {outOfStock.length} product{outOfStock.length !== 1 ? 's' : ''}
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
                  Low Stock — {lowStock.length} product{lowStock.length !== 1 ? 's' : ''}
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
    </div>
  )
}
