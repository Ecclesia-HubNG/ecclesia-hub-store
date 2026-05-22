'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'

type Option = { value: string; price?: number | null }
type Variant = { name: string; options: Option[] }

function fmt(n: number) {
  return `₦${n.toLocaleString('en', { minimumFractionDigits: 2 })}`
}

export default function AddToCart({
  productId, slug, name, basePrice, thumbnail, variants, stock,
}: {
  productId: string
  slug: string
  name: string
  basePrice: number
  thumbnail: string | null
  variants: Variant[]
  stock: number
}) {
  const { addItem } = useCart()
  const [selected, setSelected] = useState<Record<string, string>>(
    () => Object.fromEntries(variants.map(v => [v.name, (Array.isArray(v.options) ? v.options : [])[0]?.value ?? '']))
  )
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  // Resolve price — use variant price override if set
  const resolvedPrice = (() => {
    for (const v of variants) {
      const opt = (Array.isArray(v.options) ? v.options : []).find(o => o.value === selected[v.name])
      if (opt?.price != null) return opt.price
    }
    return basePrice
  })()

  // Build selectedVariant string for cart
  const variantEntries = variants
    .filter(v => selected[v.name])
    .map(v => ({ groupName: v.name, value: selected[v.name] }))

  const cartVariant = variantEntries.length === 1
    ? variantEntries[0]
    : variantEntries.length > 1
    ? { groupName: variantEntries.map(e => e.groupName).join(' / '), value: variantEntries.map(e => e.value).join(' / ') }
    : undefined

  function handleAdd() {
    addItem({ productId, slug, name, price: resolvedPrice, thumbnail, selectedVariant: cartVariant })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div>
      {/* Variant selectors */}
      {variants.length > 0 && (
        <div className="space-y-4 mb-6">
          {variants.map(v => (
            <div key={v.name}>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {v.name}
                {selected[v.name] && (
                  <span className="font-normal text-gray-400 dark:text-gray-500 ml-1.5">— {selected[v.name]}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(v.options) ? v.options : []).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelected(prev => ({ ...prev, [v.name]: opt.value }))}
                    className={`px-3.5 py-1.5 rounded-lg text-sm border transition-all ${
                      selected[v.name] === opt.value
                        ? 'border-[#4A0F1C] bg-[#4A0F1C] text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {opt.value}
                    {opt.price != null && (
                      <span className={`ml-1.5 text-xs ${selected[v.name] === opt.value ? 'text-white/70' : 'text-gray-400'}`}>
                        {fmt(opt.price)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
            onClick={() => setQty(q => Math.min(stock, q + 1))}
            disabled={qty >= stock}
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
          disabled={stock === 0}
          onClick={handleAdd}
          className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-all ${
            added
              ? 'bg-green-600 text-white'
              : stock === 0
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-[#4A0F1C] text-white hover:bg-[#3A0B15]'
          }`}
        >
          {stock === 0 ? 'Out of stock' : added ? '✓ Added to cart' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
