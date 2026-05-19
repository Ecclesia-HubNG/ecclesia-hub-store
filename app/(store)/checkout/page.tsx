'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { createOrder } from '@/lib/actions/customer-orders'
import { initializePayment } from '@/lib/actions/paystack'

type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'city' | 'state'

const FIELDS: { key: Field; label: string; placeholder: string; type?: string; half?: boolean }[] = [
  { key: 'firstName', label: 'First name', placeholder: 'John', half: true },
  { key: 'lastName', label: 'Last name', placeholder: 'Doe', half: true },
  { key: 'email', label: 'Email address', placeholder: 'john@example.com', type: 'email' },
  { key: 'phone', label: 'Phone number', placeholder: '+234 800 000 0000', type: 'tel' },
  { key: 'address', label: 'Street address', placeholder: '12 Faith Avenue' },
  { key: 'city', label: 'City', placeholder: 'Lagos', half: true },
  { key: 'state', label: 'State', placeholder: 'Lagos', half: true },
]

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

export default function CheckoutPage() {
  const { items, total, count } = useCart()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Record<Field, string>>({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '',
  })

  const update = (k: Field, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const required = FIELDS.map(f => f.key)
    const missing = required.find(k => !form[k].trim())
    if (missing) { setError('Please fill in all fields.'); return }

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

      const orderResult = await createOrder(items, shipping, total)
      if ('error' in orderResult) {
        setError(orderResult.error ?? 'Could not create order.')
        return
      }

      const payResult = await initializePayment(orderResult.orderId, shipping.email, total)
      if ('error' in payResult) {
        setError(payResult.error ?? 'Could not initialize payment.')
        return
      }

      // Hard redirect — Paystack is an external page
      window.location.href = payResult.authorizationUrl
    })
  }

  if (items.length === 0) {
    router.replace('/cart')
    return null
  }

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
                {FIELDS.map(f => (
                  <div key={f.key} className={f.half ? '' : 'col-span-2'}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      {f.label}
                    </label>
                    <input
                      type={f.type ?? 'text'}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => update(f.key, e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="w-full lg:w-80 shrink-0 space-y-4 sticky top-24">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Order summary
              </h2>

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
                  <span className="italic text-gray-400">TBD</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span className="text-[#4A0F1C] dark:text-[#E8C4CB] text-base">₦{total.toLocaleString('en')}</span>
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
