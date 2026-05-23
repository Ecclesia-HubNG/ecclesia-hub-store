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

const QtyBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-[#4A0F1C]/10 disabled:opacity-40 transition-colors"
  >
    {children}
  </button>
)

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
  // qtys: key → qty. A key being present means that option is checked.
  const [qtys, setQtys] = useState<Record<string, number>>({})
  const [globalQty, setGlobalQty] = useState(1)
  const [added, setAdded] = useState(false)

  const hasVariants = variants.length > 0
  const isOutOfStock = stock === 0

  function toggle(groupName: string, value: string, optStock: number | null | undefined) {
    if (optStock === 0) return
    const k = optKey(groupName, value)
    setQtys(prev => {
      if (k in prev) {
        const next = { ...prev }
        delete next[k]
        return next
      }
      return { ...prev, [k]: 1 }
    })
  }

  function setOptQty(k: string, qty: number, optStock: number | null | undefined) {
    if (qty <= 0) {
      setQtys(prev => { const n = { ...prev }; delete n[k]; return n })
      return
    }
    const max = optStock ?? stock
    setQtys(prev => ({ ...prev, [k]: max > 0 ? Math.min(qty, max) : qty }))
  }

  // Flat list of checked options with resolved details
  const checkedOptions = variants.flatMap(v =>
    (Array.isArray(v.options) ? v.options : [])
      .filter(o => optKey(v.name, o.value) in qtys)
      .map(o => ({
        key: optKey(v.name, o.value),
        groupName: v.name,
        value: o.value,
        price: o.price ?? basePrice,
        stock: o.stock,
        qty: qtys[optKey(v.name, o.value)],
      }))
  )

  const variantTotal = checkedOptions.reduce((sum, o) => sum + o.price * o.qty, 0)
  const noneSelected = hasVariants && checkedOptions.length === 0

  function handleAdd() {
    if (hasVariants) {
      if (checkedOptions.length === 0) return
      // Each checked option → its own cart line item
      for (const opt of checkedOptions) {
        addItem({
          productId,
          slug,
          name,
          price: opt.price,
          thumbnail,
          selectedVariants: [{ groupName: opt.groupName, value: opt.value, price: opt.price }],
          quantity: opt.qty,
        })
      }
    } else {
      addItem({ productId, slug, name, price: basePrice, thumbnail, quantity: globalQty })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const Minus = (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  )
  const Plus = (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )

  return (
    <div>
      {/* Variant checkboxes with per-option qty */}
      {hasVariants && (
        <div className="space-y-5 mb-6">
          {variants.map(v => (
            <div key={v.name}>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">{v.name}</p>
              <div className="space-y-2">
                {(Array.isArray(v.options) ? v.options : []).map(opt => {
                  const k = optKey(v.name, opt.value)
                  const isChecked = k in qtys
                  const optQty = qtys[k] ?? 1
                  const optStock = opt.stock
                  const outOfStock = optStock === 0
                  const lowStock = optStock != null && optStock > 0 && optStock <= 5
                  const optPrice = opt.price ?? basePrice

                  return (
                    <div
                      key={opt.value}
                      className={`rounded-xl border transition-all ${
                        outOfStock
                          ? 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-50'
                          : isChecked
                          ? 'border-[#4A0F1C] bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {/* Checkbox row */}
                      <label className={`flex items-center gap-3 px-3.5 py-2.5 select-none ${outOfStock ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={outOfStock}
                          onChange={() => toggle(v.name, opt.value, optStock)}
                          className="w-4 h-4 shrink-0 rounded border-gray-300 accent-[#4A0F1C] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${outOfStock ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}`}>
                            {opt.value}
                          </span>
                          {outOfStock && <span className="ml-2 text-xs text-red-400 dark:text-red-500">Out of stock</span>}
                          {lowStock && !outOfStock && <span className="ml-2 text-xs text-amber-500 dark:text-amber-400">Only {optStock} left</span>}
                        </div>
                        <span className={`text-sm font-medium shrink-0 ${isChecked ? 'text-[#4A0F1C] dark:text-[#E8C4CB]' : 'text-gray-500 dark:text-gray-400'}`}>
                          {fmt(optPrice)}
                        </span>
                      </label>

                      {/* Per-option qty stepper — slides in when checked */}
                      {isChecked && (
                        <div className="flex items-center justify-between px-3.5 pb-3 gap-3">
                          <div className="flex items-center border border-[#4A0F1C]/20 rounded-lg overflow-hidden">
                            <QtyBtn onClick={() => setOptQty(k, optQty - 1, optStock)}>{Minus}</QtyBtn>
                            <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{optQty}</span>
                            <QtyBtn
                              onClick={() => setOptQty(k, optQty + 1, optStock)}
                              disabled={optStock != null && optQty >= optStock}
                            >{Plus}</QtyBtn>
                          </div>
                          {optQty > 1 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              = <span className="font-semibold text-gray-800 dark:text-gray-200">{fmt(optPrice * optQty)}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Running total */}
          {checkedOptions.length > 0 && (
            <div className="flex justify-between items-center px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {checkedOptions.length} variant{checkedOptions.length !== 1 ? 's' : ''} · {checkedOptions.reduce((s, o) => s + o.qty, 0)} items
              </span>
              <span className="font-bold text-gray-900 dark:text-white">{fmt(variantTotal)}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex gap-3 mb-5">
        {/* Global qty stepper — only for products without variants */}
        {!hasVariants && (
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setGlobalQty(q => Math.max(1, q - 1))}
              className="w-10 h-12 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
            </button>
            <span className="w-10 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{globalQty}</span>
            <button
              type="button"
              onClick={() => setGlobalQty(q => Math.min(stock, q + 1))}
              disabled={globalQty >= stock}
              className="w-10 h-12 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={isOutOfStock || noneSelected}
          onClick={handleAdd}
          className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-all ${
            added
              ? 'bg-green-600 text-white'
              : isOutOfStock
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : noneSelected
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-[#4A0F1C] text-white hover:bg-[#3A0B15]'
          }`}
        >
          {isOutOfStock ? 'Out of stock' : added ? '✓ Added to cart' : noneSelected ? 'Select a variant' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
