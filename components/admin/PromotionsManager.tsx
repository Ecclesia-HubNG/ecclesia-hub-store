'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  createPromotion,
  activatePromotion,
  deactivatePromotion,
  deletePromotion,
  addProductToPromotion,
  removeProductFromPromotion,
} from '@/lib/actions/promotions'

type PromoProduct = {
  id: string
  name: string
  thumbnail: string | null
  price: number
}

type Promotion = {
  id: string
  name: string
  discount_pct: number
  is_active: boolean
  applied_at: string | null
  created_at: string
  products: PromoProduct[]
}

type AllProduct = {
  id: string
  name: string
  thumbnail: string | null
  price: number
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function money(n: number) {
  return '₦' + n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ── Product panel for a single promotion ─────────────────────────────────────
function PromoProductPanel({
  promo,
  allProducts,
  onAdd,
  onRemove,
}: {
  promo: Promotion
  allProducts: AllProduct[]
  onAdd: (productId: string) => void
  onRemove: (productId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)

  const addedIds = useMemo(() => new Set(promo.products.map(p => p.id)), [promo.products])
  const multiplier = 1 - promo.discount_pct / 100

  const pool = useMemo(() => {
    if (!search.trim()) return promo.products.map(p => p.id)
    const q = search.toLowerCase()
    return allProducts.filter(p => p.name.toLowerCase().includes(q)).map(p => p.id)
  }, [search, allProducts, promo.products])

  const displayProducts = useMemo(() => {
    const productMap = new Map(allProducts.map(p => [p.id, p]))
    return pool.map(id => productMap.get(id)).filter(Boolean) as AllProduct[]
  }, [pool, allProducts])

  function handleAdd(productId: string) {
    setPendingProductId(productId)
    startTransition(async () => {
      await addProductToPromotion(promo.id, productId)
      onAdd(productId)
      setPendingProductId(null)
    })
  }

  function handleRemove(productId: string) {
    setPendingProductId(productId)
    startTransition(async () => {
      await removeProductFromPromotion(promo.id, productId)
      onRemove(productId)
      setPendingProductId(null)
    })
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {promo.products.length > 0
            ? `${promo.products.length} product${promo.products.length !== 1 ? 's' : ''} selected — discount applies only to these`
            : 'No products selected — discount will apply to all active products'}
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search to add products…"
        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
      />

      {/* Product list */}
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {displayProducts.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">
            {search ? 'No products match your search.' : 'Search above to add products.'}
          </p>
        ) : (
          displayProducts.map(p => {
            const isAdded = addedIds.has(p.id)
            const discounted = Math.round(p.price * multiplier)
            const isPending = pendingProductId === p.id && pending

            return (
              <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isAdded ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700' : 'hover:bg-white dark:hover:bg-gray-800'}`}>
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0 overflow-hidden">
                  {p.thumbnail && <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {money(p.price)}
                    {isAdded && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        → {money(discounted)} <span className="text-gray-400">({promo.discount_pct}% off)</span>
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => isAdded ? handleRemove(p.id) : handleAdd(p.id)}
                  className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                    isAdded
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={isAdded ? 'Remove from promotion' : 'Add to promotion'}
                >
                  {isPending ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : isAdded ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PromotionsManager({
  initial,
  allProducts,
}: {
  initial: Promotion[]
  allProducts: AllProduct[]
}) {
  const [promotions, setPromotions] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Create form
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
      setName(''); setPct(''); setShowForm(false)
      notify('Promotion created.')
      setTimeout(() => window.location.reload(), 800)
    })
  }

  function handleActivate(id: string) {
    const promo = promotions.find(p => p.id === id)
    const scope = promo?.products.length
      ? `${promo.products.length} selected product${promo.products.length !== 1 ? 's' : ''}`
      : 'ALL active products'
    if (!confirm(`This will apply the discount to ${scope}. Continue?`)) return
    setPendingId(id)
    startTransition(async () => {
      const res = await activatePromotion(id)
      setPendingId(null)
      if ('error' in res) { notify(res.error ?? 'Something went wrong.', true); return }
      setPromotions(prev =>
        prev.map(p => ({ ...p, is_active: p.id === id, applied_at: p.id === id ? new Date().toISOString() : p.applied_at }))
      )
      notify(`Promotion activated — ${res.count} product${res.count !== 1 ? 's' : ''} discounted.`)
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
      notify('Promotion ended — original prices restored.')
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
      if (expandedId === id) setExpandedId(null)
      notify('Promotion deleted.')
    })
  }

  function handleProductAdd(promoId: string, productId: string) {
    const product = allProducts.find(p => p.id === productId)
    if (!product) return
    setPromotions(prev =>
      prev.map(p =>
        p.id === promoId
          ? { ...p, products: [...p.products, product] }
          : p
      )
    )
  }

  function handleProductRemove(promoId: string, productId: string) {
    setPromotions(prev =>
      prev.map(p =>
        p.id === promoId
          ? { ...p, products: p.products.filter(pp => pp.id !== productId) }
          : p
      )
    )
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
              {active.name} — {active.discount_pct}% off{' '}
              {active.products.length > 0 ? `${active.products.length} selected products` : 'all products'}
            </p>
            {active.applied_at && (
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Running since {fmt(active.applied_at)}</p>
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
                A ₦10,000 product will sell for <strong>₦{(10000 * (1 - parseFloat(pct) / 100)).toLocaleString()}</strong> during this promotion.
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">After creating, open the promotion to select specific products — or leave empty to apply to all.</p>
            <div className="flex gap-3">
              <button type="submit" disabled={pending} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50">
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
              <div key={promo.id}>
                {/* Promotion row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${promo.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />

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
                      {promo.discount_pct}% off{' '}
                      {promo.products.length > 0
                        ? `${promo.products.length} selected product${promo.products.length !== 1 ? 's' : ''}`
                        : 'all products'
                      }
                      {promo.applied_at && ` · Last run ${fmt(promo.applied_at)}`}
                      {!promo.applied_at && ` · Created ${fmt(promo.created_at)}`}
                    </p>
                  </div>

                  <span className="shrink-0 px-3 py-1 text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-full">
                    -{promo.discount_pct}%
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Products toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(id => id === promo.id ? null : promo.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        expandedId === promo.id
                          ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      Products{promo.products.length > 0 ? ` (${promo.products.length})` : ''}
                    </button>

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

                {/* Expandable product panel */}
                {expandedId === promo.id && (
                  <PromoProductPanel
                    promo={promo}
                    allProducts={allProducts}
                    onAdd={productId => handleProductAdd(promo.id, productId)}
                    onRemove={productId => handleProductRemove(promo.id, productId)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
