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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product, i) => {
          const { bg, accent } = PALETTES[i % PALETTES.length]
          const savings = product.compare_at_price
            ? Math.round(product.compare_at_price - product.price)
            : null

          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
              style={{ backgroundColor: bg }}
            >
              {/* Text block */}
              <div className="px-5 pt-5 pb-4">
                <p className="text-sm font-semibold text-gray-700 mb-0.5">Save</p>
                {savings && (
                  <p className="text-3xl font-black mb-2" style={{ color: accent }}>
                    ₦{savings.toLocaleString('en')}
                  </p>
                )}
                <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-1">{product.name}</p>
                {product.short_description && (
                  <p className="text-[13px] text-gray-500 leading-snug mt-1 line-clamp-2">{product.short_description}</p>
                )}
              </div>

              {/* Image */}
              <div className="mt-auto h-80 overflow-hidden">
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
            </Link>
          )
        })}
      </div>
    </section>
  )
}
