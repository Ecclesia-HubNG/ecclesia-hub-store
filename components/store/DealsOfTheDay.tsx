import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DealsOfTheDay() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail, stock')
    .eq('is_active', true)
    .limit(18)

  if (!products?.length) return null

  return (
    <section className="w-full px-3 md:px-5 pb-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B1A2A] dark:text-[#D4849A] mb-1">Today only</p>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
            Deals of the Day
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-sm font-semibold text-[#4A0F1C] dark:text-[#D4849A] hover:underline underline-offset-2 flex items-center gap-1 shrink-0"
        >
          View All
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 4-col × 3-row grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.map(product => {
          const discountPct = product.compare_at_price && product.compare_at_price > product.price
            ? Math.round((1 - product.price / product.compare_at_price) * 100)
            : null
          const outOfStock = product.stock === 0

          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group flex flex-col rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              {/* Image */}
              <div className="p-2.5 pb-0">
                <div className="relative rounded-[14px] overflow-hidden bg-[#F5F3F0] dark:bg-[#2a1a1d] aspect-square">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? 'opacity-40' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                      </svg>
                    </div>
                  )}
                  {discountPct && !outOfStock && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#4A0F1C] text-white text-[9px] font-bold rounded-full">
                      -{discountPct}%
                    </span>
                  )}
                  {outOfStock && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-gray-900/80 text-white text-[9px] font-bold rounded-full">
                      Sold out
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#4A0F1C] dark:group-hover:text-[#E8C4CB] transition-colors">
                  {product.name}
                </p>

                {/* Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-2.5 h-2.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                    </svg>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-0.5">New</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className={`text-sm font-bold ${outOfStock ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    ₦{product.price.toLocaleString('en')}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-[11px] text-gray-400 line-through">
                      ₦{product.compare_at_price.toLocaleString('en')}
                    </span>
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
