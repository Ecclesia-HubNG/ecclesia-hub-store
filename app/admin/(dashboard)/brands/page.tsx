import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { deleteBrand } from '@/lib/actions/brands'
import { DeleteButton } from '@/components/admin/DeleteButton'

export default async function AdminBrandsPage() {
  const supabase = createAdminClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Brands</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{brands?.length ?? 0} total</p>
        </div>
        <Link
          href="/admin/brands/new"
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          Add brand
        </Link>
      </div>

      {!brands?.length ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-gray-600">No brands yet.</p>
          <Link
            href="/admin/brands/new"
            className="text-sm text-gray-900 dark:text-white font-medium mt-2 inline-block hover:underline"
          >
            Add your first brand →
          </Link>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Website</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {brands.map(brand => (
                <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Brand */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center overflow-hidden">
                        {brand.logo ? (
                          <img src={brand.logo} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white leading-tight">{brand.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mt-0.5">/{brand.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Website */}
                  <td className="px-4 py-3">
                    {brand.website ? (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors truncate max-w-[200px] inline-block"
                      >
                        {brand.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-700">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {brand.is_featured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                        Featured
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-5 justify-end">
                      <Link
                        href={`/admin/brands/${brand.id}/edit`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        id={brand.id}
                        action={deleteBrand}
                        confirm={`Delete "${brand.name}"? This can't be undone.`}
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
