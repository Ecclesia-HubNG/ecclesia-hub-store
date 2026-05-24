'use client'

import { useState, useTransition, useMemo, useRef, useEffect } from 'react'
import {
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  toggleShippingZone,
  type ShippingZone,
} from '@/lib/actions/shipping'

function fmt(n: number) { return '₦' + Number(n).toLocaleString('en') }

const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

const fieldCls = 'w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

// ── State picker dropdown ─────────────────────────────────────────────────────
function StatePicker({
  existing,
  deliveryZoneNames,
  onSelect,
  onClose,
}: {
  existing: string[]
  deliveryZoneNames: string[]
  onSelect: (s: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const deliverySet = new Set(deliveryZoneNames.map(n => n.toLowerCase()))
  const alreadySet = new Set(existing.map(s => s.toLowerCase()))
  const filtered = NG_STATES.filter(s =>
    s.toLowerCase().includes(search.toLowerCase()) && !alreadySet.has(s.toLowerCase())
  )

  // sort: delivery types first, then alphabetical
  filtered.sort((a, b) => {
    const aIn = deliverySet.has(a.toLowerCase())
    const bIn = deliverySet.has(b.toLowerCase())
    if (aIn && !bIn) return -1
    if (!aIn && bIn) return 1
    return a.localeCompare(b)
  })

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-72 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search states…"
          className={fieldCls}
        />
      </div>
      {deliveryZoneNames.length > 0 && !search && (
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#4A0F1C] dark:text-[#E8C4CB]">
          From your delivery types
        </p>
      )}
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">No states left to add</p>
        )}
        {filtered.map(state => {
          const inDelivery = deliverySet.has(state.toLowerCase())
          return (
            <button
              key={state}
              type="button"
              onClick={() => { onSelect(state); onClose() }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className={inDelivery ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}>{state}</span>
              {inDelivery && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30 text-[#4A0F1C] dark:text-[#E8C4CB] rounded">
                  Delivery type
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Inline form: add or edit a single area ────────────────────────────────────
function AreaForm({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial?: { area: string; price: number }
  onSave: (area: string, price: number) => void
  onCancel: () => void
  pending: boolean
}) {
  const [areaName, setAreaName] = useState(initial?.area ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const p = parseFloat(price)
    if (!areaName.trim() || isNaN(p) || p < 0) return
    onSave(areaName.trim(), p)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Area / City</label>
        <input
          autoFocus
          value={areaName}
          onChange={e => setAreaName(e.target.value)}
          placeholder="e.g. Ikeja, Agege, Lekki Phase 1"
          required
          className={fieldCls}
        />
      </div>
      <div className="w-36">
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Price (₦)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
          <input
            type="number" min="0" step="50"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0"
            required
            className={fieldCls.replace('px-3', 'pl-7 pr-3')}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !areaName.trim() || !price}
          className="px-4 py-2 bg-[#4A0F1C] text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-[#3A0B15] transition-colors">
          {pending ? 'Saving…' : initial ? 'Update' : 'Add area'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
      </div>
    </form>
  )
}

// ── State section: header + list of areas ─────────────────────────────────────
function StateSection({
  stateName,
  areas,
  deliveryZoneNames,
  onAreaAdded,
  onAreaUpdated,
  onAreaDeleted,
}: {
  stateName: string
  areas: ShippingZone[]
  deliveryZoneNames: string[]
  onAreaAdded: (z: ShippingZone) => void
  onAreaUpdated: (z: ShippingZone) => void
  onAreaDeleted: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const [addingArea, setAddingArea] = useState(areas.length === 0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const inDelivery = deliveryZoneNames.some(n => n.toLowerCase() === stateName.toLowerCase())

  function handleAdd(area: string, price: number) {
    startTransition(async () => {
      const res = await createShippingZone({ name: area, state: stateName, area, price, country: 'Nigeria' })
      if ('error' in res) return
      onAreaAdded({
        id: crypto.randomUUID(),
        name: area, state: stateName, area, price,
        country: 'Nigeria', is_active: true,
        created_at: new Date().toISOString(),
      })
      setAddingArea(false)
    })
  }

  function handleUpdate(zone: ShippingZone, area: string, price: number) {
    startTransition(async () => {
      const res = await updateShippingZone(zone.id, { name: area, state: stateName, area, price, is_active: zone.is_active, country: 'Nigeria' })
      if ('error' in res) return
      onAreaUpdated({ ...zone, name: area, area, price })
      setEditingId(null)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this area?')) return
    startTransition(async () => {
      await deleteShippingZone(id)
      onAreaDeleted(id)
    })
  }

  function handleToggle(zone: ShippingZone) {
    startTransition(async () => {
      await toggleShippingZone(zone.id, !zone.is_active)
      onAreaUpdated({ ...zone, is_active: !zone.is_active })
    })
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* State header */}
      <div
        className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 cursor-pointer select-none"
        onClick={() => setOpen(p => !p)}
      >
        <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{stateName}</p>
            {inDelivery && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30 text-[#4A0F1C] dark:text-[#E8C4CB] rounded">
                Delivery type
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {areas.length} area{areas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setAddingArea(true); setOpen(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4A0F1C] dark:text-[#E8C4CB] bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20 hover:bg-[#4A0F1C]/10 dark:hover:bg-[#4A0F1C]/30 rounded-lg transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add area
        </button>
      </div>

      {/* Areas */}
      {open && (
        <div className="px-4 pb-4 pt-2 space-y-2 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
          {areas.length === 0 && !addingArea && (
            <p className="px-2 py-3 text-xs text-gray-400 text-center">No areas yet — click "Add area" above to get started.</p>
          )}

          {areas.map(zone =>
            editingId === zone.id ? (
              <AreaForm
                key={zone.id}
                initial={{ area: zone.area || zone.name, price: zone.price }}
                onSave={(a, p) => handleUpdate(zone, a, p)}
                onCancel={() => setEditingId(null)}
                pending={pending}
              />
            ) : (
              <div key={zone.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${zone.is_active ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-800/40 border-dashed border-gray-200 dark:border-gray-700 opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {zone.area || zone.name}
                  </p>
                  {!zone.is_active && (
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Disabled</p>
                  )}
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">{fmt(zone.price)}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => handleToggle(zone)} disabled={pending} title={zone.is_active ? 'Disable' : 'Enable'}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${zone.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      {zone.is_active
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />}
                    </svg>
                  </button>
                  <button type="button" onClick={() => setEditingId(zone.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                  </button>
                  <button type="button" onClick={() => handleDelete(zone.id)} disabled={pending}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            )
          )}

          {addingArea && (
            <AreaForm
              onSave={handleAdd}
              onCancel={() => setAddingArea(false)}
              pending={pending}
            />
          )}

          {!addingArea && areas.length > 0 && (
            <button type="button" onClick={() => setAddingArea(true)}
              className="flex items-center gap-2 w-full px-4 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add another area
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ShippingManager({
  zones: initial,
  deliveryZoneNames,
}: {
  zones: ShippingZone[]
  deliveryZoneNames: string[]
}) {
  const [zones, setZones] = useState(initial)
  const [showPicker, setShowPicker] = useState(false)

  // Client-side state names (include empty new states not yet in DB)
  const [stateOrder, setStateOrder] = useState<string[]>(() => {
    const seen: string[] = []
    for (const z of initial) { if (!seen.includes(z.state)) seen.push(z.state) }
    return seen.sort()
  })

  const grouped = useMemo(() => {
    const map = new Map<string, ShippingZone[]>()
    for (const s of stateOrder) map.set(s, [])
    for (const z of zones) {
      const key = z.state || 'Unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(z)
    }
    return map
  }, [zones, stateOrder])

  function addState(state: string) {
    if (!stateOrder.includes(state)) {
      setStateOrder(prev => [...prev, state].sort())
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Zones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Add states, then define areas and their shipping prices within each state.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add State
          </button>
          {showPicker && (
            <StatePicker
              existing={stateOrder}
              deliveryZoneNames={deliveryZoneNames}
              onSelect={addState}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      </div>

      {/* State sections */}
      {grouped.size === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No states added yet</p>
          <p className="text-xs text-gray-400">Click "Add State" to define where you ship to and set prices for each area.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([state, areas]) => (
            <StateSection
              key={state}
              stateName={state}
              areas={areas}
              deliveryZoneNames={deliveryZoneNames}
              onAreaAdded={z => setZones(prev => [...prev, z])}
              onAreaUpdated={z => setZones(prev => prev.map(x => x.id === z.id ? z : x))}
              onAreaDeleted={id => setZones(prev => prev.filter(x => x.id !== id))}
            />
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">How this works</p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Each state groups all delivery areas within it. Add the state first, then add areas with prices.</li>
          <li>States marked <strong>Delivery type</strong> are already configured in your Delivery Types — keep names consistent.</li>
          <li>Only active areas appear at checkout. Disable any you don't currently service.</li>
        </ul>
      </div>
    </div>
  )
}
