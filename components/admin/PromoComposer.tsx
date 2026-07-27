'use client'

import { useState, useTransition, useRef } from 'react'
import { uploadEmailAsset } from '@/lib/actions/upload'

type Product = { id: string; name: string; price: number; thumbnail?: string; slug: string; compare_at_price?: number }

// ── Live preview ──────────────────────────────────────────────────────────────
function PromoPreview({
  headline, subheadline, bannerText, bannerImage, products: selected,
}: {
  headline: string
  subheadline: string
  bannerText: string
  bannerImage: string
  products: Product[]
}) {
  const brand = '#4A0F1C'
  const brandLight = '#6B1A2A'

  return (
    <div style={{ backgroundColor: '#f0f0f0', padding: '20px 12px', fontFamily: 'Arial, sans-serif', borderRadius: 12 }}>
      {/* Header */}
      <div style={{ backgroundColor: brand, borderRadius: '10px 10px 0 0', padding: '18px 28px', textAlign: 'center' }}>
        <p style={{ color: '#fff', fontSize: 18, margin: 0, fontWeight: 700 }}>Ecclesia Hub</p>
      </div>

      {/* Banner */}
      <div style={{ background: `linear-gradient(135deg, ${brandLight}, #9B3A50)`, padding: bannerImage ? '24px 28px 0' : '24px 28px', textAlign: 'center' }}>
        {bannerText && (
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 6px' }}>
            {bannerText}
          </p>
        )}
        <p style={{ color: '#fff', fontSize: 20, margin: '0 0 6px', fontWeight: 800, lineHeight: 1.3 }}>
          {headline || <span style={{ opacity: 0.5 }}>Your headline…</span>}
        </p>
        {subheadline && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: bannerImage ? '0 0 16px' : '0' }}>{subheadline}</p>
        )}
        {bannerImage && (
          <img src={bannerImage} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} alt="" />
        )}
      </div>

      {/* Products */}
      <div style={{ backgroundColor: '#fff', padding: '20px 16px' }}>
        <p style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px', textAlign: 'center' }}>Featured Products</p>
        {selected.length > 0 ? (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {selected.map(p => (
              <div key={p.id} style={{ flex: 1, textAlign: 'center', maxWidth: 140 }}>
                {p.thumbnail
                  ? <img src={p.thumbnail} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, display: 'block' }} alt={p.name} />
                  : <div style={{ width: '100%', height: 90, borderRadius: 8, backgroundColor: '#fdf2f4' }} />
                }
                <p style={{ fontSize: 11, fontWeight: 700, color: '#111', margin: '8px 0 3px', lineHeight: 1.3 }}>{p.name}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: brand, margin: 0 }}>₦{p.price.toLocaleString('en')}</p>
                {p.compare_at_price && (
                  <p style={{ fontSize: 10, color: '#bbb', textDecoration: 'line-through', margin: '1px 0 0' }}>₦{p.compare_at_price.toLocaleString('en')}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: '#ccc', fontSize: 12, margin: 0 }}>Select products from the form →</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ backgroundColor: '#fff', padding: '4px 28px 24px', borderRadius: '0 0 10px 10px', textAlign: 'center' }}>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0 0 16px' }} />
        <span style={{ backgroundColor: brand, color: '#fff', borderRadius: 7, padding: '10px 28px', fontSize: 13, fontWeight: 600, display: 'inline-block' }}>
          Shop All Deals →
        </span>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '14px 0 0' }}>
        <p style={{ color: '#aaa', fontSize: 10, margin: '0 0 2px', fontFamily: 'Arial, sans-serif' }}>Ecclesia Hub · Lagos, Nigeria</p>
        <p style={{ color: '#aaa', fontSize: 10, margin: 0, fontFamily: 'Arial, sans-serif' }}>Unsubscribe · Contact us</p>
      </div>
    </div>
  )
}

// ── Main composer ─────────────────────────────────────────────────────────────
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
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadEmailAsset(fd)
      if (res.error) throw new Error(res.error)
      setBannerImage(res.url!)
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function sendPromo() {
    if (!promoSubject.trim()) { setResult({ error: 'Subject line is required.' }); return }
    if (selectedProducts.length === 0) { setResult({ error: 'Select at least one product to feature.' }); return }
    setResult(null)
    const chosenProducts = products.filter(p => selectedProducts.includes(p.id)).map(p => ({
      name: p.name,
      price: p.price,
      comparePrice: p.compare_at_price,
      thumbnail: p.thumbnail,
      slug: p.slug,
    }))
    startTransition(async () => {
      try {
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
        const data = await res.json().catch(() => ({ error: `Server returned an unexpected response (status ${res.status}).` }))
        setResult(data)
        if (data.success) { setPromoSubject(''); setPromoHeadline(''); setSelectedProducts([]); setBannerImage('') }
      } catch (err: any) {
        setResult({ error: err?.message || 'Network error — could not reach the server.' })
      }
    })
  }

  const recipientCount = sendTo === 'subscribers' ? totalSubscribers : sendTo === 'users' ? totalUsers : totalCustomers
  const recipientLabel = sendTo === 'subscribers' ? 'subscriber' : sendTo === 'users' ? 'user' : 'customer'

  const visibleProducts = productSearch.trim()
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products

  const selectedProductObjects = products.filter(p => selectedProducts.includes(p.id))

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Promo Blast</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Compose and preview your promotional email before sending</p>
      </div>

      {result && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${result.error ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'}`}>
          {result.error ? `Error: ${result.error}` : `✓ Sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}${result.failed ? ` (${result.failed} failed)` : ''}`}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ── Left: form ── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
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
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Banner image <span className="text-gray-400 font-normal">(optional)</span></label>
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
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  {uploading ? 'Uploading…' : 'Upload banner image'}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          {/* Product picker */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Products <span className="font-normal normal-case">(pick up to 3)</span></p>
              {selectedProducts.length > 0 && (
                <span className="text-[11px] font-semibold text-[#4A0F1C] dark:text-[#D4849A]">{selectedProducts.length}/3 selected</span>
              )}
            </div>
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
            <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 280 }}>
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
                      ? <img src={p.thumbnail} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                      : <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">₦{p.price.toLocaleString('en')}</p>
                    </div>
                  </button>
                )
              })}
              {visibleProducts.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">
                  {productSearch ? `No products match "${productSearch}"` : 'No products found.'}
                </p>
              )}
            </div>
          </div>

          {/* Send to + action */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">Send to</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                ['customers',   'All Customers',  totalCustomers],
                ['subscribers', 'Subscribers',    totalSubscribers],
                ['users',       'Staff Users',    totalUsers],
              ] as const).map(([val, label, count]) => (
                <label key={val} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer transition-colors ${sendTo === val ? 'border-[#4A0F1C]/40 bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <input type="radio" name="promoSendTo" value={val} checked={sendTo === val} onChange={() => setSendTo(val)} className="sr-only" />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${sendTo === val ? 'border-[#4A0F1C]' : 'border-gray-300 dark:border-gray-600'}`}>
                    {sendTo === val && <span className="w-1.5 h-1.5 rounded-full bg-[#4A0F1C]" />}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="text-xs text-gray-400">({count})</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} · <strong className="text-gray-600 dark:text-gray-300">{recipientCount} {recipientLabel}{recipientCount !== 1 ? 's' : ''}</strong>
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

        {/* ── Right: preview ── */}
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email Preview</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">— what recipients will see</span>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="ml-2 text-xs text-gray-400 font-mono truncate">Promo · {promoSubject || 'No subject'}</span>
            </div>
            <div className="overflow-y-auto max-h-[700px]">
              <PromoPreview
                headline={promoHeadline || promoSubject}
                subheadline={promoSubheadline}
                bannerText={promoBanner || '🎉 SPECIAL OFFER'}
                bannerImage={bannerImage}
                products={selectedProductObjects}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
