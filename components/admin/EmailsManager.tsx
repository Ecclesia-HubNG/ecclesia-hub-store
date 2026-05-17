'use client'

import { useState, useTransition } from 'react'

type Log = {
  id: string
  type: string
  to_email: string
  subject: string
  status: 'sent' | 'failed'
  error: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type Product = { id: string; name: string; price: number; thumbnail?: string; slug: string; compare_at_price?: number }

const TYPE_LABEL: Record<string, string> = {
  order_confirmation: 'Order Confirmation',
  order_shipped:      'Order Shipped',
  welcome:            'Welcome',
  promo:              'Promo Blast',
  newsletter:         'Newsletter',
}

const TYPE_COLOR: Record<string, string> = {
  order_confirmation: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  order_shipped:      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  welcome:            'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  promo:              'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  newsletter:         'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400',
}

export default function EmailsManager({
  logs: initialLogs,
  products,
  totalCustomers,
}: {
  logs: Log[]
  products: Product[]
  totalCustomers: number
}) {
  const [tab, setTab] = useState<'newsletter' | 'promo' | 'logs'>('newsletter')
  const [logs, setLogs] = useState(initialLogs)
  const [result, setResult] = useState<{ sent?: number; failed?: number; error?: string } | null>(null)
  const [pending, startTransition] = useTransition()

  // Newsletter state
  const [nlSubject, setNlSubject] = useState('')
  const [nlBody, setNlBody] = useState('')
  const [nlIssue, setNlIssue] = useState('')

  // Promo state
  const [promoSubject, setPromoSubject] = useState('')
  const [promoHeadline, setPromoHeadline] = useState('')
  const [promoSubheadline, setPromoSubheadline] = useState('')
  const [promoBanner, setPromoBanner] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [promoCta, setPromoCta] = useState('Shop All Deals')

  function toggleProduct(id: string) {
    setSelectedProducts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  async function sendNewsletter() {
    if (!nlSubject.trim() || !nlBody.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter', subject: nlSubject, body: nlBody, issueNumber: nlIssue ? Number(nlIssue) : undefined }),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) { setNlSubject(''); setNlBody(''); setNlIssue('') }
    })
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
          props: {
            subject: promoSubject,
            headline: promoHeadline || promoSubject,
            subheadline: promoSubheadline || undefined,
            bannerText: promoBanner || '🎉 SPECIAL OFFER',
            products: chosenProducts,
            ctaText: promoCta,
            ctaUrl: 'https://ecclesiahub.store/shop',
          },
        }),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) { setPromoSubject(''); setPromoHeadline(''); setSelectedProducts([]) }
    })
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Emails</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{totalCustomers} customers in mailing list</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit gap-1">
        {([['newsletter', 'Newsletter'], ['promo', 'Promo Blast'], ['logs', 'Email Logs']] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setResult(null) }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === key ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${result.error ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'}`}>
          {result.error ? `Error: ${result.error}` : `✓ Sent to ${result.sent} customer${result.sent !== 1 ? 's' : ''}${result.failed ? ` (${result.failed} failed)` : ''}`}
        </div>
      )}

      {/* Newsletter composer */}
      {tab === 'newsletter' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-2xl">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Newsletter Composer</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Write your newsletter and send it to all {totalCustomers} customers.</p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Subject line <span className="text-red-400">*</span></label>
                <input type="text" value={nlSubject} onChange={e => setNlSubject(e.target.value)} placeholder="e.g. What's new at Ecclesia Hub this week" className={inputCls} />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Issue #</label>
                <input type="number" value={nlIssue} onChange={e => setNlIssue(e.target.value)} placeholder="12" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Body <span className="text-red-400">*</span></label>
              <textarea
                value={nlBody}
                onChange={e => setNlBody(e.target.value)}
                placeholder={'Write your newsletter content here.\n\nEach new paragraph will be separated in the email.\n\nTip: Keep it personal and concise.'}
                rows={12}
                className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
              />
              <p className="text-xs text-gray-400 mt-1.5">Each blank line creates a new paragraph in the email.</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400">Sending to <strong className="text-gray-600 dark:text-gray-300">{totalCustomers} customers</strong></p>
              <button
                type="button"
                onClick={sendNewsletter}
                disabled={pending || !nlSubject.trim() || !nlBody.trim()}
                className="px-5 py-2.5 text-sm font-semibold bg-[#4A0F1C] hover:bg-[#3A0B15] text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {pending ? 'Sending…' : `Send Newsletter →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo composer */}
      {tab === 'promo' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 max-w-5xl">
          {/* Left — fields */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Promo Blast Composer</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Pick products and craft a promotional email for all customers.</p>

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

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-400">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected · sending to <strong className="text-gray-600 dark:text-gray-300">{totalCustomers} customers</strong>
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Pick Products (up to 3)</p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {products.map(p => {
                const selected = selectedProducts.includes(p.id)
                const disabled = !selected && selectedProducts.length >= 3
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => !disabled && toggleProduct(p.id)}
                    disabled={disabled}
                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-colors border ${selected ? 'border-[#4A0F1C]/30 bg-[#4A0F1C]/5' : disabled ? 'opacity-40 border-transparent' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${selected ? 'bg-[#4A0F1C] border-[#4A0F1C]' : 'border-gray-300 dark:border-gray-600'}`}>
                      {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                    </div>
                    {p.thumbnail && <img src={p.thumbnail} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">₦{p.price.toLocaleString('en')}</p>
                    </div>
                  </button>
                )
              })}
              {products.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No products found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Email logs */}
      {tab === 'logs' && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-gray-400">No emails sent yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Recipient(s)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${TYPE_COLOR[log.type] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {TYPE_LABEL[log.type] ?? log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{log.subject}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">{log.to_email}</td>
                    <td className="px-4 py-3">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500" title={log.error ?? ''}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
