import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const [{ data: category }, { data: allCategories }] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', params.slug).single(),
    supabase.from('categories').select('id, name, slug, parent_id').order('name'),
  ])

  if (!category) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail')
    .eq('is_active', true)
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Category hero */}
      <div className={`relative ${category.image ? 'h-56 md:h-72' : 'py-14'} bg-gray-100 dark:bg-gray-900 overflow-hidden`}>
        {category.image && (
          <>
            <img
              src={category.image}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}
        <div className={`relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-center ${category.image ? 'text-white' : ''}`}>
          <nav className="flex items-center gap-1.5 text-sm mb-4 opacity-70">
            <Link href="/shop" className="hover:opacity-100 transition-opacity">Shop</Link>
            <span>/</span>
            <span className="opacity-100 font-medium">{category.name}</span>
          </nav>
          <h1 className={`text-3xl md:text-4xl font-bold leading-tight ${category.image ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {category.name}
          </h1>
          {category.description && (
            <p className={`mt-2 text-sm md:text-base max-w-xl leading-relaxed ${category.image ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
              {category.description}
            </p>
          )}
          <p className={`mt-3 text-xs font-medium uppercase tracking-widest ${category.image ? 'text-white/60' : 'text-gray-400 dark:text-gray-600'}`}>
            {products?.length ?? 0} {products?.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {(() => {
          const parentCat = category.parent_id ? allCategories?.find(c => c.id === category.parent_id) : null
          const siblings = parentCat
            ? allCategories?.filter(c => c.parent_id === parentCat.id) ?? []
            : allCategories?.filter(c => !c.parent_id) ?? []
          const subcategories = allCategories?.filter(c => c.parent_id === category.id) ?? []

          return (
            <>
              {/* Breadcrumb nav: siblings of current category (or top-level if no parent) */}
              {siblings.length > 1 && (
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {parentCat ? (
                    <Link
                      href={`/category/${parentCat.slug}`}
                      className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      ← {parentCat.name}
                    </Link>
                  ) : (
                    <Link
                      href="/shop"
                      className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      All
                    </Link>
                  )}
                  {siblings.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        cat.slug === params.slug
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Subcategories of current category */}
              {subcategories.length > 0 && (
                <div className="mb-10">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Browse subcategories</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {subcategories.map(sub => (
                      <Link
                        key={sub.id}
                        href={`/category/${sub.slug}`}
                        className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#4A0F1C]/8 dark:bg-[#4A0F1C]/20 text-[#4A0F1C] dark:text-[#E8C4CB] hover:bg-[#4A0F1C]/15 dark:hover:bg-[#4A0F1C]/30 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        })()}

        {/* Product grid */}
        {!products?.length ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <p className="text-gray-400 dark:text-gray-600 mb-2">No products in this category yet.</p>
            <Link href="/shop" className="text-sm text-gray-900 dark:text-white font-medium hover:underline">
              Browse all products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} showCategory={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
