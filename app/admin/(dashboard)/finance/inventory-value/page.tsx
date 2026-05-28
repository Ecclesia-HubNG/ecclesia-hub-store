import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

function ngn(amount: number) {
  return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

type Product = {
  id: string
  name: string
  price: number
  cost_price: number | null
  stock: number
  is_active: boolean
}

export default async function InventoryValuePage() {
  const supabase = createAdminClient()

  // Try with cost_price; fall back gracefully if the column doesn't exist yet
  let products: Product[] = []
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, cost_price, stock, is_active')
    .order('name')

  if (error) {
    // Column may not exist on the live DB yet — fetch without it
    const { data: fallback } = await supabase
      .from('products')
      .select('id, name, price, stock, is_active')
      .order('name')
    products = (fallback ?? []).map((p: any) => ({ ...p, cost_price: null }))
  } else {
    products = (data ?? []) as Product[]
  }

  const inStock = products.filter(p => p.stock > 0)
  const totalUnits = products.reduce((s, p) => s + p.stock, 0)
  const totalSellValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const totalCostValue = products.reduce((s, p) => p.cost_price != null ? s + p.cost_price * p.stock : s, 0)
  const potentialProfit = totalCostValue > 0 ? totalSellValue - totalCostValue : null
  const productsWithCost = products.filter(p => p.cost_price != null).length

  const sorted = [...inStock].sort((a, b) => b.price * b.stock - a.price * a.stock)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Inventory Value</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Worth of all products currently in stock
            {productsWithCost < products.length && productsWithCost > 0 && (
              <span className="ml-2 text-amber-500 dark:text-amber-400 text-xs">
                · Cost price set on {productsWithCost} of {products.length} products
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
                {totalCostValue > 0
                  ? `${Math.round((potentialProfit / totalCostValue) * 100)}% margin on cost`
                  : ''}
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

      {/* Products table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Products in Stock
            <span className="ml-2 text-xs font-normal text-gray-400">({inStock.length})</span>
          </h2>
          {productsWithCost === 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              No cost prices set — edit products to add them
            </span>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No products currently in stock.</p>
            <Link href="/admin/products" className="text-sm text-[#6B1A2A] dark:text-[#D4849A] mt-1 inline-block hover:underline">
              Manage products →
            </Link>
          </div>
        ) : (
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
              {sorted.map(p => {
                const sellValue = p.price * p.stock
                const costValue = p.cost_price != null ? p.cost_price * p.stock : null
                const margin = costValue != null && costValue > 0
                  ? Math.round(((sellValue - costValue) / costValue) * 100)
                  : null
                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/products/${p.id}/edit`} className="font-medium text-gray-900 dark:text-white hover:text-[#4A0F1C] dark:hover:text-[#D4849A] transition-colors">
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
            {/* Totals footer */}
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-t-2 border-gray-200 dark:border-gray-700 font-semibold">
                <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">Total</td>
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
        )}
      </div>
    </div>
  )
}
