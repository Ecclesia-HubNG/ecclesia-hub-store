import { createAdminClient } from '@/lib/supabase/admin'
import BestSellersManager from '@/components/admin/BestSellersManager'

export default async function BestSellersPage() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, thumbnail, price, is_active, is_bestseller')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Best Sellers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manually curate which products appear on the Best Sellers page. Toggle products on or off.
        </p>
      </div>
      <BestSellersManager initialProducts={products ?? []} />
    </div>
  )
}
