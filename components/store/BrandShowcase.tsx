import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

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

export default async function BrandShowcase() {
  const supabase = createAdminClient()

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, logo')
    .order('name')
    .limit(8)

  if (!brands?.length) return null

  return (
    <section className="w-full px-3 md:px-5 pb-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B1A2A] dark:text-[#D4849A] mb-1">Our partners</p>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
            Shop by Brand
          </h2>
        </div>
        <Link
          href="/brands"
          className="text-sm font-semibold text-[#4A0F1C] dark:text-[#D4849A] hover:underline underline-offset-2 flex items-center gap-1 shrink-0"
        >
          View All
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {brands.map((brand, i) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="group flex items-center gap-4 px-5 py-4 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200"
          >
            {/* Logo / Initial */}
            <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center overflow-hidden ${brand.logo ? '' : AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-lg font-black uppercase">{brand.name.charAt(0)}</span>
              )}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-[#4A0F1C] dark:group-hover:text-[#E8C4CB] transition-colors">
                {brand.name}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Free delivery available</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
