'use client'

import Link from 'next/link'
import { useCart, itemKey } from '@/lib/cart-context'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-24 text-center">
        <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-5" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add some products to get started</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-full hover:bg-[#3A0B15] transition-colors"
        >
          Browse shop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Your Cart <span className="text-gray-400 font-normal text-lg">({count} item{count !== 1 ? 's' : ''})</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Items list */}
        <div className="flex-1 min-w-0 divide-y divide-gray-100 dark:divide-gray-800">
          {items.map(item => {
            const key = itemKey(item.productId, item.selectedVariant)
            return (
              <div key={key} className="flex gap-4 py-5">
                {/* Thumbnail */}
                <Link href={`/product/${item.slug}`} className="shrink-0">
                  <div className="w-20 h-20 rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden border border-gray-100 dark:border-gray-700">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.slug}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#4A0F1C] dark:hover:text-[#E8C4CB] transition-colors line-clamp-2">
                    {item.name}
                  </Link>
                  {item.selectedVariant && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.selectedVariant.groupName}: <span className="font-medium">{item.selectedVariant.value}</span>
                    </p>
                  )}
                  <p className="text-sm font-bold text-[#4A0F1C] dark:text-[#E8C4CB] mt-1">
                    ₦{item.price.toLocaleString('en')}
                  </p>
                </div>

                {/* Qty + remove */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => removeItem(key)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(key, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(key, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                    ₦{(item.price * item.quantity).toLocaleString('en')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div className="w-full lg:w-80 shrink-0 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 sticky top-24">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Order summary</h2>

          <div className="space-y-3 text-sm mb-5">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal ({count} item{count !== 1 ? 's' : ''})</span>
              <span className="font-medium text-gray-900 dark:text-white">₦{total.toLocaleString('en')}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Shipping</span>
              <span className="text-gray-500 dark:text-gray-500 italic">Calculated at checkout</span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-5 flex justify-between">
            <span className="font-semibold text-gray-900 dark:text-white">Total</span>
            <span className="font-bold text-lg text-[#4A0F1C] dark:text-[#E8C4CB]">₦{total.toLocaleString('en')}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#3A0B15] transition-colors"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/shop"
            className="block w-full py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 text-center hover:text-gray-900 dark:hover:text-white transition-colors mt-2"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
