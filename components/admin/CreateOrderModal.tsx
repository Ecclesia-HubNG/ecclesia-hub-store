'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createManualOrder } from '@/lib/actions/orders'

type Product = {
  id: string
  name: string
  price: number
  thumbnail: string | null
  stock: number
}

type LineItem = {
  product_id: string
  name: string
  price: number
  quantity: number
  thumbnail: string | null
}

const CHANNELS = [
  { value: 'store',     label: 'Store',     icon: '🛍️' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'tiktok',   label: 'TikTok',    icon: '🎵' },
  { value: 'facebook',  label: 'Facebook',  icon: '📘' },
  { value: 'whatsapp',  label: 'WhatsApp',  icon: '💬' },
  { value: 'referral',  label: 'Referral',  icon: '🔗' },
  { value: 'manual',    label: 'Manual',    icon: '✍️' },
]

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered']

function fmt(n: number) {
  return '₦' + n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CreateOrderModal({
  products,
  onClose,
}: {
  products: Product[]
  onClose: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<'items' | 'customer' | 'details'>('items')

  // Items
  const [items, setItems] = useState<LineItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDrop, setShowProductDrop] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Customer
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  // Details
  const [channel, setChannel] = useState('store')
  const [status, setStatus] = useState('paid')
  const [payRef, setPayRef] = useState('')
  const [notes, setNotes] = useState('')
  const [customDiscount, setCustomDiscount] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 20)
    const q = productSearch.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 20)
  }, [products, productSearch])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountAmount = parseFloat(customDiscount) || 0
  const total = Math.max(0, subtotal - discountAmount)

  function addProduct(p: Product) {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === p.id)
      if (existing) {
        return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product_id: p.id, name: p.name, price: p.price, quantity: 1, thumbnail: p.thumbnail }]
    })
    setProductSearch('')
    setShowProductDrop(false)
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) {
      setItems(prev => prev.filter(i => i.product_id !== id))
    } else {
      setItems(prev => prev.map(i => i.product_id === id ? { ...i, quantity: qty } : i))
    }
  }

  function updatePrice(id: string, price: number) {
    setItems(prev => prev.map(i => i.product_id === id ? { ...i, price } : i))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.product_id !== id))
  }

  function addCustomItem() {
    const placeholder: LineItem = {
      product_id: `custom_${Date.now()}`,
      name: 'Custom item',
      price: 0,
      quantity: 1,
      thumbnail: null,
    }
    setItems(prev => [...prev, placeholder])
  }

  function updateItemName(id: string, name: string) {
    setItems(prev => prev.map(i => i.product_id === id ? { ...i, name } : i))
  }

  async function handleSubmit() {
    if (items.length === 0) { setError('Add at least one item'); setStep('items'); return }
    if (!name.trim()) { setError('Customer name is required'); setStep('customer'); return }
    setSaving(true)
    setError('')
    const result = await createManualOrder({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      address,
      city,
      state,
      items,
      total,
      status,
      order_channel: channel,
      payment_reference: payRef,
      admin_notes: notes,
    })
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
    if (result.id) router.push(`/admin/orders/${result.id}`)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">New manual order</h2>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Enter an offline or social media order</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          {(['items', 'customer', 'details'] as const).map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${step === s ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-white/20 dark:bg-gray-900/20' : 'bg-gray-200 dark:bg-gray-700'}`}>{i + 1}</span>
              <span className="capitalize">{s}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Step 1: Items ── */}
          {step === 'items' && (
            <div className="space-y-4">
              {/* Product search */}
              <div className="relative" ref={undefined}>
                {showProductDrop && <div className="fixed inset-0 z-10" onClick={() => setShowProductDrop(false)} />}
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Search products</label>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Type product name…"
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductDrop(true) }}
                  onFocus={() => setShowProductDrop(true)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                />
                {showProductDrop && filteredProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{fmt(p.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Line items */}
              {items.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl py-10 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-600">No items yet — search above or add a custom item</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
                      )}
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItemName(item.product_id, e.target.value)}
                        className="flex-1 min-w-0 text-sm font-medium bg-transparent text-gray-900 dark:text-white border-none outline-none"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-gray-400">₦</span>
                        <input
                          type="number"
                          value={item.price}
                          min={0}
                          onChange={e => updatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                          className="w-24 text-xs text-right bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-gray-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">−</button>
                        <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                        <button type="button" onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">+</button>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-20 text-right shrink-0">{fmt(item.price * item.quantity)}</span>
                      <button type="button" onClick={() => removeItem(item.product_id)} className="text-gray-300 dark:text-gray-700 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={addCustomItem} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add custom item
              </button>

              {/* Totals */}
              {items.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Discount (₦)</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={customDiscount}
                      onChange={e => setCustomDiscount(e.target.value)}
                      className="w-28 text-right text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-base font-bold text-gray-900 dark:text-white">{fmt(total)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Customer ── */}
          {step === 'customer' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Full name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amaka Okonkwo"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. amaka@mail.com"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Phone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0801 234 5678"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Delivery address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Lagos"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Lagos State"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Details ── */}
          {step === 'details' && (
            <div className="space-y-5">
              {/* Channel */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Order channel</label>
                <div className="grid grid-cols-4 gap-2">
                  {CHANNELS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChannel(c.value)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${channel === c.value ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}
                    >
                      <span className="text-lg leading-none">{c.icon}</span>
                      <span className="text-xs">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Order status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${status === s ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment reference */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Payment reference <span className="font-normal">(optional)</span></label>
                <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transfer ref, POS receipt no., etc."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
              </div>

              {/* Admin notes */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Admin notes <span className="font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any notes about this order…"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Items</span>
                  <span className="text-gray-900 dark:text-white font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Customer</span>
                  <span className="text-gray-900 dark:text-white font-medium">{name || <span className="text-gray-400">—</span>}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Channel</span>
                  <span className="text-gray-900 dark:text-white font-medium capitalize">{CHANNELS.find(c => c.value === channel)?.icon} {channel}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {step !== 'items' && (
              <button
                type="button"
                onClick={() => setStep(step === 'customer' ? 'items' : 'customer')}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
            )}
            {step === 'details' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create order'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step === 'items' ? 'customer' : 'details')}
                className="px-5 py-2 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
