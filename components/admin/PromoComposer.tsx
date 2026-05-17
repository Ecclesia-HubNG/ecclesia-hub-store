'use client'

import { useState, useTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Product = { id: string; name: string; price: number; thumbnail?: string; slug: string; compare_at_price?: number }

export default function PromoComposer({
  products,
  totalCustomers,
  totalSubscribers,
  totalUsers,
}: {
  products: Product[]
  totalCustomers: number
  totalSubscribers: number
  totalUsers: number
}) {
  const [promoSubject, setPromoSubject] = useState('')
  const [promoHeadline, setPromoHeadline] = useState('')
  const [promoSubheadline, setPromoSubheadline] = useState('')
  const [promoBanner, setPromoBanner] = useState('')
  const [bannerImage, setBannerImage] = useState('')
  const [promoCta, setPromoCta] = useState('Shop All Deals')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [sendTo, setSendTo] = useState<'customers' | 'subscribers' | 'users'>('customers')
  const [result, setResult] = useState<{ sent?: number; failed?: number; error?: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleProduct(id: string) {
    setSelectedProducts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `promo/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('email-assets').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('email-assets').getPublicUrl(data.path)
      setBannerImage(publicUrl)
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function sendPromo() {
    if (!promoSubject.trim() || selectedProducts.length === 0) return
    setResult(null)
    const chosenProducts = products.filter(p => selectedProducts.includes(p.id)).map(p => ({
      name: p.name,
      price: p.price,
      comparePrice: p.compare_at_price,
      thumbnail: p.thumbnail,
      slug: p.slug,
    }))
    startTransition(async () => {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'promo',
          sendTo,
          props: {
            subject: promoSubject,
            headline: promoHeadline || promoSubject,
            subheadline: promoSubheadline || undefined,
            bannerText: promoBanner || '🎉 SPECIAL OFFER',
            bannerImage: bannerImage || undefined,
            products: chosenProducts,
            ctaText: promoCta,
            ctaUrl: 'https://ecclesiahub.store/shop',
          },
        }),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) { setPromoSubject(''); setPromoHeadline(''); setSelectedProducts([]); setBannerImage('') }
    })
  }

  const recipientCount = sendTo === 'subscribers' ? totalSubscribers : sendTo === 'users' ? totalUsers : totalCustomers
  const recipientLabel = sendTo === 'subscribers' ? 'subscriber' : sendTo === 'users' ? 'user' : 'customer'

  const visibleProducts = productSearch.trim()
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products
  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Promo Blast</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Send a promotional email with featured products</p>
      </div>

      {result && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${result.error ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'}`}>
          {result.error ? `Error: ${result.error}` : `✓ Sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}${result.failed ? ` (${result.failed} failed)` : ''}`}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 max-w-5xl">
        {/* Left — fields */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Subject line <span className="text-red-400">*</span></label>
              <input type="text" value={promoSubject} onChange={e => setPromoSubject(e.target.value)} placeholder="e.g. 🎉 Up to 30% off this week only" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email headline</label>
              <input type="text" value={promoHeadline} onChange={e => setPromoHeadline(e.target.value)} placeholder="Defaults to subject line" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sub-headline</label>
              <input type="text" value={promoSubheadline} onChange={e => setPromoSubheadline(e.target.value)} placeholder="e.g. Limited time — ends Sunday at midnight." className={inputCls} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Banner tag</label>
                <input type="text" value={promoBanner} onChange={e => setPromoBanner(e.target.value)} placeholder="🎉 SPECIAL OFFER" className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">CTA button text</label>
                <input type="text" value={promoCta} onChange={e => setPromoCta(e.target.value)} placeholder="Shop All Deals" className={inputCls} />
              </div>
            </div>

            {/* Banner image */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Banner image (optional)</label>
              {bannerImage ? (
                <div className="relative">
                  <img src={bannerImage} alt="" className="w-full h-28 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                  <button
                    type="button"
                    onClick={() => setBannerImage('')}
                    className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 hover:border-[#4A0F1C]/40 hover:text-[#4A0F1C] dark:hover:text-[#D4849A] transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  {uploading ? 'Uploading…' : 'Upload banner image'}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Send to */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Send to</label>
              <div className="flex flex-wrap gap-2">
                {([
                  ['customers',   `All Customers`,  totalCustomers],
                  ['subscribers', `Subscribers`,     totalSubscribers],
                  ['users',       `Staff Users`,     totalUsers],
                ] as const).map(([val, label, count]) => (
                  <label key={val} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border cursor-pointer transition-colors ${sendTo === val ? 'border-[#4A0F1C]/40 bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <input type="radio" name="promoSendTo" value={val} checked={sendTo === val} onChange={() => setSendTo(val)} className="sr-only" />
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${sendTo === val ? 'border-[#4A0F1C]' : 'border-gray-300 dark:border-gray-600'}`}>
                      {sendTo === val && <span className="w-1.5 h-1.5 rounded-full bg-[#4A0F1C]" />}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="text-xs text-gray-400 tabular-nums">({count})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected · to <strong className="text-gray-600 dark:text-gray-300">{recipientCount} {recipientLabel}{recipientCount !== 1 ? 's' : ''}</strong>
              </p>
              <button
                type="button"
                onClick={sendPromo}
                disabled={pending || !promoSubject.trim() || selectedProducts.length === 0}
                className="px-5 py-2.5 text-sm font-semibold bg-[#4A0F1C] hover:bg-[#3A0B15] text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {pending ? 'Sending…' : 'Send Promo →'}
              </button>
            </div>
          </div>
        </div>

        {/* Right — product picker */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Products (up to 3)</p>
            {selectedProducts.length > 0 && (
              <span className="text-[11px] font-semibold text-[#4A0F1C] dark:text-[#D4849A]">{selectedProducts.length}/3 selected</span>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
            />
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1" style={{ maxHeight: 460 }}>
            {visibleProducts.map(p => {
              const selected = selectedProducts.includes(p.id)
              const disabled = !selected && selectedProducts.length >= 3
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !disabled && toggleProduct(p.id)}
                  disabled={disabled}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-colors border ${selected ? 'border-[#4A0F1C]/30 bg-[#4A0F1C]/5' : disabled ? 'opacity-40 border-transparent cursor-not-allowed' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${selected ? 'bg-[#4A0F1C] border-[#4A0F1C]' : 'border-gray-300 dark:border-gray-600'}`}>
                    {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                  </div>
                  {p.thumbnail
                    ? <img src={p.thumbnail} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                    : <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">₦{p.price.toLocaleString('en')}</p>
                  </div>
                </button>
              )
            })}
            {visibleProducts.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">
                {productSearch ? `No products match "${productSearch}"` : 'No products found.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
