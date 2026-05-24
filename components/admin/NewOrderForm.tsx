'use client'

import { useState, useMemo } from 'react'
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function NewOrderForm({ products }: { products: Product[] }) {
  const router = useRouter()

  const [items, setItems] = useState<LineItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDrop, setShowProductDrop] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [orderState, setOrderState] = useState('')

  const [channel, setChannel] = useState('store')
  const [status, setStatus] = useState('paid')
  const [payRef, setPayRef] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 20)
    const q = productSearch.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 20)
  }, [products, productSearch])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountAmt = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmt)

  function addProduct(p: Product) {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === p.id)
      if (existing) return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product_id: p.id, name: p.name, price: p.price, quantity: 1, thumbnail: p.thumbnail }]
    })
    setProductSearch('')
    setShowProductDrop(false)
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) setItems(prev => prev.filter(i => i.product_id !== id))
    else setItems(prev => prev.map(i => i.product_id === id ? { ...i, quantity: qty } : i))
  }

  function updatePrice(id: string, price: number) {
    setItems(prev => prev.map(i => i.product_id === id ? { ...i, price } : i))
  }

  function updateName(id: string, name: string) {
    setItems(prev => prev.map(i => i.product_id === id ? { ...i, name } : i))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.product_id !== id))
  }

  function addCustomItem() {
    setItems(prev => [...prev, {
      product_id: `custom_${Date.now()}`,
      name: 'Custom item',
      price: 0,
      quantity: 1,
      thumbnail: null,
    }])
  }

  async function handleSubmit() {
    setError('')
    if (items.length === 0) { setError('Add at least one item.'); return }
    if (!name.trim()) { setError('Customer name is required.'); return }
    setSaving(true)
    const result = await createManualOrder({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      address,
      city,
      state: orderState,
      items,
      total,
      status,
      order_channel: channel,
      payment_reference: payRef,
      admin_notes: notes,
    })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    router.push(result.id ? `/admin/orders/${result.id}` : '/admin/orders')
  }

  return (
    <div className="space-y-5">

      {/* Items */}
      <SectionCard title="Items">
        <div className="space-y-3">
          {/* Product search */}
          <div className="relative">
            {showProductDrop && <div className="fixed inset-0 z-10" onClick={() => setShowProductDrop(false)} />}
            <input
              type="text"
              placeholder="Search products to add…"
              value={productSearch}
              onChange={e => { setProductSearch(e.target.value); setShowProductDrop(true) }}
              onFocus={() => setShowProductDrop(true)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
            {showProductDrop && filteredProducts.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                    {p.thumbnail
                      ? <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      : <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0" />}
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
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.product_id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                  {item.thumbnail
                    ? <img src={item.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    : <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />}
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateName(item.product_id, e.target.value)}
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
                    <button type="button" onClick={() => updateQty(item.product_id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-100 transition-colors">−</button>
                    <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                    <button type="button" onClick={() => updateQty(item.product_id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-100 transition-colors">+</button>
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

          <button type="button" onClick={addCustomItem}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add custom item
          </button>

          {items.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Discount (₦)</span>
                <input type="number" min={0} placeholder="0" value={discount} onChange={e => setDiscount(e.target.value)}
                  className="w-28 text-right text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none" />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800 font-semibold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-gray-900 dark:text-white">{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Customer */}
      <SectionCard title="Customer">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Lagos"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">State</label>
              <input type="text" value={orderState} onChange={e => setOrderState(e.target.value)} placeholder="e.g. Lagos State"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Channel & Status */}
      <SectionCard title="Order details">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Order channel</label>
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map(c => (
                <button key={c.value} type="button" onClick={() => setChannel(c.value)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${channel === c.value ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                  <span className="text-lg leading-none">{c.icon}</span>
                  <span className="text-xs">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Order status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${status === s ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Payment reference <span className="font-normal">(optional)</span></label>
            <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transfer ref, POS receipt no., etc."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Admin notes <span className="font-normal">(optional)</span></label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this order…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none" />
          </div>
        </div>
      </SectionCard>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 pb-8">
        <button type="button" onClick={() => router.push('/admin/orders')}
          className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50">
          {saving ? 'Creating order…' : 'Create order'}
        </button>
      </div>
    </div>
  )
}
