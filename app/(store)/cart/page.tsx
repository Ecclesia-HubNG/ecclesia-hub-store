'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useCart, itemKey, type SelectedVariant } from '@/lib/cart-context'
import { validateCoupon } from '@/lib/actions/coupons'

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [{ n: 1, label: 'Cart' }, { n: 2, label: 'Address' }, { n: 3, label: 'Payment' }]
  return (
    <div className="flex items-center justify-center mb-12">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {i > 0 && (
            <div className={`w-20 md:w-28 h-[2px] ${s.n <= step ? 'bg-[#4A0F1C]' : 'bg-gray-200 dark:bg-gray-800'} transition-colors`} />
          )}
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s.n < step  ? 'bg-[#4A0F1C] text-white shadow-lg shadow-[#4A0F1C]/30'
            : s.n === step ? 'bg-[#4A0F1C] text-white ring-4 ring-[#4A0F1C]/20 shadow-lg shadow-[#4A0F1C]/30'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            }`}>
              {s.n < step
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                : s.n}
            </div>
            <span className={`text-xs font-semibold tracking-wide ${s.n === step ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

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
      if ('error' in result) setCouponError(result.error)
      else { applyCoupon(result); setCouponInput('') }
    })
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-[#4A0F1C]/8 dark:bg-[#4A0F1C]/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-[#4A0F1C] dark:text-[#E8C4CB]" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-gray-400 dark:text-gray-500 mb-8 max-w-xs">Add your favourite products and they'll appear here.</p>
        <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#4A0F1C] text-white font-semibold rounded-full hover:bg-[#3A0B15] transition-colors shadow-lg shadow-[#4A0F1C]/25">
          Shop now
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      <Stepper step={1} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* ── Left: items ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Shopping Cart
              <span className="ml-2 text-sm font-normal text-gray-400">({count} item{count !== 1 ? 's' : ''})</span>
            </h1>
            <Link href="/shop" className="text-xs font-medium text-[#4A0F1C] dark:text-[#E8C4CB] hover:underline">
              + Add more items
            </Link>
          </div>

          <div className="space-y-4">
            {items.map(item => {
              const key = itemKey(item.productId, item.selectedVariants)
              const lineTotal = item.price * item.quantity
              return (
                <div key={key} className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 md:p-5 flex gap-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200">

                  {/* Thumbnail */}
                  <Link href={`/product/${item.slug}`} className="shrink-0">
                    <div className="w-[88px] h-[88px] md:w-24 md:h-24 rounded-xl overflow-hidden bg-[#F9F5F0] dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      {item.thumbnail
                        ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" /></svg>
                          </div>
                      }
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link href={`/product/${item.slug}`} className="text-sm md:text-base font-semibold text-gray-900 dark:text-white hover:text-[#4A0F1C] dark:hover:text-[#E8C4CB] transition-colors line-clamp-1">
                        {item.name}
                      </Link>
                      {!!item.selectedVariants?.length && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {item.selectedVariants.map((sv: SelectedVariant) => (
                            <span key={`${sv.groupName}:${sv.value}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                              {sv.groupName}: {sv.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      {/* Unit price */}
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">₦{item.price.toLocaleString('en')} each</p>
                        <p className="text-base font-bold text-[#4A0F1C] dark:text-[#E8C4CB]">
                          ₦{lineTotal.toLocaleString('en')}
                        </p>
                      </div>

                      {/* Qty stepper */}
                      <div className="flex items-center gap-0 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-[#4A0F1C] hover:text-white transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                        </button>
                        <span className="w-9 text-center text-sm font-bold text-gray-900 dark:text-white tabular-nums select-none">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          disabled={item.stock != null && item.quantity >= item.stock}
                          className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-[#4A0F1C] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(key)}
                    className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right: order summary ──────────────────────────────────────────── */}
        <div className="w-full lg:w-[340px] shrink-0 sticky top-24 space-y-4">

          {/* Coupon card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <svg className="w-4 h-4 text-[#4A0F1C] dark:text-[#E8C4CB]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3ZM6 6h.008v.008H6V6Z" />
              </svg>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Coupon Code</p>
            </div>
            <div className="p-4">
              {coupon ? (
                <div className="flex items-center justify-between px-3.5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    </div>
                    <div>
                      <p className="text-xs font-black text-green-700 dark:text-green-400 tracking-wider">{coupon.code}</p>
                      <p className="text-[11px] text-green-600/60 dark:text-green-500/60">Discount applied</p>
                    </div>
                  </div>
                  <button type="button" onClick={removeCoupon} className="text-xs text-green-600 dark:text-green-400 hover:text-red-500 transition-colors font-medium underline underline-offset-2">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 font-mono tracking-widest focus:outline-none focus:border-[#4A0F1C]/50 focus:ring-2 focus:ring-[#4A0F1C]/10 transition"
                    />
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
                    <p className="text-xs text-red-500 flex items-center gap-1 pl-1">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Price summary card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Price Details</p>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Item lines */}
              <div className="space-y-2 pb-3 border-b border-dashed border-gray-100 dark:border-gray-800">
                {items.map(item => (
                  <div key={itemKey(item.productId, item.selectedVariants)} className="flex items-start justify-between gap-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      {item.quantity} × <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white shrink-0 tabular-nums">
                      ₦{(item.price * item.quantity).toLocaleString('en')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white tabular-nums">₦{total.toLocaleString('en')}</span>
              </div>

              {/* Coupon */}
              {coupon && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    Coupon ({coupon.code})
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400 tabular-nums">−₦{discountAmount.toLocaleString('en')}</span>
                </div>
              )}

              {/* Delivery */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Delivery</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">At checkout</span>
              </div>
            </div>

            {/* Total + CTA */}
            <div className="px-5 pb-5 pt-1">
              <div className="flex items-center justify-between mb-4 py-3.5 px-4 bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/10 rounded-xl border border-[#4A0F1C]/10 dark:border-[#4A0F1C]/20">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-xl font-black text-[#4A0F1C] dark:text-[#E8C4CB] tabular-nums">
                  ₦{discountedTotal.toLocaleString('en')}
                </span>
              </div>

              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#4A0F1C] text-white text-sm font-bold rounded-xl hover:bg-[#3A0B15] active:scale-[0.98] transition-all shadow-lg shadow-[#4A0F1C]/25"
              >
                Proceed to checkout
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              <Link href="/shop" className="block text-center text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors mt-3">
                ← Continue shopping
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
