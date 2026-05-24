import { createAdminClient } from '@/lib/supabase/admin'
import ProductOfMonthManager from '@/components/admin/ProductOfMonthManager'

export default async function ProductOfMonthPage() {
  const supabase = createAdminClient()

  const [{ data: current }, { data: all }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, thumbnail, price, is_active')
      .eq('is_product_of_month', true),
    supabase
      .from('products')
      .select('id, name, thumbnail, price, is_active')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Product of the Month</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Only one product should be featured here. Selecting a new one automatically clears the previous.
        </p>
      </div>

      {(current?.length ?? 0) > 1 && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>{current?.length} products</strong> are currently marked as product of the month. Select one below to fix this — it will clear the others automatically.
          </p>
        </div>
      )}

      <ProductOfMonthManager current={current ?? []} products={all ?? []} />
    </div>
  )
}
