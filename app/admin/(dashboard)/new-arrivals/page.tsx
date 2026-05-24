import { createAdminClient } from '@/lib/supabase/admin'
import NewArrivalsManager from '@/components/admin/NewArrivalsManager'

export default async function NewArrivalsPage() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, thumbnail, price, is_active, is_new_arrival')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">New Arrivals</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manage which products appear on the New Arrivals page. Toggle products on or off.
        </p>
      </div>
      <NewArrivalsManager initialProducts={products ?? []} />
    </div>
  )
}
