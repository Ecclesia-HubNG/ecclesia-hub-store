'use client'

import { useState, useTransition } from 'react'
import { createPromotion, activatePromotion, deactivatePromotion, deletePromotion } from '@/lib/actions/promotions'

type Promotion = {
  id: string
  name: string
  discount_pct: number
  is_active: boolean
  applied_at: string | null
  created_at: string
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PromotionsManager({ initial }: { initial: Promotion[] }) {
  const [promotions, setPromotions] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [pct, setPct] = useState('')
  const [showForm, setShowForm] = useState(false)

  const active = promotions.find(p => p.is_active) ?? null

  function notify(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess('') }
    else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 4000)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const pctNum = parseFloat(pct)
    if (!name.trim() || isNaN(pctNum)) return
    startTransition(async () => {
      const res = await createPromotion(name, pctNum)
      if ('error' in res) { notify(res.error ?? 'Something went wrong.', true); return }
      setPromotions(prev => [...prev, {
        id: crypto.randomUUID(),
        name: name.trim(),
        discount_pct: pctNum,
        is_active: false,
        applied_at: null,
        created_at: new Date().toISOString(),
      }])
      setName(''); setPct(''); setShowForm(false)
      notify('Promotion created.')
      // Refresh to get real id
      setTimeout(() => window.location.reload(), 800)
    })
  }

  function handleActivate(id: string) {
    if (!confirm('This will update ALL active product prices immediately. Continue?')) return
    setPendingId(id)
    startTransition(async () => {
      const res = await activatePromotion(id)
      setPendingId(null)
      if ('error' in res) { notify(res.error ?? 'Something went wrong.', true); return }
      setPromotions(prev => prev.map(p => ({ ...p, is_active: p.id === id, applied_at: p.id === id ? new Date().toISOString() : p.applied_at })))
      notify(`Promotion activated — ${res.count} products updated.`)
    })
  }

  function handleDeactivate(id: string) {
    if (!confirm('This will restore all original prices. Continue?')) return
    setPendingId(id)
    startTransition(async () => {
      const res = await deactivatePromotion(id)
      setPendingId(null)
      if ('error' in res) { notify(res.error ?? 'Something went wrong.', true); return }
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p))
      notify('Promotion deactivated — original prices restored.')
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this promotion?')) return
    setPendingId(id)
    startTransition(async () => {
      const res = await deletePromotion(id)
      setPendingId(null)
      if ('error' in res) { notify(res.error ?? 'Something went wrong.', true); return }
      setPromotions(prev => prev.filter(p => p.id !== id))
      notify('Promotion deleted.')
    })
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {(error || success) && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          error
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
        }`}>
          {error || success}
        </div>
      )}

      {/* Active banner */}
      {active && (
        <div className="flex items-center gap-4 px-5 py-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {active.name} — {active.discount_pct}% off all products
            </p>
            {active.applied_at && (
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                Running since {fmt(active.applied_at)}
              </p>
            )}
          </div>
          <button
            onClick={() => handleDeactivate(active.id)}
            disabled={pending}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors disabled:opacity-50"
          >
            {pendingId === active.id ? 'Restoring…' : 'End Sale'}
          </button>
        </div>
      )}

      {/* Create form */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowForm(p => !p)}
          className="flex items-center justify-between w-full px-5 py-4 text-left"
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Create Promotion</p>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showForm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showForm && (
          <form onSubmit={handleCreate} className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Promotion name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Summer Sale"
                  required
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Discount %</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={pct}
                    onChange={e => setPct(e.target.value)}
                    placeholder="50"
                    required
                    className="w-full px-3 py-2 pr-8 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
            </div>
            {pct && !isNaN(parseFloat(pct)) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                A product priced at <strong>₦10,000</strong> will sell for <strong>₦{(10000 * (1 - parseFloat(pct) / 100)).toLocaleString()}</strong> during this promotion.
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {pending ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Promotions list */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">All Promotions</p>
        </div>

        {promotions.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No promotions yet — create one above to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[...promotions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(promo => (
              <div key={promo.id} className="flex items-center gap-4 px-5 py-4">
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${promo.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{promo.name}</p>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      promo.is_active
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {promo.is_active ? 'LIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {promo.discount_pct}% off all products
                    {promo.applied_at && ` · Last run ${fmt(promo.applied_at)}`}
                    {!promo.applied_at && ` · Created ${fmt(promo.created_at)}`}
                  </p>
                </div>

                {/* Discount pill */}
                <span className="shrink-0 px-3 py-1 text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-full">
                  -{promo.discount_pct}%
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {promo.is_active ? (
                    <button
                      onClick={() => handleDeactivate(promo.id)}
                      disabled={pending}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                    >
                      {pendingId === promo.id ? '…' : 'End Sale'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleActivate(promo.id)}
                        disabled={pending || !!active}
                        title={active && !promo.is_active ? 'End the current sale first' : undefined}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {pendingId === promo.id ? '…' : 'Run Sale'}
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        disabled={pending}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
