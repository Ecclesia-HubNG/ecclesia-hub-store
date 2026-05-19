import Link from 'next/link'

type ProductVariant = { name: string; options: { value: string; price?: number | null }[] }

type Product = {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  thumbnail: string | null
  stock?: number
  variants?: ProductVariant[] | null
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
      className="group flex flex-col rounded-[20px] overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image area */}
      <div className="relative overflow-hidden bg-[#F8EEF0] dark:bg-[#2a1a1d]" style={{ aspectRatio: '4/4.2' }}>
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06] ${outOfStock ? 'opacity-40' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-14 h-14 text-[#D4849A]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
            </svg>
          </div>
        )}

        {/* Heart button */}
        <button
          type="button"
          onClick={e => e.preventDefault()}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-black/60 transition-colors"
          aria-label="Save to wishlist"
        >
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {outOfStock && (
            <span className="px-2.5 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-full tracking-wide">
              Sold out
            </span>
          )}
          {!outOfStock && discountPct && (
            <span className="px-2.5 py-1 bg-[#4A0F1C] text-white text-[10px] font-bold rounded-full">
              {discountPct}% OFF
            </span>
          )}
          {!outOfStock && lowStock && (
            <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full">
              {product.stock} left
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col gap-2.5">
        {/* Name + category */}
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-1">
            {product.name}
          </p>
          {showCategory && product.categories?.name && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
              {product.categories.name}
            </p>
          )}
        </div>

        {/* Price + Buy row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className={`text-[15px] font-bold leading-none ${outOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}`}>
              ₦{product.price.toLocaleString('en')}
            </span>
            {!outOfStock && discountPct && product.compare_at_price && (
              <span className="text-[11px] text-gray-400 dark:text-gray-600 line-through leading-none">
                ₦{product.compare_at_price.toLocaleString('en')}
              </span>
            )}
          </div>

          <span className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 ${
            outOfStock
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
              : 'bg-[#4A0F1C] text-white group-hover:bg-[#6B1A2A]'
          }`}>
            {outOfStock ? 'Sold out' : 'Shop'}
          </span>
        </div>
      </div>
    </Link>
  )
}
