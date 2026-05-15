'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteBrand } from '@/lib/actions/brands'

type Brand = {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  website: string | null
  is_featured: boolean
}

export default function BrandsSideList({ brands }: { brands: Brand[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      await deleteBrand(fd)
      router.refresh()
    })
  }

  return (
    <div className="sticky top-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Brands ({brands.length})
        </p>
        <Link
          href="/admin/brands"
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {brands.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-600">No brands yet</p>
            <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">Create your first one using the form</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {brands.map(brand => (
              <li
                key={brand.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {/* Logo */}
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                  {brand.logo ? (
                    <img src={brand.logo} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{brand.name}</p>
                    {brand.is_featured && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 leading-none">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate mt-0.5">/{brand.slug}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Link
                    href={`/admin/brands/${brand.id}/edit`}
                    className="px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(brand.id, brand.name)}
                    disabled={isPending}
                    className="px-2.5 py-1 text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
