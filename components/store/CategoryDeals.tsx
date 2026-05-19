import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const PALETTES = [
  { bg: '#FEF3EC', accent: '#C4622D' },
  { bg: '#FDEEF1', accent: '#B03050' },
  { bg: '#FFFBEA', accent: '#9A7D0A' },
  { bg: '#EEF0FE', accent: '#3D52C4' },
]

export default async function CategoryDeals() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail, short_description')
    .eq('is_active', true)
    .not('compare_at_price', 'is', null)
    .gt('compare_at_price', 0)
    .order('compare_at_price', { ascending: false })
    .limit(4)

  if (!products?.length) return null

  return (
    <section className="w-full px-3 md:px-5 pb-16">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B1A2A] dark:text-[#D4849A] mb-1">Limited time</p>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
          Get Up to 70% Off
        </h2>
      </div>

      {/* Mobile: single column scroll, Desktop: 4-col grid */}
      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 md:grid-cols-4">
        {products.map((product, i) => {
          const { bg, accent } = PALETTES[i % PALETTES.length]
          const savings = product.compare_at_price
            ? Math.round(product.compare_at_price - product.price)
            : null

          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group flex sm:flex-col rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
              style={{ backgroundColor: bg }}
            >
              {/* Text block */}
              <div className="flex-1 sm:flex-none px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 flex flex-col justify-center sm:justify-start">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-0.5">Save</p>
                {savings && (
                  <p className="text-2xl sm:text-3xl font-black mb-1.5" style={{ color: accent }}>
                    ₦{savings.toLocaleString('en')}
                  </p>
                )}
                <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">{product.name}</p>
                {product.short_description && (
                  <p className="hidden sm:block text-[13px] text-gray-500 leading-snug mt-1 line-clamp-2">{product.short_description}</p>
                )}
              </div>

              {/* Image — inner rounded card like ProductCard */}
              <div className="w-36 shrink-0 p-2 sm:w-auto sm:px-2.5 sm:pb-2.5 sm:mt-auto">
                <div className="rounded-[14px] overflow-hidden bg-[#F5F3F0] h-full sm:h-52 md:h-64 aspect-square sm:aspect-auto">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
