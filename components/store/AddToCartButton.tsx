'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'

type Props = {
  product: {
    id: string
    slug: string
    name: string
    price: number
    thumbnail: string | null
    stock?: number
  }
  className?: string
}

export default function AddToCartButton({ product, className = '' }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const outOfStock = product.stock === 0

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem({ productId: product.id, slug: product.slug, name: product.name, price: product.price, thumbnail: product.thumbnail })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  if (outOfStock) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Add to cart"
      className={`w-full h-8 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
        added
          ? 'bg-green-600 text-white'
          : 'bg-[#4A0F1C] text-white hover:bg-[#3A0B15]'
      } ${className}`}
    >
      {added ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Added
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          Add to cart
        </>
      )}
    </button>
  )
}
