import Link from 'next/link'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  thumbnail: string | null
  stock?: number
  categories?: { name: string } | null
}

export default function ProductCard({ product, showCategory = true }: { product: Product; showCategory?: boolean }) {
  const discountPct =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null

  const outOfStock = product.stock !== undefined && product.stock === 0
  const lowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden mb-3">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {outOfStock && (
            <span className="px-2.5 py-0.5 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full tracking-wide">
              Sold out
            </span>
          )}
          {!outOfStock && discountPct && (
            <span className="px-2.5 py-0.5 bg-[#4A0F1C] text-white text-[10px] font-bold rounded-full tracking-wide">
              -{discountPct}%
            </span>
          )}
          {!outOfStock && lowStock && (
            <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-semibold rounded-full tracking-wide">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Hover slide-up CTA */}
        {!outOfStock && (
          <div className="absolute inset-x-2.5 bottom-2.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl py-2.5 text-center text-xs font-semibold text-gray-900 dark:text-white shadow-lg">
              View product
            </div>
          </div>
        )}
      </div>

      {/* Meta */}
      {showCategory && product.categories?.name && (
        <p className="text-[11px] font-semibold text-[#6B1A2A] dark:text-[#D4849A] uppercase tracking-wider mb-0.5">
          {product.categories.name}
        </p>
      )}
      <p className={`text-sm font-medium leading-snug transition-colors ${outOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
        {product.name}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-sm font-semibold ${outOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}`}>
          ₦{product.price.toLocaleString('en', { minimumFractionDigits: 2 })}
        </span>
        {product.compare_at_price && product.compare_at_price > product.price && (
          <span className="text-xs text-gray-400 dark:text-gray-600 line-through">
            ₦{product.compare_at_price.toLocaleString('en', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </Link>
  )
}
