'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useCart, itemKey, type SelectedVariant } from '@/lib/cart-context'
import { validateCoupon } from '@/lib/actions/coupons'

// ── Progress stepper ──────────────────────────────────────────────────────────
function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Cart' },
    { n: 2, label: 'Address' },
    { n: 3, label: 'Payment' },
  ]
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {/* connector before */}
          {i > 0 && (
            <div className={`w-24 h-px ${s.n <= step ? 'bg-[#4A0F1C]' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
              s.n < step
                ? 'bg-[#4A0F1C] border-[#4A0F1C] text-white'
                : s.n === step
                ? 'bg-[#4A0F1C] border-[#4A0F1C] text-white'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
            }`}>
              {s.n < step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : s.n}
            </div>
            <span className={`text-xs font-medium ${s.n === step ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Cart item card ────────────────────────────────────────────────────────────
function CartItemCard({
  item, onRemove, onQty,
}: {
  item: ReturnType<typeof useCart>['items'][number]
  onRemove: () => void
  onQty: (n: number) => void
}) {
  const key = itemKey(item.productId, item.selectedVariants)
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      {/* Thumbnail */}
      <Link href={`/product/${item.slug}`} className="shrink-0">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
          {item.thumbnail
            ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                </svg>
              </div>
          }
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/product/${item.slug}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-[#4A0F1C] dark:hover:text-[#E8C4CB] transition-colors line-clamp-2 leading-snug">
            {item.name}
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Variants */}
        {!!item.selectedVariants?.length && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {item.selectedVariants.map((sv: SelectedVariant) => (
              <p key={`${sv.groupName}:${sv.value}`} className="text-xs text-gray-400 dark:text-gray-500">
                {sv.groupName}: <span className="font-medium text-gray-600 dark:text-gray-400">{sv.value}</span>
              </p>
            ))}
          </div>
        )}

        {/* Price + qty row */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-base font-bold text-[#4A0F1C] dark:text-[#E8C4CB]">
            ₦{(item.price * item.quantity).toLocaleString('en')}
          </span>

          {/* Qty stepper */}
          <div className="flex items-center gap-0 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => onQty(item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
            </button>
            <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums select-none">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQty(item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </button>
          </div>
        </div>

        {/* Delivery hint */}
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          Delivery calculated at checkout
        </div>
      </div>
    </div>
  )
}

// ── Main cart page ────────────────────────────────────────────────────────────
export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count, coupon, applyCoupon, removeCoupon } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [isPending, startTransition] = useTransition()

  const discountAmount = coupon?.discountAmount ?? 0
  const discountedTotal = Math.max(0, total - discountAmount)

  function handleApplyCoupon() {
    if (!couponInput.trim()) return
    setCouponError('')
    startTransition(async () => {
      const result = await validateCoupon(couponInput.trim(), total)
      if ('error' in result) {
        setCouponError(result.error)
      } else {
        applyCoupon(result)
        setCouponInput('')
      }
    })
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Stepper step={1} />
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">Looks like you haven't added anything yet.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-7 py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-full hover:bg-[#3A0B15] transition-colors">
            Browse shop
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <Stepper step={1} />

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left: cart items ── */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between mb-1 px-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {count} item{count !== 1 ? 's' : ''} in your cart
            </h2>
            <Link href="/shop" className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              Continue shopping
            </Link>
          </div>

          {items.map(item => {
            const key = itemKey(item.productId, item.selectedVariants)
            return (
              <CartItemCard
                key={key}
                item={item}
                onRemove={() => removeItem(key)}
                onQty={n => updateQuantity(key, n)}
              />
            )
          })}
        </div>

        {/* ── Right: summary panel ── */}
        <div className="w-full lg:w-80 shrink-0 sticky top-24 space-y-4">

          {/* Coupon */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Coupons</p>
            </div>
            <div className="px-5 py-4">
              {coupon ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">{coupon.code}</p>
                    {coupon.description && <p className="text-[11px] text-green-600/70 dark:text-green-500/70 truncate">{coupon.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="w-5 h-5 flex items-center justify-center rounded-full text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shrink-0"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3ZM6 6h.008v.008H6V6Z" />
                      </svg>
                      <input
                        type="text"
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Enter coupon code"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#4A0F1C]/40 focus:ring-2 focus:ring-[#4A0F1C]/10 transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isPending || !couponInput.trim()}
                      className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-xl hover:bg-[#4A0F1C] dark:hover:bg-gray-100 disabled:opacity-40 transition-colors shrink-0"
                    >
                      {isPending ? '…' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price details */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Price Details</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* Count */}
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{count} item{count !== 1 ? 's' : ''}</span>
              </div>

              {/* Line items */}
              <div className="space-y-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                {items.map(item => {
                  const key = itemKey(item.productId, item.selectedVariants)
                  return (
                    <div key={key} className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate mr-2 max-w-[160px]">{item.quantity} × {item.name}</span>
                      <span className="shrink-0 font-medium text-gray-700 dark:text-gray-300">₦{(item.price * item.quantity).toLocaleString('en')}</span>
                    </div>
                  )
                })}
              </div>

              {/* Subtotal */}
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">₦{total.toLocaleString('en')}</span>
              </div>

              {/* Coupon discount */}
              {coupon && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    Coupon discount
                  </span>
                  <span className="font-semibold">−₦{discountAmount.toLocaleString('en')}</span>
                </div>
              )}

              {/* Delivery */}
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Delivery Charges</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Calculated at checkout</span>
              </div>

              {/* Total */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-lg font-black text-[#4A0F1C] dark:text-[#E8C4CB]">
                  ₦{discountedTotal.toLocaleString('en')}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#4A0F1C] text-white text-sm font-bold rounded-xl hover:bg-[#3A0B15] active:scale-[0.98] transition-all"
              >
                Proceed to checkout
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
