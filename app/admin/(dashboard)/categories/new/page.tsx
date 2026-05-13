import Link from 'next/link'
import { createCategory } from '@/lib/actions/categories'
import CategoryForm from '@/components/admin/CategoryForm'

export default function NewCategoryPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/categories" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Categories
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">New category</h1>
      </div>
      <CategoryForm action={createCategory} submitLabel="Create category" />
    </div>
  )
}
