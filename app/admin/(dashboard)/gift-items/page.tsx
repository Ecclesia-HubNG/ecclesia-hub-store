import { createAdminClient } from '@/lib/supabase/admin'
import GiftItemsManager from '@/components/admin/GiftItemsManager'

export default async function GiftItemsPage() {
  const supabase = createAdminClient()
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('id, name, thumbnail, price, is_gift').eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name, slug, image, is_gift').order('name'),
  ])

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Gift Items</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Add individual products or whole categories to the Gift Items store page.
        </p>
      </div>
      <GiftItemsManager initialProducts={products ?? []} initialCategories={categories ?? []} />
    </div>
  )
}
