'use client'

import { useState, useTransition } from 'react'
import {
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  toggleShippingZone,
  type ShippingZone,
} from '@/lib/actions/shipping'

function fmt(n: number) {
  return '₦' + Number(n).toLocaleString('en')
}

type FormState = {
  country: string
  state: string
  area: string
  price: string
  is_active: boolean
}

const EMPTY_FORM: FormState = { country: 'Nigeria', state: '', area: '', price: '', is_active: true }

function ZoneForm({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial: FormState
  onSave: (f: FormState) => void
  onCancel: () => void
  pending: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof FormState, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Country</label>
          <input
            value={form.country}
            onChange={e => set('country', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
            placeholder="Nigeria"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">State <span className="text-red-500">*</span></label>
          <input
            value={form.state}
            onChange={e => set('state', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
            placeholder="e.g. Lagos"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Area <span className="text-gray-400 font-normal">(optional — leave blank to apply to whole state)</span>
          </label>
          <input
            value={form.area}
            onChange={e => set('area', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
            placeholder="e.g. Ikeja, Lekki, Victoria Island"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Shipping Price (₦) <span className="text-red-500">*</span></label>
          <input
            type="number"
            min="0"
            step="50"
            value={form.price}
            onChange={e => set('price', e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
            placeholder="e.g. 1500"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => onSave(form)}
          className="px-5 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving…' : 'Save zone'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function ShippingManager({ zones: initial }: { zones: ShippingZone[] }) {
  const [zones, setZones] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Group zones by state for display
  const grouped = zones.reduce<Record<string, ShippingZone[]>>((acc, z) => {
    const key = `${z.country} / ${z.state}`
    acc[key] = acc[key] ?? []
    acc[key].push(z)
    return acc
  }, {})

  function handleAdd(form: FormState) {
    setError(null)
    startTransition(async () => {
      const res = await createShippingZone({
        country: form.country,
        state: form.state,
        area: form.area || null,
        price: Number(form.price),
      })
      if (res.error) { setError(res.error); return }
      setShowAdd(false)
      // Optimistic update
      setZones(prev => [...prev, {
        id: Math.random().toString(),
        country: form.country || 'Nigeria',
        state: form.state,
        area: form.area || null,
        price: Number(form.price),
        is_active: true,
        created_at: new Date().toISOString(),
      }].sort((a, b) => a.state.localeCompare(b.state)))
    })
  }

  function handleUpdate(id: string, form: FormState) {
    setError(null)
    startTransition(async () => {
      const res = await updateShippingZone(id, {
        country: form.country,
        state: form.state,
        area: form.area || null,
        price: Number(form.price),
        is_active: form.is_active,
      })
      if (res.error) { setError(res.error); return }
      setEditId(null)
      setZones(prev => prev.map(z => z.id === id ? {
        ...z,
        country: form.country || 'Nigeria',
        state: form.state,
        area: form.area || null,
        price: Number(form.price),
        is_active: form.is_active,
      } : z))
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this shipping zone?')) return
    startTransition(async () => {
      const res = await deleteShippingZone(id)
      if (res.error) { setError(res.error); return }
      setZones(prev => prev.filter(z => z.id !== id))
    })
  }

  function handleToggle(id: string, is_active: boolean) {
    startTransition(async () => {
      const res = await toggleShippingZone(id, is_active)
      if (res.error) { setError(res.error); return }
      setZones(prev => prev.map(z => z.id === id ? { ...z, is_active } : z))
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Zones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Set delivery prices by location. You can add areas within a state for specific pricing.
          </p>
        </div>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add zone
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
      )}

      {/* Add form */}
      {showAdd && (
        <ZoneForm
          initial={EMPTY_FORM}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          pending={pending}
        />
      )}

      {/* Zone list grouped by state */}
      {Object.keys(grouped).length === 0 && !showAdd ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No shipping zones yet</p>
          <p className="text-xs text-gray-400">Add zones to enable shipping cost calculation at checkout</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([groupKey, groupZones]) => (
            <div key={groupKey} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{groupKey}</h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {groupZones.map(zone => (
                  <div key={zone.id}>
                    {editId === zone.id ? (
                      <div className="p-4">
                        <ZoneForm
                          initial={{
                            country: zone.country,
                            state: zone.state,
                            area: zone.area ?? '',
                            price: String(zone.price),
                            is_active: zone.is_active,
                          }}
                          onSave={form => handleUpdate(zone.id, form)}
                          onCancel={() => setEditId(null)}
                          pending={pending}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center px-5 py-3.5 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {zone.area ?? <span className="italic text-gray-400">Entire state</span>}
                          </p>
                          {!zone.is_active && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Disabled</span>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${zone.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                          {fmt(zone.price)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle active */}
                          <button
                            type="button"
                            title={zone.is_active ? 'Disable' : 'Enable'}
                            onClick={() => handleToggle(zone.id, !zone.is_active)}
                            className={`p-1.5 rounded-lg transition-colors ${zone.is_active ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              {zone.is_active
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                              }
                            </svg>
                          </button>
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => setEditId(zone.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(zone.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How it works hint */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">How shipping zones work</p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Add a zone with just a <strong>State</strong> and no Area — this sets the default price for that state.</li>
          <li>Add zones with specific <strong>Areas</strong> within a state for different pricing (e.g. Ikeja ₦1,500, Lekki ₦2,000).</li>
          <li>At checkout, customers pick their state then their area. The matching price is applied automatically.</li>
          <li>If no zone matches, shipping will show as "TBD" and won't be added to the total.</li>
        </ul>
      </div>
    </div>
  )
}
