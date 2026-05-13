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
      {product.categories?.name && (
        <p className="text-xs text-gray-400 mb-0.5">{product.categories.name}</p>
      )}
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
    ? products?.filter(
        p => (p.categories as unknown as { name: string } | null)?.name?.toLowerCase().replace(/\s+/g, '-') === searchParams.category
      )
    : products

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered?.length ?? 0} products</p>
      </div>

      {/* Category filters */}
      {!!categories?.length && (
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <Link
            href="/shop"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !searchParams.category
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </Link>
          {categories.map(cat => {
            const slug = cat.name.toLowerCase().replace(/\s+/g, '-')
            return (
              <Link
                key={cat.id}
                href={`/shop?category=${slug}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchParams.category === slug
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>
      )}

      {/* Grid */}
      {!filtered?.length ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400">No products yet. Check back soon.</p>
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
