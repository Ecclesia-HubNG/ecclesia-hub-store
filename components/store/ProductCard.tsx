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
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className={`w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04] ${outOfStock ? 'opacity-50' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-14 h-14 text-gray-200 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {outOfStock && (
            <span className="px-2 py-0.5 bg-gray-800/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded-md tracking-wide">
              Sold out
            </span>
          )}
          {!outOfStock && discountPct && (
            <span className="px-2 py-0.5 bg-[#4A0F1C] text-white text-[10px] font-bold rounded-md">
              {discountPct}% OFF
            </span>
          )}
          {!outOfStock && lowStock && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-semibold rounded-md">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Hover CTA */}
        {!outOfStock && (
          <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <div className="w-full py-2.5 bg-[#4A0F1C] text-white text-xs font-semibold rounded-xl text-center shadow-lg">
              View product
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        {showCategory && product.categories?.name && (
          <p className="text-[10px] font-bold text-[#6B1A2A] dark:text-[#D4849A] uppercase tracking-widest mb-1">
            {product.categories.name}
          </p>
        )}
        <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-snug line-clamp-2 flex-1 mb-3">
          {product.name}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[15px] font-bold ${outOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-[#4A0F1C] dark:text-[#E8C4CB]'}`}>
            ₦{product.price.toLocaleString('en')}
          </span>
          {!outOfStock && discountPct && product.compare_at_price && (
            <span className="text-xs text-gray-400 dark:text-gray-600 line-through">
              ₦{product.compare_at_price.toLocaleString('en')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
