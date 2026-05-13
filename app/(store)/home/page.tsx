import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function ProductCard({
  product,
}: {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    thumbnail: string | null
    categories: { name: string } | null
  }
}) {
  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-0.5">{product.categories?.name}</p>
      <p className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
        {product.name}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-semibold text-gray-900">
          {product.price.toLocaleString('en', { minimumFractionDigits: 2 })}
        </span>
        {product.compare_at_price && (
          <span className="text-xs text-gray-400 line-through">
            {product.compare_at_price.toLocaleString('en', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </Link>
  )
}

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
        <p className="text-sm font-medium text-gray-400 tracking-widest uppercase mb-4">
          Faith. Word. Life.
        </p>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight tracking-tight max-w-2xl mx-auto">
          Resources to grow your faith
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
          Bibles, books, and spiritual resources carefully curated for every believer.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/shop"
            className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors"
          >
            Shop now
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            About us →
          </Link>
        </div>
      </section>

      {/* Featured products */}
      {!!featured?.length && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Featured</h2>
            <Link href="/shop" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
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
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Browse our full collection</h3>
            <p className="text-sm text-gray-500 mt-1">
              From study Bibles to devotionals — something for every stage of your journey.
            </p>
          </div>
          <Link
            href="/shop"
            className="shrink-0 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors"
          >
            Go to shop
          </Link>
        </div>
      </section>
    </div>
  )
}
