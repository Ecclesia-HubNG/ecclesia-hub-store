import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ImageGallery from '@/components/store/ImageGallery'
import VariantSelector from '@/components/store/VariantSelector'

function fmt(n: number) {
  return `₦${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const relatedIds: string[] = product.related_product_ids ?? []
  const { data: related } = relatedIds.length
    ? await supabase
        .from('products')
        .select('id, name, slug, price, thumbnail')
        .in('id', relatedIds)
        .eq('is_active', true)
    : { data: [] }

  const images: string[] = product.images?.length
    ? product.images
    : product.thumbnail
    ? [product.thumbnail]
    : []

  const category = product.categories as { name: string } | null
  const variants = (product.variants ?? []) as Array<{ name: string; options: Array<{ value: string; price?: number | null }> }>
  const attributes = (product.attributes ?? []) as Array<{ key: string; value: string }>

  const now = new Date()
  const saleActive =
    product.sale_price &&
    (!product.sale_starts_at || new Date(product.sale_starts_at) <= now) &&
    (!product.sale_ends_at || new Date(product.sale_ends_at) >= now)

  const displayPrice = saleActive ? product.sale_price : product.price
  const comparePrice = saleActive ? product.compare_at_price ?? product.price : product.compare_at_price
  const discountPct =
    saleActive && comparePrice && comparePrice > displayPrice
      ? Math.round((1 - displayPrice / comparePrice) * 100)
      : null

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-10">
        <Link href="/shop" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Shop</Link>
        {category && (
          <>
            <span>/</span>
            <span>{category.name}</span>
          </>
        )}
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">

        {/* Left — images */}
        <ImageGallery images={images} name={product.name} />

        {/* Right — info */}
        <div>
          {category && (
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
              {category.name}
            </p>
          )}

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
            {product.name}
          </h1>

          {product.brand && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">by {product.brand}</p>
          )}

          {/* Price row */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(displayPrice)}</span>
            {comparePrice && comparePrice > displayPrice && (
              <span className="text-base text-gray-400 dark:text-gray-600 line-through">{fmt(comparePrice)}</span>
            )}
            {discountPct && (
              <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
                {discountPct}% off
              </span>
            )}
          </div>

          {product.short_description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              {product.short_description}
            </p>
          )}

          {/* Variants */}
          <VariantSelector variants={variants} />

          {/* Stock status */}
          <p className="text-sm mb-5">
            {product.stock > 5 ? (
              <span className="text-green-600 dark:text-green-400 font-medium">In stock</span>
            ) : product.stock > 0 ? (
              <span className="text-amber-500 dark:text-amber-400 font-medium">Only {product.stock} left</span>
            ) : (
              <span className="text-red-500 dark:text-red-400 font-medium">Out of stock</span>
            )}
          </p>

          {/* CTA */}
          <button
            disabled={product.stock === 0}
            className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>

          {/* Attributes */}
          {attributes.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
              {attributes.map(attr => (
                <div key={attr.key} className="flex gap-4 text-sm">
                  <span className="text-gray-400 dark:text-gray-500 w-28 shrink-0">{attr.key}</span>
                  <span className="text-gray-700 dark:text-gray-300">{attr.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* SKU / Barcode */}
          {(product.sku || product.barcode) && (
            <div className="mt-4 space-y-1.5">
              {product.sku && (
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  SKU: <span className="font-mono">{product.sku}</span>
                </p>
              )}
              {product.barcode && (
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Barcode: <span className="font-mono">{product.barcode}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="max-w-2xl mb-20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About this product</h2>
          <div className="text-gray-500 dark:text-gray-400 text-sm leading-7 whitespace-pre-line">
            {product.description}
          </div>
        </div>
      )}

      {/* Related products */}
      {!!related?.length && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map(p => (
              <Link key={p.id} href={`/product/${p.slug}`} className="group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden mb-3">
                  {p.thumbnail ? (
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors leading-snug">
                  {p.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fmt(p.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
