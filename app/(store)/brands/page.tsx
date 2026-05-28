export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
]

export default async function BrandsPage() {
  const supabase = createAdminClient()

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, logo, description')
    .order('name')

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B1A2A] dark:text-[#D4849A] mb-1">Brands we trust</p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
          Shop by Brand
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Explore all our trusted skincare and wellness brands.
        </p>
      </div>

      {/* Grid */}
      {brands?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((brand, i) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group flex flex-col bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200"
            >
              {/* Logo area */}
              <div className={`h-32 flex items-center justify-center ${brand.logo ? 'bg-gray-50 dark:bg-gray-900 p-6' : AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-5xl font-black uppercase opacity-40">{brand.name.charAt(0)}</span>
                )}
              </div>

              {/* Info */}
              <div className="px-5 py-4">
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#4A0F1C] dark:group-hover:text-[#E8C4CB] transition-colors">
                  {brand.name}
                </p>
                {brand.description ? (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{brand.description}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Free delivery available</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No brands found.</p>
      )}
    </div>
  )
}
