'use client'

export const dynamic = 'force-dynamic'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { createCheckoutSession } from '@/lib/actions/customer-orders'
import { initializePayment } from '@/lib/actions/flutterwave'
import { getShippingZones, type ShippingZone } from '@/lib/actions/shipping'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'
const selectCls = inputCls + ' appearance-none cursor-pointer'

export default function CheckoutPage() {
  const { items, total: subtotal, count } = useCart()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Zones
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState('')

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
  })
  const update = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { getShippingZones().then(setZones) }, [])
  useEffect(() => { if (items.length === 0) router.replace('/cart') }, [items.length, router])

  // ── Derived location state ─────────────────────────────────────────
  const states = useMemo(
    () => Array.from(new Set(zones.map(z => z.state))).sort(),
    [zones],
  )

  const areasForState = useMemo(
    () => zones.filter(z => z.state === selectedState),
    [zones, selectedState],
  )

  // Auto-select zone if the chosen state has only one option
  useEffect(() => {
    if (areasForState.length === 1) {
      setSelectedZoneId(areasForState[0].id)
    } else {
      setSelectedZoneId('')
    }
  }, [areasForState])

  const selectedZone = zones.find(z => z.id === selectedZoneId) ?? null
  const shippingFee = selectedZone?.price ?? null
  const orderTotal = subtotal + (shippingFee ?? 0)
  // ──────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedZone) { setError('Please select your delivery location.'); return }
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address) {
      setError('Please fill in all fields.')
      return
    }

    startTransition(async () => {
      const shipping = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: selectedZone.area || selectedZone.state,
        state: selectedZone.state,
      }

      // 1. Create checkout session (validates stock, no order written yet)
      const sessionResult = await createCheckoutSession(
        items,
        shipping,
        subtotal,
        shippingFee ?? 0,
        orderTotal,
        selectedZone.id,
      )

      if ('error' in sessionResult) {
        setError(sessionResult.error)
        return
      }

      // 2. Initialize Flutterwave with session ID
      const customerName = `${form.firstName} ${form.lastName}`
      const payResult = await initializePayment(
        sessionResult.sessionId,
        form.email,
        orderTotal,
        customerName,
        form.phone,
      )

      if ('error' in payResult) {
        setError(payResult.error ?? 'Could not initialize payment.')
        return
      }

      // 3. Redirect to Flutterwave — order is created only after they pay
      window.location.href = payResult.paymentLink
    })
  }

  if (items.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── 1. Delivery location (shown first so fee is visible) ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Delivery location</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Select your state and area to see the delivery fee.</p>

              <div className="grid grid-cols-2 gap-4">
                {/* State */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">State</label>
                  <div className="relative">
                    <select
                      value={selectedState}
                      onChange={e => setSelectedState(e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="">Select state…</option>
                      {states.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {/* Area — only shown if state selected and has multiple zones */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Area / Zone</label>
                  <div className="relative">
                    <select
                      value={selectedZoneId}
                      onChange={e => setSelectedZoneId(e.target.value)}
                      className={selectCls}
                      disabled={!selectedState || areasForState.length <= 1}
                      required
                    >
                      {!selectedState && <option value="">Select state first…</option>}
                      {selectedState && areasForState.length === 0 && (
                        <option value="">No zones for this state</option>
                      )}
                      {selectedState && areasForState.length === 1 && (
                        <option value={areasForState[0].id}>
                          {areasForState[0].area || areasForState[0].name || 'Whole state'}
                        </option>
                      )}
                      {selectedState && areasForState.length > 1 && (
                        <>
                          <option value="">Select area…</option>
                          {areasForState.map(z => (
                            <option key={z.id} value={z.id}>
                              {z.area || z.name || z.state}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Fee callout — shown as soon as a zone is chosen */}
              {selectedZone && (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20 border border-[#4A0F1C]/15 dark:border-[#4A0F1C]/30 rounded-xl">
                  <svg className="w-4 h-4 text-[#4A0F1C] dark:text-[#E8C4CB] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#4A0F1C] dark:text-[#E8C4CB]">
                      {selectedZone.name || `Delivery to ${selectedZone.area || selectedZone.state}`}
                    </p>
                    <p className="text-xs text-[#4A0F1C]/70 dark:text-[#E8C4CB]/70 mt-0.5">
                      {selectedZone.state}{selectedZone.area ? ` · ${selectedZone.area}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#4A0F1C] dark:text-[#E8C4CB] shrink-0">
                    {shippingFee === 0 ? 'Free' : `₦${(shippingFee ?? 0).toLocaleString('en')}`}
                  </span>
                </div>
              )}

              {zones.length === 0 && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">No delivery options available yet. Please contact us to arrange delivery.</p>
              )}
            </div>

            {/* ── 2. Personal details ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Your details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">First name</label>
                  <input type="text" placeholder="John" value={form.firstName} onChange={e => update('firstName', e.target.value)} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Last name</label>
                  <input type="text" placeholder="Doe" value={form.lastName} onChange={e => update('lastName', e.target.value)} className={inputCls} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email address</label>
                  <input type="email" placeholder="john@example.com" value={form.email} onChange={e => update('email', e.target.value)} className={inputCls} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Phone number</label>
                  <input type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputCls} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Street address
                    {selectedZone && (
                      <span className="ml-1 font-normal text-gray-400">· {selectedZone.area || selectedZone.state}</span>
                    )}
                  </label>
                  <input type="text" placeholder="12 Faith Avenue" value={form.address} onChange={e => update('address', e.target.value)} className={inputCls} required />
                </div>
              </div>
            </div>
          </div>

          {/* ── Order summary (sticky) ── */}
          <div className="w-full lg:w-80 shrink-0 space-y-4 sticky top-24">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Order summary</h2>

              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={`${item.productId}-${(item.selectedVariants ?? []).map(v => v.value).join('-')}`} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                      {item.thumbnail && (
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain p-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                      {!!item.selectedVariants?.length && item.selectedVariants.map(sv => (
                        <p key={`${sv.groupName}:${sv.value}`} className="text-[10px] text-gray-400">
                          {sv.groupName}: {sv.value}
                        </p>
                      ))}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">×{item.quantity}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">₦{(item.price * item.quantity).toLocaleString('en')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm mb-5">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({count} item{count !== 1 ? 's' : ''})</span>
                  <span className="font-medium text-gray-900 dark:text-white">₦{subtotal.toLocaleString('en')}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  {shippingFee !== null ? (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {shippingFee === 0 ? 'Free' : `₦${shippingFee.toLocaleString('en')}`}
                    </span>
                  ) : (
                    <span className="italic text-gray-400 text-xs">Select location above</span>
                  )}
                </div>
                <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span className="text-[#4A0F1C] dark:text-[#E8C4CB] text-base">₦{orderTotal.toLocaleString('en')}</span>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={pending || !selectedZone}
                className="w-full py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? 'Redirecting to payment…' : !selectedZone ? 'Select delivery location' : 'Proceed to payment'}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-3">
                By placing your order you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
