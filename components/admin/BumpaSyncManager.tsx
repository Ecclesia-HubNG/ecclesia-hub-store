'use client'

import { useState, useTransition } from 'react'
import { parseBumpaCSV } from '@/lib/bumpa-csv'
import { matchBumpaRows, applyBumpaSync, type MatchedRow, type AmbiguousRow, type UnmatchedRow } from '@/lib/actions/bumpa-sync'

function fmt(n: number | null) {
  if (n === null) return '—'
  return n.toLocaleString('en-NG')
}

export function BumpaSyncManager() {
  const [isParsing, setIsParsing] = useState(false)
  const [matched, setMatched] = useState<MatchedRow[] | null>(null)
  const [ambiguous, setAmbiguous] = useState<AmbiguousRow[]>([])
  const [unmatched, setUnmatched] = useState<UnmatchedRow[]>([])
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [resolved, setResolved] = useState<Record<string, string>>({}) // bumpaId -> chosen productId
  const [showUnmatched, setShowUnmatched] = useState(false)
  const [isApplying, startApply] = useTransition()
  const [result, setResult] = useState<string>('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsing(true)
    setResult('')
    const reader = new FileReader()
    reader.onload = async () => {
      const text = String(reader.result ?? '')
      const rows = parseBumpaCSV(text)
      const res = await matchBumpaRows(rows)
      if (res.error) {
        setResult(`Error reading your products — nothing was matched: ${res.error}`)
        setIsParsing(false)
        return
      }
      setMatched(res.matched)
      setAmbiguous(res.ambiguous)
      setUnmatched(res.unmatched)
      setExcluded(new Set())
      setResolved({})
      setIsParsing(false)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function toggleExclude(bumpaId: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(bumpaId)) next.delete(bumpaId)
      else next.add(bumpaId)
      return next
    })
  }

  function handleApply() {
    if (!matched) return
    const toApply = matched
      .filter(r => !excluded.has(r.bumpaId))
      .map(r => ({
        productId: r.productId,
        bumpaId: r.bumpaId,
        price: r.newPrice,
        cost_price: r.newCost,
        stock: r.newStock,
      }))

    // Include resolved ambiguous rows the user paired manually
    for (const a of ambiguous) {
      const productId = resolved[a.bumpaId]
      if (!productId) continue
      toApply.push({ productId, bumpaId: a.bumpaId, price: null, cost_price: null, stock: null })
    }

    startApply(async () => {
      const res = await applyBumpaSync(toApply)
      if ('error' in res) { setResult(`Error: ${res.error}`); return }
      setResult(`${res.count} product${res.count !== 1 ? 's' : ''} synced.`)
      setMatched(null)
      setAmbiguous([])
      setUnmatched([])
    })
  }

  const includedCount = matched ? matched.filter(r => !excluded.has(r.bumpaId)).length : 0

  return (
    <div className="max-w-5xl">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Sync from Bumpa</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Upload a Bumpa product export CSV. This only updates <strong>price, cost, and stock</strong> on
          products that already exist here — it never touches descriptions, images, categories, or slugs,
          and never creates duplicates.
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-[#4A0F1C] text-white cursor-pointer hover:bg-[#3a0c16] transition-colors">
          {isParsing ? 'Reading file…' : 'Choose Bumpa CSV'}
          <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={isParsing} />
        </label>
      </div>

      {result && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${
          result.startsWith('Error')
            ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
        }`}>
          {result}
        </div>
      )}

      {matched && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{includedCount}</strong> will update
              {ambiguous.length > 0 && <> · <strong className="text-amber-600">{ambiguous.length}</strong> need review</>}
              {unmatched.length > 0 && <> · <strong className="text-gray-400">{unmatched.length}</strong> not found (skipped)</>}
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying || includedCount === 0}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[#4A0F1C] text-white disabled:opacity-40 hover:bg-[#3a0c16] transition-colors"
            >
              {isApplying ? 'Syncing…' : `Apply ${includedCount} update${includedCount !== 1 ? 's' : ''}`}
            </button>
          </div>

          {matched.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Cost</th>
                      <th className="px-4 py-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {matched.map(r => (
                      <tr key={r.bumpaId} className={excluded.has(r.bumpaId) ? 'opacity-40' : ''}>
                        <td className="px-4 py-2.5">
                          <input
                            type="checkbox"
                            checked={!excluded.has(r.bumpaId)}
                            onChange={() => toggleExclude(r.bumpaId)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 dark:text-white">{r.name}</td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {r.newPrice !== null && r.newPrice !== r.currentPrice
                            ? <span>{fmt(r.currentPrice)} → <strong className="text-gray-900 dark:text-white">{fmt(r.newPrice)}</strong></span>
                            : fmt(r.currentPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {r.newCost !== null && r.newCost !== r.currentCost
                            ? <span>{fmt(r.currentCost)} → <strong className="text-gray-900 dark:text-white">{fmt(r.newCost)}</strong></span>
                            : fmt(r.currentCost)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {r.newStock !== null && r.newStock !== r.currentStock
                            ? <span>{r.currentStock} → <strong className="text-gray-900 dark:text-white">{r.newStock}</strong></span>
                            : r.currentStock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ambiguous.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900 rounded-2xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-3">
                Needs review — multiple matching products in your store
              </h3>
              <div className="space-y-3">
                {ambiguous.map(a => (
                  <div key={a.bumpaId} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-900 dark:text-white">{a.title}</span>
                    <select
                      value={resolved[a.bumpaId] ?? ''}
                      onChange={e => setResolved(prev => ({ ...prev, [a.bumpaId]: e.target.value }))}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                    >
                      <option value="">Skip</option>
                      {a.candidates.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unmatched.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <button
                type="button"
                onClick={() => setShowUnmatched(v => !v)}
                className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600"
              >
                {showUnmatched ? 'Hide' : 'Show'} {unmatched.length} not found in your store
              </button>
              {showUnmatched && (
                <ul className="mt-3 text-sm text-gray-500 dark:text-gray-400 space-y-1 max-h-64 overflow-y-auto">
                  {unmatched.map(u => <li key={u.bumpaId}>{u.title}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
