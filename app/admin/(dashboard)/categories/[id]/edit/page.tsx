import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateCategory } from '@/lib/actions/categories'
import CategoryForm from '@/components/admin/CategoryForm'

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!category) notFound()

  const boundAction = updateCategory.bind(null, category.id)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/categories" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          ← Categories
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">Edit category</h1>
      </div>
      <CategoryForm action={boundAction} category={category} submitLabel="Update category" />
    </div>
  )
}
