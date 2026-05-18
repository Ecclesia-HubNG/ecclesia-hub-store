import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  thumbnail: string | null
  stock: number
  categories: { name: string } | null
}

export default function FeaturedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null

  return (
    <section className="w-full px-3 md:px-5 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Handpicked favourites</p>
        </div>
        <Link
          href="/shop"
          className="text-sm font-semibold text-[#4A0F1C] dark:text-[#D4849A] hover:underline flex items-center gap-1"
        >
          View All
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <svg className="w-3.5 h-3.5 -ml-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
