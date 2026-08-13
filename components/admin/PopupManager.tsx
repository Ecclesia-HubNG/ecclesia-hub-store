'use client'

import { useState, useTransition } from 'react'
import { updatePopupConfig, type PopupConfig } from '@/lib/actions/popup-config'

const PAGE_OPTIONS = [
  { value: 'all',           label: 'All pages' },
  { value: '/home',         label: 'Home' },
  { value: '/shop',         label: 'Shop' },
  { value: '/product',      label: 'Product pages' },
  { value: '/category',     label: 'Category pages' },
  { value: '/bestsellers',  label: 'Bestsellers' },
  { value: '/new-arrivals', label: 'New Arrivals' },
  { value: '/deals',        label: 'Deals' },
  { value: '/sale',         label: 'Sale' },
  { value: '/brands',       label: 'Brand pages' },
  { value: '/wishlist',     label: 'Wishlist' },
]

function withDiscount(text: string, discountValue: number) {
  return text.replace(/\{\{discount\}\}/g, String(discountValue))
}

export default function PopupManager({ config: initial }: { config: PopupConfig }) {
  const [cfg, setCfg] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isPending, startTransition] = useTransition()

  function set<K extends keyof PopupConfig>(key: K, value: PopupConfig[K]) {
    setCfg(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function togglePage(val: string) {
    const current = cfg.show_on_pages
    if (val === 'all') {
      set('show_on_pages', ['all'])
      return
    }
    const without = current.filter(p => p !== 'all')
    const next = without.includes(val) ? without.filter(p => p !== val) : [...without, val]
    set('show_on_pages', next.length ? next : ['all'])
  }

  function handleSave() {
    setSaveError('')
    startTransition(async () => {
      const res = await updatePopupConfig({
        is_enabled:     cfg.is_enabled,
        image_url:      cfg.image_url,
        pre_headline:   cfg.pre_headline,
        headline:       cfg.headline,
        body_text:      cfg.body_text,
        button_text:    cfg.button_text,
        dismiss_text:   cfg.dismiss_text,
        delay_seconds:  cfg.delay_seconds,
        suppress_days:  cfg.suppress_days,
        show_on_pages:  cfg.show_on_pages,
        discount_value: cfg.discount_value,
        coupon_code:    cfg.coupon_code,
      })
      if ('error' in res) { setSaveError(res.error ?? 'Save failed'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const inputCls = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white placeholder-gray-400'
  const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

  return (
    <div className="flex gap-8 items-start">

      {/* ── Left: settings ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Popup enabled</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Show the newsletter popup to storefront visitors. Turning it off also deactivates the {cfg.coupon_code} coupon, so the code stops working at checkout too.</p>
          </div>
          <button
            type="button"
            onClick={() => set('is_enabled', !cfg.is_enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${cfg.is_enabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-gray-900 shadow transform transition-transform ${cfg.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Image */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Left panel image</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Shown on the left side of the popup on desktop. Leave blank to use the default brand panel.</p>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className={labelCls}>Image URL</label>
              <input
                type="url"
                value={cfg.image_url ?? ''}
                onChange={e => set('image_url', e.target.value || null)}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
            {cfg.image_url && (
              <div className="shrink-0 mt-5">
                <img src={cfg.image_url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
              </div>
            )}
          </div>
        </div>

        {/* Discount */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Discount</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
            The single source of truth for this offer. Changing it updates the <span className="font-mono">{cfg.coupon_code}</span> coupon that gets emailed to subscribers, so what's shown here is always what checkout actually honors.
          </p>
          <div className="max-w-[140px]">
            <label className={labelCls}>Discount %</label>
            <div className="relative">
              <input
                type="number" min={0} max={100} step={1}
                value={cfg.discount_value}
                onChange={e => set('discount_value', Number(e.target.value))}
                className={inputCls}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Text content</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
            Use <span className="font-mono">{'{{discount}}'}</span> anywhere you want the discount % above inserted — it'll always stay in sync.
          </p>
          <div>
            <label className={labelCls}>Pre-headline <span className="text-gray-400">(small text above)</span></label>
            <input type="text" value={cfg.pre_headline} onChange={e => set('pre_headline', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Headline <span className="text-gray-400">(large bold text)</span></label>
            <input type="text" value={cfg.headline} onChange={e => set('headline', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Body text</label>
            <textarea
              value={cfg.body_text}
              onChange={e => set('body_text', e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className={labelCls}>Button text</label>
            <input type="text" value={cfg.button_text} onChange={e => set('button_text', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Dismiss link text</label>
            <input type="text" value={cfg.dismiss_text} onChange={e => set('dismiss_text', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Timeline</h3>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Delay before showing</label>
              <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{cfg.delay_seconds}s</span>
            </div>
            <input
              type="range" min={1} max={15} step={1}
              value={cfg.delay_seconds}
              onChange={e => set('delay_seconds', Number(e.target.value))}
              className="w-full accent-gray-900 dark:accent-white"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1s</span><span>15s</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Suppress after dismiss/subscribe</label>
              <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{cfg.suppress_days} day{cfg.suppress_days !== 1 ? 's' : ''}</span>
            </div>
            <input
              type="range" min={1} max={60} step={1}
              value={cfg.suppress_days}
              onChange={e => set('suppress_days', Number(e.target.value))}
              className="w-full accent-gray-900 dark:accent-white"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1 day</span><span>60 days</span>
            </div>
          </div>
        </div>

        {/* Pages */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Show on pages</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Select which pages the popup appears on.</p>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_OPTIONS.map(opt => {
              const checked = cfg.show_on_pages.includes(opt.value) ||
                (opt.value !== 'all' && cfg.show_on_pages.includes('all'))
              const isAll = opt.value === 'all'
              return (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePage(opt.value)}
                    className="w-4 h-4 rounded border-gray-300 accent-gray-900 dark:accent-white cursor-pointer"
                  />
                  <span className={`text-sm ${isAll ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {opt.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved!</span>}
          {saveError && <span className="text-sm text-red-500">{saveError}</span>}
        </div>
      </div>

      {/* ── Right: live preview ─────────────────────────────────────── */}
      <div className="w-[420px] shrink-0 sticky top-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Live Preview</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.is_enabled ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
              {cfg.is_enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          {/* Scaled popup preview */}
          <div className="relative bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden" style={{ paddingBottom: '64%' }}>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {/* Mini popup */}
              <div className="w-full max-w-[340px] rounded-xl overflow-hidden shadow-lg flex text-[10px]" style={{ fontSize: '9px' }}>
                {/* Left panel */}
                <div
                  className="w-[42%] shrink-0 flex flex-col items-center justify-center p-3 relative overflow-hidden"
                  style={{ background: cfg.image_url ? undefined : '#4A0F1C' }}
                >
                  {cfg.image_url ? (
                    <img src={cfg.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                      <div className="relative z-10 text-center">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                          <svg className="w-3.5 h-3.5 text-[#E8C4CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <p className="text-white font-bold text-[8px] leading-tight">Glow. Nourish.<br />Thrive.</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Right panel */}
                <div className="flex-1 bg-white p-3 relative">
                  {/* Close dot */}
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-2 h-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-[#6B1A2A] font-bold uppercase tracking-wider truncate mb-1" style={{ fontSize: '7px' }}>
                    {withDiscount(cfg.pre_headline, cfg.discount_value)}
                  </p>
                  <p className="font-black text-gray-900 leading-tight mb-1.5 truncate" style={{ fontSize: '11px' }}>
                    {withDiscount(cfg.headline, cfg.discount_value)}
                  </p>
                  <p className="text-gray-500 leading-snug mb-2" style={{ fontSize: '7px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {withDiscount(cfg.body_text, cfg.discount_value)}
                  </p>
                  {/* Input */}
                  <div className="border border-gray-200 rounded px-1.5 py-1 mb-1.5 text-gray-400" style={{ fontSize: '7px' }}>
                    Enter your email address
                  </div>
                  {/* Button */}
                  <div className="bg-[#4A0F1C] rounded px-2 py-1 text-white text-center font-bold truncate" style={{ fontSize: '7px' }}>
                    {withDiscount(cfg.button_text, cfg.discount_value)}
                  </div>
                  {/* Dismiss */}
                  <p className="text-center text-gray-400 mt-1 truncate" style={{ fontSize: '6px' }}>
                    {cfg.dismiss_text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Appears after</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{cfg.delay_seconds}s delay</p>
            </div>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Suppressed for</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{cfg.suppress_days} days</p>
            </div>
            <div className="col-span-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Showing on</p>
              <div className="flex flex-wrap gap-1">
                {cfg.show_on_pages.map(p => (
                  <span key={p} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {PAGE_OPTIONS.find(o => o.value === p)?.label ?? p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
