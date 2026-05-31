'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import WishlistButton from '@/components/store/WishlistButton'

type Product = {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  thumbnail: string | null
  stock?: number
  categories?: { name: string } | null
  is_new_arrival?: boolean
}

function CartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  )
}

export default function ProductCard({ product, showCategory = true }: { product: Product; showCategory?: boolean }) {
  const { addItem } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)

  const discountPct =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null

  const outOfStock = product.stock !== undefined && product.stock === 0
  const lowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (outOfStock) return
    addItem({ productId: product.id, slug: product.slug, name: product.name, price: product.price, thumbnail: product.thumbnail })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault()
    if (outOfStock) return
    addItem({ productId: product.id, slug: product.slug, name: product.name, price: product.price, thumbnail: product.thumbnail })
    router.push('/cart')
  }

  return (
    <div className="flex flex-col rounded-[22px] bg-white dark:bg-[#1a1a1a] shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-800 overflow-hidden hover:-translate-y-0.5">

      {/* Image — inner rounded card */}
      <Link href={`/product/${product.slug}`} className="block p-2.5 pb-0">
        <div className="relative rounded-[14px] overflow-hidden bg-[#F5F3F0] dark:bg-[#2a1a1d]" style={{ aspectRatio: '1/1' }}>
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 hover:scale-[1.05] ${outOfStock ? 'opacity-40' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
              </svg>
            </div>
          )}

          {/* Wishlist */}
          <WishlistButton productId={product.id} className="absolute top-2.5 right-2.5" />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {outOfStock && (
              <span className="px-2 py-0.5 bg-gray-900/80 backdrop-blur-sm text-white text-[9px] font-bold rounded-full tracking-wide">Sold out</span>
            )}
            {!outOfStock && product.is_new_arrival && (
              <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full tracking-wide">NEW</span>
            )}
            {!outOfStock && discountPct && (
              <span className="px-2 py-0.5 bg-[#4A0F1C] text-white text-[9px] font-bold rounded-full">{discountPct}% OFF</span>
            )}
            {!outOfStock && lowStock && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">{product.stock} left</span>
            )}
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="px-3.5 pt-3 pb-3.5 flex flex-col gap-2 flex-1">

        {/* Category pill + stars */}
        <div className="flex items-center justify-between gap-2">
          {showCategory && product.categories?.name ? (
            <span className="px-2.5 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold rounded-full leading-none">
              {product.categories.name}
            </span>
          ) : <span />}
          <div className="flex items-center gap-1 shrink-0">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
            </svg>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">New</span>
          </div>
        </div>

        {/* Name */}
        <Link href={`/product/${product.slug}`}>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 hover:text-[#4A0F1C] dark:hover:text-[#E8C4CB] transition-colors">
            {product.name}
          </p>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className={`text-base font-bold ${outOfStock ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            ₦{product.price.toLocaleString('en')}
          </span>
          {!outOfStock && product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-gray-400 line-through">₦{product.compare_at_price.toLocaleString('en')}</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all ${
              outOfStock
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-[#4A0F1C] text-white hover:bg-[#3A0B15]'
            }`}
          >
            {outOfStock ? 'Sold out' : 'Buy Now'}
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            title="Add to cart"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              added
                ? 'bg-green-600 text-white'
                : outOfStock
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-[#4A0F1C] text-white hover:bg-[#3A0B15]'
            }`}
          >
            {added
              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              : <CartIcon />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
