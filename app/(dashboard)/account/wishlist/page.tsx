'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useWishlist } from '@/lib/wishlist-context'
import ProductCard from '@/components/store/ProductCard'

type WishlistProduct = {
  id: string; name: string; slug: string; price: number
  compare_at_price: number | null; thumbnail: string | null
  stock: number; categories: { name: string } | null
}

export default function WishlistPage() {
  const supabase = createClient()
  const { items: wishlistIds, ready } = useWishlist()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (wishlistIds.length === 0) { setProducts([]); setLoading(false); return }

    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, categories(name)')
      .in('id', wishlistIds)
      .eq('is_active', true)
      .then(({ data }) => {
        const map = new Map((data ?? []).map((p: any) => [
          p.id,
          { ...p, categories: Array.isArray(p.categories) ? (p.categories[0] ?? null) : p.categories }
        ]))
        setProducts(wishlistIds.map(id => map.get(id)).filter(Boolean) as WishlistProduct[])
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, wishlistIds.length])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Wishlist</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {wishlistIds.length > 0 ? `${wishlistIds.length} saved item${wishlistIds.length !== 1 ? 's' : ''}` : 'Items you\'ve saved'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-white dark:bg-gray-900" />
              <div className="p-4 space-y-2 bg-white dark:bg-gray-900">
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 rounded-full bg-[#4A0F1C]/8 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#4A0F1C] dark:text-[#D4849A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No saved items yet</p>
          <p className="text-sm text-gray-400 mb-5">Tap the heart icon on any product to save it here</p>
          <Link href="/shop" className="inline-flex px-5 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] transition-colors">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
