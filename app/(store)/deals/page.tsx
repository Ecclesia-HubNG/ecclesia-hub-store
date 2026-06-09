export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/store/ProductCard'

export default async function DealsPage() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail, stock, categories(name)')
    .eq('is_active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(48)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B1A2A] dark:text-[#D4849A] mb-1">Today only</p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
          Deals of the Day
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Fresh deals updated daily — shop before they're gone.
        </p>
      </div>

      {products?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(product => (
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
        <p className="text-gray-400 text-sm">No deals available right now.</p>
      )}
    </div>
  )
}
