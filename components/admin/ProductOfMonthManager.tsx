'use client'

import { useState, useTransition } from 'react'
import { setProductOfMonth, clearProductOfMonth } from '@/lib/actions/products'

type Product = {
  id: string
  name: string
  thumbnail: string | null
  price: number
  is_active: boolean
}

export default function ProductOfMonthManager({
  current,
  products,
}: {
  current: Product[]
  products: Product[]
}) {
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const [optimisticCurrentId, setOptimisticCurrentId] = useState<string | null>(
    current.length === 1 ? current[0].id : null
  )

  const currentProduct =
    optimisticCurrentId != null
      ? products.find(p => p.id === optimisticCurrentId) ?? null
      : null

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(productId: string) {
    setOptimisticCurrentId(productId)
    startTransition(async () => {
      await setProductOfMonth(productId)
    })
  }

  function handleClear() {
    setOptimisticCurrentId(null)
    startTransition(async () => {
      await clearProductOfMonth()
    })
  }

  return (
    <div className="space-y-6">
      {/* Current selection */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Currently Featured</p>
        </div>

        {currentProduct ? (
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
              {currentProduct.thumbnail ? (
                <img
                  src={currentProduct.thumbnail}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentProduct.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ₦{currentProduct.price.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleClear}
              disabled={pending}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No product currently featured</p>
          </div>
        )}
      </div>

      {/* Picker */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex-1">Select a Product</p>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20 w-44"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-gray-400">No products found</p>
          ) : (
            filtered.map(product => {
              const isSelected = product.id === optimisticCurrentId
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product.id)}
                  disabled={pending}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                    isSelected
                      ? 'bg-gray-900 dark:bg-white/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5M3.75 3h16.5M3.75 3v18M20.25 3v18" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {product.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      ₦{product.price.toLocaleString()}
                    </p>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
