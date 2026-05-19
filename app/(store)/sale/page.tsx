export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/store/ProductCard'

export default async function SalePage() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail, stock, categories(name)')
    .eq('is_active', true)
    .not('compare_at_price', 'is', null)
    .order('compare_at_price', { ascending: false })

  const discounted = (products ?? []).filter(
    p => p.compare_at_price && p.compare_at_price > p.price
  )

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B1A2A] dark:text-[#D4849A] mb-1">Limited time</p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
          Get Up to 70% Off
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {discounted.length} product{discounted.length !== 1 ? 's' : ''} on sale right now.
        </p>
      </div>

      {discounted.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {discounted.map(product => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                categories: Array.isArray(product.categories)
                  ? (product.categories[0] ?? null)
                  : product.categories,
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No sale products at the moment. Check back soon.</p>
      )}
    </div>
  )
}
