'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'

type Option = { value: string; price?: number | null; stock?: number | null }
type Variant = { name: string; options: Option[] }

function fmt(n: number) {
  return `₦${n.toLocaleString('en', { minimumFractionDigits: 2 })}`
}

function optKey(groupName: string, value: string) {
  return `${groupName}__${value}`
}

export default function AddToCart({
  productId, slug, name, basePrice, thumbnail, variants: variantsProp, stock,
}: {
  productId: string
  slug: string
  name: string
  basePrice: number
  thumbnail: string | null
  variants: Variant[]
  stock: number
}) {
  const variants = Array.isArray(variantsProp) ? variantsProp : []
  const { addItem } = useCart()
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const hasVariants = variants.length > 0

  function toggle(groupName: string, value: string, optStock: number | null | undefined) {
    if (optStock === 0) return
    const k = optKey(groupName, value)
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  // Price = basePrice + sum of all checked option prices
  const variantTotal = variants.reduce((total, v) =>
    total + (Array.isArray(v.options) ? v.options : []).reduce((sum, o) => {
      return checked.has(optKey(v.name, o.value)) && o.price != null ? sum + o.price : sum
    }, 0), 0)
  const resolvedPrice = basePrice + variantTotal

  const selectedVariants = variants.flatMap(v =>
    (Array.isArray(v.options) ? v.options : [])
      .filter(o => checked.has(optKey(v.name, o.value)))
      .map(o => ({ groupName: v.name, value: o.value, price: o.price ?? 0 }))
  )

  // Use product-level stock when no variants, otherwise the binding limit is the product stock
  const effectiveStock = stock
  const isOutOfStock = effectiveStock === 0

  function handleAdd() {
    addItem({
      productId,
      slug,
      name,
      price: resolvedPrice,
      thumbnail,
      selectedVariants: selectedVariants.length > 0 ? selectedVariants : undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div>
      {/* Variant checkboxes */}
      {hasVariants && (
        <div className="space-y-5 mb-6">
          {variants.map(v => (
            <div key={v.name}>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">{v.name}</p>
              <div className="space-y-2">
                {(Array.isArray(v.options) ? v.options : []).map(opt => {
                  const k = optKey(v.name, opt.value)
                  const isChecked = checked.has(k)
                  const optStock = opt.stock
                  const outOfStock = optStock === 0
                  const lowStock = optStock != null && optStock > 0 && optStock <= 5

                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                        outOfStock
                          ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed'
                          : isChecked
                          ? 'border-[#4A0F1C] bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={outOfStock}
                          onChange={() => toggle(v.name, opt.value, optStock)}
                          className="w-4 h-4 shrink-0 rounded border-gray-300 accent-[#4A0F1C] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <span className={`text-sm font-medium ${outOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}`}>
                            {opt.value}
                          </span>
                          {outOfStock && (
                            <span className="ml-2 text-xs text-red-400 dark:text-red-500">Out of stock</span>
                          )}
                          {lowStock && !outOfStock && (
                            <span className="ml-2 text-xs text-amber-500 dark:text-amber-400">Only {optStock} left</span>
                          )}
                        </div>
                      </div>
                      {opt.price != null && (
                        <span className={`text-sm font-medium shrink-0 ${isChecked ? 'text-[#4A0F1C] dark:text-[#E8C4CB]' : 'text-gray-500 dark:text-gray-400'}`}>
                          +{fmt(opt.price)}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Running total when variants are selected */}
          {checked.size > 0 && (
            <div className="flex justify-between items-center px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Price ({checked.size} add-on{checked.size !== 1 ? 's' : ''} selected)
              </span>
              <span className="font-bold text-gray-900 dark:text-white">{fmt(resolvedPrice)}</span>
            </div>
          )}
        </div>
      )}

      {/* Quantity + Add to cart */}
      <div className="flex gap-3 mb-5">
        {/* Qty */}
        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-12 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
          <span className="w-10 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(q => Math.min(effectiveStock, q + 1))}
            disabled={qty >= effectiveStock}
            className="w-10 h-12 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Add to cart */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAdd}
          className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-all ${
            added
              ? 'bg-green-600 text-white'
              : isOutOfStock
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-[#4A0F1C] text-white hover:bg-[#3A0B15]'
          }`}
        >
          {isOutOfStock ? 'Out of stock' : added ? '✓ Added to cart' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
