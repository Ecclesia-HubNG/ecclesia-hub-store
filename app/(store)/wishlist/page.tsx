'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWishlist } from '@/lib/wishlist-context'
import { createClient } from '@/lib/supabase/client'
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

export default function WishlistPage() {
  const { items, ready } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (items.length === 0) { setLoading(false); setProducts([]); return }

    const supabase = createClient()
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, categories(name)')
      .in('id', items)
      .eq('is_active', true)
      .then(({ data }) => {
        // Preserve wishlist order
        const map = new Map((data ?? []).map((p: any) => [p.id, { ...p, categories: Array.isArray(p.categories) ? (p.categories[0] ?? null) : p.categories }]))
        setProducts(items.map(id => map.get(id)).filter(Boolean) as Product[])
        setLoading(false)
      })
  }, [items, ready])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-1">Saved</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Wishlist
          {!loading && items.length > 0 && (
            <span className="ml-2 text-base font-normal text-gray-400 dark:text-gray-500">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          )}
        </h1>
      </div>

      {/* Loading */}
      {(loading || !ready) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-[20px] overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse">
              <div className="aspect-square" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && ready && items.length === 0 && (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-full bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#4A0F1C] dark:text-[#E8C4CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nothing saved yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
            Tap the heart on any product to save it here — your wishlist is remembered even without an account.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-full hover:bg-[#6B1A2A] transition-colors"
          >
            Browse products →
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Guest nudge */}
      {ready && items.length > 0 && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-10">
          <Link href="/account" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
            Sign in
          </Link>
          {' '}to keep your wishlist across devices.
        </p>
      )}
    </div>
  )
}
