import { createAdminClient } from '@/lib/supabase/admin'
import GiftItemsManager from '@/components/admin/GiftItemsManager'

export default async function GiftItemsPage() {
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, image, is_gift')
    .order('name')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Gift Items</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Select which categories appear on the Gift Items store page. All products in those categories will be shown.
        </p>
      </div>
      <GiftItemsManager initialCategories={categories ?? []} />
    </div>
  )
}
