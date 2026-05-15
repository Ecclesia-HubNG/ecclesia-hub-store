import Link from 'next/link'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  thumbnail: string | null
  categories?: { name: string } | null
}

export default function ProductCard({ product, showCategory = true }: { product: Product; showCategory?: boolean }) {
  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden mb-3">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
            </svg>
          </div>
        )}
      </div>
      {showCategory && product.categories?.name && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{product.categories.name}</p>
      )}
      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors leading-snug">
        {product.name}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          ₦{product.price.toLocaleString('en', { minimumFractionDigits: 2 })}
        </span>
        {product.compare_at_price && (
          <span className="text-xs text-gray-400 dark:text-gray-600 line-through">
            ₦{product.compare_at_price.toLocaleString('en', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </Link>
  )
}
