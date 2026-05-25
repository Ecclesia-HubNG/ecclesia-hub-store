import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { createCategory } from '@/lib/actions/categories'
import CategoryForm from '@/components/admin/CategoryForm'

export default async function NewCategoryPage() {
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description, image, is_featured, parent_id')
    .order('name')

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/categories" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          ← Categories
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">New category</h1>
      </div>
      <CategoryForm
        action={createCategory}
        submitLabel="Create category"
        categories={categories ?? []}
      />
    </div>
  )
}
