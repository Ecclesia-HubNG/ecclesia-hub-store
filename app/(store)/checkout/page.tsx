'use client'

export const dynamic = 'force-dynamic'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { createCheckoutSession, createBankTransferOrder } from '@/lib/actions/customer-orders'
import { initializePayment as initFlutterwave } from '@/lib/actions/flutterwave'
import { getActiveShippingTree, type ShippingState, type ShippingBranch, type ShippingLocation } from '@/lib/actions/shipping'

type PaymentMethod = 'flutterwave' | 'bank_transfer'

type BankConfirm = {
  orderId: string
  orderNumber: string
  total: number
  bankDetails: { bankName: string; accountNumber: string; accountName: string }
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

export default function CheckoutPage() {
  const { items, total: subtotal, count, clearCart, coupon } = useCart()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [bankConfirm, setBankConfirm] = useState<BankConfirm | null>(null)

  // Shipping tree
  const [shippingStates, setShippingStates] = useState<ShippingState[]>([])
  const [selectedStateId, setSelectedStateId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '',
  })
  const update = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    getActiveShippingTree().then(s => setShippingStates(s))
  }, [])

  useEffect(() => { if (items.length === 0 && !bankConfirm) router.replace('/cart') }, [items.length, router, bankConfirm])

  // Derived shipping state
  const selectedState = useMemo(() => shippingStates.find(s => s.id === selectedStateId) ?? null, [shippingStates, selectedStateId])
  const branchesForState = useMemo(() => selectedState?.branches ?? [], [selectedState])
  const selectedBranch = useMemo(() => branchesForState.find(b => b.id === selectedBranchId) ?? null, [branchesForState, selectedBranchId])
  const locationsForBranch = useMemo(() => selectedBranch?.locations ?? [], [selectedBranch])
  const selectedLocation = useMemo(() => locationsForBranch.find(l => l.id === selectedLocationId) ?? null, [locationsForBranch, selectedLocationId])
  const shippingFee = selectedLocation?.price ?? null
  const discountAmount = coupon?.discountAmount ?? 0
  const orderTotal = Math.max(0, subtotal - discountAmount) + (shippingFee ?? 0)

  function calcProcessingFee(amount: number) {
    return Math.min(Math.round(amount * 0.014), 2000)
  }
  const processingFee = paymentMethod === 'flutterwave' && shippingFee !== null
    ? calcProcessingFee(orderTotal)
    : 0
  const grandTotal = orderTotal + processingFee

  const deliveryLabel = selectedState && selectedBranch && selectedLocation
    ? `${selectedState.name} · ${selectedBranch.name} · ${selectedLocation.name}`
    : ''

  // Reset branch + location when state changes
  useEffect(() => {
    setSelectedBranchId('')
    setSelectedLocationId('')
    update('state', selectedState?.name ?? '')
  }, [selectedStateId])

  // Reset location when branch changes
  useEffect(() => {
    setSelectedLocationId('')
  }, [selectedBranchId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedLocation) { setError('Please select your delivery location.'); return }
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address || !form.city || !form.state) {
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
        city: form.city,
        state: form.state,
      }

      const sessionResult = await createCheckoutSession(
        items,
        shipping,
        subtotal,
        shippingFee ?? 0,
        grandTotal,
        null,           // delivery_rate_id — unused in new shipping system
        deliveryLabel,
        coupon?.code ?? null,
        discountAmount,
      )

      if ('error' in sessionResult) {
        setError(sessionResult.error)
        return
      }

      const customerName = `${form.firstName} ${form.lastName}`
      const sid = sessionResult.sessionId

      if (paymentMethod === 'flutterwave') {
        const payResult = await initFlutterwave(sid, form.email, grandTotal, customerName, form.phone)
        if ('error' in payResult) { setError(payResult.error ?? 'Could not initialize payment.'); return }
        window.location.href = payResult.paymentLink

      } else {
        const bankResult = await createBankTransferOrder(sid)
        if ('error' in bankResult) { setError(bankResult.error); return }
        clearCart()
        setBankConfirm({ orderId: bankResult.orderId, orderNumber: bankResult.orderNumber, total: orderTotal, bankDetails: bankResult.bankDetails })
      }
    })
  }

  if (items.length === 0 && !bankConfirm) return null

  // Bank transfer confirmation screen
  if (bankConfirm) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Order Placed!</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Order <span className="font-semibold text-gray-900 dark:text-white">#{bankConfirm.orderNumber}</span> is awaiting your transfer.
        </p>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-left space-y-3 mb-6">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Bank Transfer Instructions</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Please transfer <strong>₦{bankConfirm.total.toLocaleString('en')}</strong> to the account below and use your order number as reference.
          </p>
          <div className="space-y-1.5 text-sm">
            {[
              ['Bank', bankConfirm.bankDetails.bankName],
              ['Account Number', bankConfirm.bankDetails.accountNumber],
              ['Account Name', bankConfirm.bankDetails.accountName],
              ['Reference', bankConfirm.orderNumber],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-amber-600 dark:text-amber-500 shrink-0">{label}</span>
                <span className="font-semibold text-amber-900 dark:text-amber-200 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          Your order will be confirmed and dispatched once we verify your transfer. We typically process within 1–2 business hours.
        </p>

        <button
          type="button"
          onClick={() => router.push(`/orders/${bankConfirm.orderId}`)}
          className="w-full py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] transition-colors"
        >
          View Order →
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── 1. Billing details ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Billing details</h2>

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
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">City / LGA</label>
                  <input type="text" placeholder="e.g. Ikeja, Wuse, Kafanchan" value={form.city} onChange={e => update('city', e.target.value)} className={inputCls} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Street address</label>
                  <input type="text" placeholder="12 Faith Avenue" value={form.address} onChange={e => update('address', e.target.value)} className={inputCls} required />
                </div>
              </div>
            </div>

            {/* ── 2. Shipping ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Shipping</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Select your state, area, and delivery location.</p>

              {shippingStates.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">No delivery options available yet. Please contact us to arrange delivery.</p>
              ) : (
                <div className="space-y-4">

                  {/* State · Area · Location — horizontal on md+ */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* State */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">State</label>
                      <select
                        value={selectedStateId}
                        onChange={e => setSelectedStateId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select state</option>
                        {shippingStates.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Branch */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Area</label>
                      <select
                        value={selectedBranchId}
                        onChange={e => setSelectedBranchId(e.target.value)}
                        disabled={!selectedStateId || branchesForState.length === 0}
                        className={inputCls}
                      >
                        <option value="">Select area</option>
                        {branchesForState.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
                      <select
                        value={selectedLocationId}
                        onChange={e => setSelectedLocationId(e.target.value)}
                        disabled={!selectedBranchId || locationsForBranch.length === 0}
                        className={inputCls}
                      >
                        <option value="">Select location</option>
                        {locationsForBranch.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.name} — {l.price === 0 ? 'Free' : `₦${l.price.toLocaleString('en')}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fee callout */}
                  {selectedLocation && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20 border border-[#4A0F1C]/15 dark:border-[#4A0F1C]/30 rounded-xl">
                      <svg className="w-4 h-4 text-[#4A0F1C] dark:text-[#E8C4CB] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#4A0F1C] dark:text-[#E8C4CB] truncate">{deliveryLabel}</p>
                      </div>
                      <span className="text-sm font-bold text-[#4A0F1C] dark:text-[#E8C4CB] shrink-0">
                        {shippingFee === 0 ? 'Free' : `₦${(shippingFee ?? 0).toLocaleString('en')}`}
                      </span>
                    </div>
                  )}

                </div>
              )}
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
                {coupon && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                      {coupon.code}
                    </span>
                    <span className="font-medium">−₦{discountAmount.toLocaleString('en')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  {shippingFee !== null ? (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {shippingFee === 0 ? 'Free' : `₦${shippingFee.toLocaleString('en')}`}
                    </span>
                  ) : (
                    <span className="italic text-gray-400 text-xs">Select delivery above</span>
                  )}
                </div>
                {processingFee > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      Payment processing fee
                      <span className="text-[10px] text-gray-400">(1.4%)</span>
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{processingFee.toLocaleString('en')}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span className="text-[#4A0F1C] dark:text-[#E8C4CB] text-base">₦{grandTotal.toLocaleString('en')}</span>
                </div>
              </div>

              {/* Payment method selection */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment method</p>
                <div className="space-y-2">
                  {([
                    { id: 'bank_transfer' as PaymentMethod, label: 'Bank Transfer', desc: 'Transfer directly to our UBA account' },
                    { id: 'flutterwave' as PaymentMethod, label: 'Flutterwave', desc: 'Card, bank, mobile money · 1.4% processing fee applies' },
                  ] as const).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        paymentMethod === m.id
                          ? 'border-[#4A0F1C] dark:border-[#E8C4CB] bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === m.id ? 'border-[#4A0F1C] dark:border-[#E8C4CB]' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {paymentMethod === m.id && <span className="w-2 h-2 rounded-full bg-[#4A0F1C] dark:bg-[#E8C4CB]" />}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{m.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={pending || !selectedLocation}
                className="w-full py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pending
                  ? paymentMethod === 'bank_transfer' ? 'Placing order…' : 'Redirecting to payment…'
                  : !selectedLocation
                  ? 'Select delivery location'
                  : paymentMethod === 'bank_transfer'
                  ? 'Place Order — Bank Transfer'
                  : 'Pay with Flutterwave'}
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
