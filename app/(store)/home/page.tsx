import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'

export default async function HomePage() {
  const supabase = createClient()

  const { data: featured } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail, categories(name)')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(4)

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-4">
          Faith. Word. Life.
        </p>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight max-w-2xl mx-auto">
          Resources to grow your faith
        </h1>
        <p className="mt-5 text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Bibles, books, and spiritual resources carefully curated for every believer.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/shop"
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            Shop now
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            About us →
          </Link>
        </div>
      </section>

      {/* Featured products */}
      {!!featured?.length && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Featured</h2>
            <Link href="/shop" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map(product => (
              <ProductCard
                key={product.id}
                product={product as typeof product & { categories: { name: string } | null }}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA strip */}
      <section className="bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Browse our full collection</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              From study Bibles to devotionals — something for every stage of your journey.
            </p>
          </div>
          <Link
            href="/shop"
            className="shrink-0 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            Go to shop
          </Link>
        </div>
      </section>
    </div>
  )
}
