import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { deleteCategory } from '@/lib/actions/categories'
import { DeleteButton } from '@/components/admin/DeleteButton'

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{categories?.length ?? 0} total</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          Add category
        </Link>
      </div>

      {!categories?.length ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-gray-600">No categories yet.</p>
          <Link
            href="/admin/categories/new"
            className="text-sm text-gray-900 dark:text-white font-medium mt-2 inline-block hover:underline"
          >
            Add your first category →
          </Link>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Description
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img src={cat.image} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white leading-tight">{cat.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mt-0.5">{cat.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {cat.description ?? <span className="text-gray-300 dark:text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4 justify-end">
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        id={cat.id}
                        action={deleteCategory}
                        confirm={`Delete "${cat.name}"? Products in this category won't be deleted.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
