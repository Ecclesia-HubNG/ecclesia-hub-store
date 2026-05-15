import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const supabase = createClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  const filtered = searchParams.category
    ? products?.filter(p => {
        const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories
        return (cat as { name: string } | null)?.name?.toLowerCase().replace(/\s+/g, '-') === searchParams.category
      })
    : products

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filtered?.length ?? 0} products</p>
      </div>

      {/* Category filters */}
      {!!categories?.length && (
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <Link
            href="/shop"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !searchParams.category
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </Link>
          {categories.map(cat => {
            const catSlug = cat.name.toLowerCase().replace(/\s+/g, '-')
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {cat.name}
              </Link>
            )
          })}
        </div>
      )}

      {/* Grid */}
      {!filtered?.length ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <p className="text-gray-400 dark:text-gray-600">No products yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product as typeof product & { categories: { name: string } | null }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
