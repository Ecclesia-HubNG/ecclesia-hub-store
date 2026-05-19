'use client'

import { useWishlist } from '@/lib/wishlist-context'

export default function WishlistButton({
  productId,
  className = '',
}: {
  productId: string
  className?: string
}) {
  const { isInWishlist, toggle } = useWishlist()
  const saved = isInWishlist(productId)

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(productId) }}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
        saved
          ? 'bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30'
          : 'bg-white/80 dark:bg-black/40 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-black/60'
      } ${className}`}
    >
      <svg
        className={`w-4 h-4 transition-all duration-200 ${saved ? 'text-[#4A0F1C] dark:text-[#E8C4CB] scale-110' : 'text-gray-400 dark:text-gray-300'}`}
        viewBox="0 0 24 24"
        stroke={saved ? 'none' : 'currentColor'}
        fill={saved ? 'currentColor' : 'none'}
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  )
}
