'use client'

export const dynamic = 'force-dynamic'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { createOrder } from '@/lib/actions/customer-orders'
import { initializePayment } from '@/lib/actions/flutterwave'
import { getShippingZones, type ShippingZone } from '@/lib/actions/shipping'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'
const selectCls = inputCls + ' appearance-none cursor-pointer'

export default function CheckoutPage() {
  const { items, total, count } = useCart()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Shipping zones
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [shippingFee, setShippingFee] = useState<number | null>(null)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '',
  })

  const update = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Load zones once
  useEffect(() => {
    getShippingZones().then(setZones)
  }, [])

  // Derived lists
  const states = [...new Set(zones.map(z => z.state))].sort()
  const areasForState = zones.filter(z => z.state === selectedState && z.area !== null)
  const stateWideZone = zones.find(z => z.state === selectedState && z.area === null)

  // Compute shipping fee whenever state/area selection changes
  useEffect(() => {
    if (!selectedState) { setShippingFee(null); return }
    if (areasForState.length > 0) {
      // State has area-level zones — require area selection
      if (!selectedArea) { setShippingFee(null); return }
      const match = zones.find(z => z.state === selectedState && z.area === selectedArea)
      setShippingFee(match ? match.price : null)
    } else {
      // Only a state-wide zone
      setShippingFee(stateWideZone ? stateWideZone.price : null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedArea, zones])

  // Reset area when state changes
  useEffect(() => { setSelectedArea('') }, [selectedState])

  const orderTotal = total + (shippingFee ?? 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address || !selectedState) {
      setError('Please fill in all fields.')
      return
    }
    if (areasForState.length > 0 && !selectedArea) {
      setError('Please select your delivery area.')
      return
    }

    startTransition(async () => {
      const shipping = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: selectedArea || selectedState,
        state: selectedState,
      }

      const orderResult = await createOrder(items, shipping, orderTotal, shippingFee ?? 0)
      if ('error' in orderResult) {
        setError(orderResult.error ?? 'Could not create order.')
        return
      }

      const customerName = `${form.firstName} ${form.lastName}`
      const payResult = await initializePayment(orderResult.orderId, shipping.email, orderTotal, customerName, shipping.phone)
      if ('error' in payResult) {
        setError(payResult.error ?? 'Could not initialize payment.')
        return
      }

      window.location.href = payResult.paymentLink
    })
  }

  useEffect(() => {
    if (items.length === 0) router.replace('/cart')
  }, [items.length, router])

  if (items.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* Shipping form */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Shipping information</h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">First name</label>
                  <input type="text" placeholder="John" value={form.firstName} onChange={e => update('firstName', e.target.value)} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Last name</label>
                  <input type="text" placeholder="Doe" value={form.lastName} onChange={e => update('lastName', e.target.value)} className={inputCls} required />
                </div>
                {/* Email */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email address</label>
                  <input type="email" placeholder="john@example.com" value={form.email} onChange={e => update('email', e.target.value)} className={inputCls} required />
                </div>
                {/* Phone */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Phone number</label>
                  <input type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputCls} required />
                </div>
                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Street address</label>
                  <input type="text" placeholder="12 Faith Avenue" value={form.address} onChange={e => update('address', e.target.value)} className={inputCls} required />
                </div>

                {/* State dropdown */}
                <div className={areasForState.length > 0 ? '' : 'col-span-2'}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">State</label>
                  {states.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedState}
                        onChange={e => setSelectedState(e.target.value)}
                        className={selectCls}
                        required
                      >
                        <option value="">Select state…</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  ) : (
                    <input type="text" placeholder="e.g. Lagos" value={selectedState} onChange={e => setSelectedState(e.target.value)} className={inputCls} required />
                  )}
                </div>

                {/* Area dropdown — only shown when state has area-level zones */}
                {areasForState.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Delivery area</label>
                    <div className="relative">
                      <select
                        value={selectedArea}
                        onChange={e => setSelectedArea(e.target.value)}
                        className={selectCls}
                        required
                      >
                        <option value="">Select area…</option>
                        {areasForState.map(z => (
                          <option key={z.id} value={z.area!}>{z.area}</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="w-full lg:w-80 shrink-0 space-y-4 sticky top-24">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Order summary</h2>

              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={`${item.productId}-${item.selectedVariant?.value ?? ''}`} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                      {item.thumbnail && (
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain p-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                      {item.selectedVariant && (
                        <p className="text-[10px] text-gray-400">{item.selectedVariant.groupName}: {item.selectedVariant.value}</p>
                      )}
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
                  <span className="font-medium text-gray-900 dark:text-white">₦{total.toLocaleString('en')}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  {shippingFee !== null ? (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {shippingFee === 0 ? 'Free' : `₦${shippingFee.toLocaleString('en')}`}
                    </span>
                  ) : (
                    <span className="italic text-gray-400 text-xs">Select location</span>
                  )}
                </div>
                <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span className="text-[#4A0F1C] dark:text-[#E8C4CB] text-base">₦{orderTotal.toLocaleString('en')}</span>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 mb-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? 'Redirecting to payment…' : 'Proceed to payment'}
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
