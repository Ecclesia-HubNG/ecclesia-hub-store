'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  createDeliveryType, updateDeliveryType, deleteDeliveryType,
  createDeliveryLocations, createDeliveryZone, updateDeliveryZone, deleteDeliveryZone,
  createDeliveryRate, updateDeliveryRate, deleteDeliveryRate,
  createDeliveryChannel, updateDeliveryChannel, deleteDeliveryChannel,
} from '@/lib/actions/delivery'

// ── Nigerian states list ──────────────────────────────────────────────────────
const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

// ── State / area multi-select picker ─────────────────────────────────────────
function StateAreaPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [custom, setCustom] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const filtered = NG_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()))

  function toggle(state: string) {
    onChange(value.includes(state) ? value.filter(v => v !== state) : [...value, state])
  }

  function addCustom() {
    const tags = custom.split(',').map(t => t.trim()).filter(Boolean)
    const combined = [...value, ...tags]
    onChange(combined.filter((t, i) => combined.indexOf(t) === i))
    setCustom('')
  }

  const inputCls = 'w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20'

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips + open button */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 min-h-[38px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer" onClick={() => setOpen(p => !p)}>
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-xs rounded-md">
            {v}
            <button type="button" onClick={e => { e.stopPropagation(); onChange(value.filter(x => x !== v)) }} className="text-blue-400 hover:text-red-500 leading-none">×</button>
          </span>
        ))}
        <span className="text-sm text-gray-400 ml-auto flex items-center gap-1 shrink-0">
          {value.length === 0 && <span className="text-gray-400">Select states / areas…</span>}
          <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search states…"
              className={inputCls}
            />
          </div>

          {/* States grid */}
          <div className="max-h-52 overflow-y-auto p-2 grid grid-cols-2 gap-0.5">
            {filtered.length === 0 && <p className="col-span-2 text-xs text-gray-400 py-3 text-center">No match</p>}
            {filtered.map(state => {
              const checked = value.includes(state)
              return (
                <button
                  key={state}
                  type="button"
                  onClick={() => toggle(state)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${checked ? 'bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${checked ? 'bg-[#4A0F1C] dark:bg-[#E8C4CB] border-[#4A0F1C] dark:border-[#E8C4CB]' : 'border-gray-300 dark:border-gray-600'}`}>
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-xs ${checked ? 'font-semibold text-[#4A0F1C] dark:text-[#E8C4CB]' : 'text-gray-700 dark:text-gray-300'}`}>{state}</span>
                </button>
              )
            })}
          </div>

          {/* Custom area input */}
          <div className="p-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 mb-1.5">Add city / LGA not in the list above:</p>
            <div className="flex gap-2">
              <input
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { e.preventDefault(); addCustom() } }}
                placeholder="e.g. Kafanchan, Lekki…"
                className="flex-1 px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={!custom.trim()}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          {/* Footer */}
          {value.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <span className="text-xs text-gray-500">{value.length} selected</span>
              <button type="button" onClick={() => onChange([])} className="text-xs text-red-400 hover:text-red-600">Clear all</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Rate = { id: string; name: string; areas: string[]; price: number; estimated_days: string | null; is_active: boolean; sort_order: number }
type Zone = { id: string; name: string; description: string | null; is_active: boolean; rates: Rate[] }
type DeliveryType = { id: string; name: string; description: string | null; is_active: boolean; zones: Zone[] }
type Channel = { id: string; name: string; description: string | null; contact: string | null; is_active: boolean }

function money(n: number) {
  return '₦' + n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ── Tag input for areas ───────────────────────────────────────────────────────
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tags = raw.split(',').map(t => t.trim()).filter(Boolean)
    const combined = [...value, ...tags]
    const next = combined.filter((t, i) => combined.indexOf(t) === i)
    onChange(next)
    setInput('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1 px-3 py-2 min-h-[38px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg cursor-text"
      onClick={() => ref.current?.focus()}
    >
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
          {tag}
          <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="text-gray-400 hover:text-red-500 leading-none">×</button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={value.length ? '' : placeholder}
        className="flex-1 min-w-[100px] text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
      />
    </div>
  )
}

// ── Inline form for adding/editing a rate ─────────────────────────────────────
function RateForm({
  zoneId,
  initial,
  onSave,
  onCancel,
}: {
  zoneId: string
  initial?: Rate
  onSave: (rate: Rate) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [areas, setAreas] = useState<string[]>(initial?.areas ?? [])
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [days, setDays] = useState(initial?.estimated_days ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const p = parseFloat(price)
    if (!name.trim() || isNaN(p)) { setError('Name and price are required.'); return }
    startTransition(async () => {
      if (initial) {
        const res = await updateDeliveryRate(initial.id, name, areas, p, days, initial.is_active)
        if ('error' in res) { setError(res.error!); return }
        onSave({ ...initial, name: name.trim(), areas, price: p, estimated_days: days || null })
      } else {
        const res = await createDeliveryRate(zoneId, name, areas, p, days)
        if ('error' in res) { setError(res.error!); return }
        onSave((res as any).rate)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Rate name</label>
          <input
            autoFocus value={name} onChange={e => setName(e.target.value)} required
            placeholder="e.g. Airport Pick Up, Lekki, Island Group"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Price (₦)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
            <input
              type="number" min="0" step="50" value={price} onChange={e => setPrice(e.target.value)} required
              placeholder="0"
              className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Areas / States covered</label>
          <StateAreaPicker value={areas} onChange={setAreas} />
          <p className="text-[10px] text-gray-400 mt-1">Leave empty for a single named area.</p>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Estimated delivery</label>
          <input
            value={days} onChange={e => setDays(e.target.value)}
            placeholder="e.g. 1–2 days, 3–5 days"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg disabled:opacity-50">
          {pending ? 'Saving…' : initial ? 'Update Rate' : 'Add Rate'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
      </div>
    </form>
  )
}

// ── Rate row ──────────────────────────────────────────────────────────────────
function RateRow({ rate, zoneId, onUpdate, onDelete }: { rate: Rate; zoneId: string; onUpdate: (r: Rate) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete rate "${rate.name}"?`)) return
    startTransition(async () => {
      await deleteDeliveryRate(rate.id)
      onDelete(rate.id)
    })
  }

  function handleToggle() {
    startTransition(async () => {
      await updateDeliveryRate(rate.id, rate.name, rate.areas, rate.price, rate.estimated_days ?? '', !rate.is_active)
      onUpdate({ ...rate, is_active: !rate.is_active })
    })
  }

  if (editing) return (
    <RateForm
      zoneId={zoneId}
      initial={rate}
      onSave={r => { onUpdate(r); setEditing(false) }}
      onCancel={() => setEditing(false)}
    />
  )

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${rate.is_active ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/40 opacity-60'} border border-gray-100 dark:border-gray-700`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{rate.name}</span>
          {rate.areas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {rate.areas.map(a => (
                <span key={a} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] rounded">{a}</span>
              ))}
            </div>
          )}
          {rate.estimated_days && (
            <span className="text-[10px] text-gray-400">{rate.estimated_days}</span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">{money(rate.price)}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={handleToggle} disabled={pending} title={rate.is_active ? 'Disable' : 'Enable'}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${rate.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {rate.is_active
              ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            }
          </svg>
        </button>
        <button type="button" onClick={() => setEditing(true)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
        </button>
        <button type="button" onClick={handleDelete} disabled={pending} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Zone section ──────────────────────────────────────────────────────────────
function ZoneSection({
  zone, typeId,
  onZoneUpdate, onZoneDelete,
  onRateAdd, onRateUpdate, onRateDelete,
}: {
  zone: Zone; typeId: string
  onZoneUpdate: (z: Zone) => void
  onZoneDelete: (id: string) => void
  onRateAdd: (zoneId: string, r: Rate) => void
  onRateUpdate: (zoneId: string, r: Rate) => void
  onRateDelete: (zoneId: string, rateId: string) => void
}) {
  const [open, setOpen] = useState(true)
  const [addingRate, setAddingRate] = useState(false)
  const [editingZone, setEditingZone] = useState(false)
  const [zoneName, setZoneName] = useState(zone.name)
  const [zoneDesc, setZoneDesc] = useState(zone.description ?? '')
  const [pending, startTransition] = useTransition()

  function handleZoneSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateDeliveryZone(zone.id, zoneName, zoneDesc, zone.is_active)
      onZoneUpdate({ ...zone, name: zoneName.trim(), description: zoneDesc.trim() || null })
      setEditingZone(false)
    })
  }

  function handleZoneDelete() {
    if (!confirm(`Delete zone "${zone.name}" and all its rates?`)) return
    startTransition(async () => {
      await deleteDeliveryZone(zone.id)
      onZoneDelete(zone.id)
    })
  }

  function handleZoneToggle() {
    startTransition(async () => {
      await updateDeliveryZone(zone.id, zone.name, zone.description ?? '', !zone.is_active)
      onZoneUpdate({ ...zone, is_active: !zone.is_active })
    })
  }

  return (
    <div className={`rounded-xl border ${zone.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-200 dark:border-gray-700 opacity-60'} overflow-hidden`}>
      {/* Zone header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 dark:bg-gray-800/50">
        <button type="button" onClick={() => setOpen(p => !p)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          {editingZone ? (
            <form onSubmit={handleZoneSave} className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
              <input autoFocus value={zoneName} onChange={e => setZoneName(e.target.value)} required
                className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
              <input value={zoneDesc} onChange={e => setZoneDesc(e.target.value)} placeholder="Description (optional)"
                className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 placeholder-gray-300 focus:outline-none"
              />
              <button type="submit" disabled={pending} className="px-3 py-1 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setEditingZone(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </form>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{zone.name}</p>
              {zone.description && <p className="text-xs text-gray-400 truncate">{zone.description}</p>}
            </div>
          )}
        </button>
        {!editingZone && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-gray-400">{zone.rates.length} rate{zone.rates.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={handleZoneToggle} disabled={pending} title={zone.is_active ? 'Disable zone' : 'Enable zone'}
              className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs transition-colors ${zone.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {zone.is_active
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                }
              </svg>
            </button>
            <button type="button" onClick={() => setEditingZone(true)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
            </button>
            <button type="button" onClick={handleZoneDelete} disabled={pending} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
          </div>
        )}
      </div>

      {/* Rates */}
      {open && (
        <div className="p-3 space-y-2">
          {zone.rates.map(rate => (
            <RateRow
              key={rate.id} rate={rate} zoneId={zone.id}
              onUpdate={r => onRateUpdate(zone.id, r)}
              onDelete={id => onRateDelete(zone.id, id)}
            />
          ))}

          {addingRate ? (
            <RateForm
              zoneId={zone.id}
              onSave={r => { onRateAdd(zone.id, r); setAddingRate(false) }}
              onCancel={() => setAddingRate(false)}
            />
          ) : (
            <button
              type="button" onClick={() => setAddingRate(true)}
              className="flex items-center gap-2 w-full px-4 py-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Rate
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DeliveryTypeManager({
  initial,
  initialChannels,
}: {
  initial: DeliveryType[]
  initialChannels: Channel[]
}) {
  const [types, setTypes] = useState(initial)
  const [channels, setChannels] = useState(initialChannels)
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(initial[0]?.id ?? null)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState('')

  // Add type form
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [typeName, setTypeName] = useState('')
  const [typeDesc, setTypeDesc] = useState('')

  // Quick-add location form per type
  const [addingLocToTypeId, setAddingLocToTypeId] = useState<string | null>(null)
  const [locNames, setLocNames] = useState<string[]>([])
  const [locRateName, setLocRateName] = useState('')
  const [locPrice, setLocPrice] = useState('')
  const [locDays, setLocDays] = useState('')

  // Add channel form
  const [showChannelForm, setShowChannelForm] = useState(false)
  const [chName, setChName] = useState('')
  const [chDesc, setChDesc] = useState('')
  const [chContact, setChContact] = useState('')
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)

  function notify(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Type CRUD ──
  function handleCreateType(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await createDeliveryType(typeName, typeDesc)
      if ('error' in res) { notify(res.error!); return }
      setTypeName(''); setTypeDesc(''); setShowTypeForm(false)
      setTimeout(() => window.location.reload(), 300)
    })
  }

  function handleTypeToggle(typeId: string, isActive: boolean) {
    const t = types.find(x => x.id === typeId)!
    startTransition(async () => {
      await updateDeliveryType(typeId, t.name, t.description ?? '', !isActive)
      setTypes(prev => prev.map(x => x.id === typeId ? { ...x, is_active: !isActive } : x))
    })
  }

  function handleTypeDelete(typeId: string) {
    if (!confirm('Delete this delivery type and all its zones/rates?')) return
    startTransition(async () => {
      await deleteDeliveryType(typeId)
      setTypes(prev => prev.filter(x => x.id !== typeId))
      if (expandedTypeId === typeId) setExpandedTypeId(null)
    })
  }

  // ── Zone CRUD ──
  function handleCreateLocations(e: React.FormEvent, typeId: string) {
    e.preventDefault()
    const p = parseFloat(locPrice)
    if (!locNames.length) { notify('Enter at least one location.'); return }
    if (isNaN(p) || p < 0) { notify('Enter a valid price.'); return }
    startTransition(async () => {
      const res = await createDeliveryLocations(typeId, locNames, locRateName, p, locDays)
      if ('error' in res) { notify(res.error!); return }
      const newZones = (res as any).zones as Zone[]
      setTypes(prev => prev.map(t => t.id === typeId ? { ...t, zones: [...t.zones, ...newZones] } : t))
      setLocNames([]); setLocRateName(''); setLocPrice(''); setLocDays(''); setAddingLocToTypeId(null)
    })
  }

  function handleZoneUpdate(typeId: string, zone: Zone) {
    setTypes(prev => prev.map(t => t.id === typeId ? { ...t, zones: t.zones.map(z => z.id === zone.id ? zone : z) } : t))
  }

  function handleZoneDelete(typeId: string, zoneId: string) {
    setTypes(prev => prev.map(t => t.id === typeId ? { ...t, zones: t.zones.filter(z => z.id !== zoneId) } : t))
  }

  // ── Rate CRUD ──
  function handleRateAdd(typeId: string, zoneId: string, rate: Rate) {
    setTypes(prev => prev.map(t => t.id === typeId ? {
      ...t,
      zones: t.zones.map(z => z.id === zoneId ? { ...z, rates: [...z.rates, rate] } : z),
    } : t))
  }

  function handleRateUpdate(typeId: string, zoneId: string, rate: Rate) {
    setTypes(prev => prev.map(t => t.id === typeId ? {
      ...t,
      zones: t.zones.map(z => z.id === zoneId ? { ...z, rates: z.rates.map(r => r.id === rate.id ? rate : r) } : z),
    } : t))
  }

  function handleRateDelete(typeId: string, zoneId: string, rateId: string) {
    setTypes(prev => prev.map(t => t.id === typeId ? {
      ...t,
      zones: t.zones.map(z => z.id === zoneId ? { ...z, rates: z.rates.filter(r => r.id !== rateId) } : z),
    } : t))
  }

  // ── Channel CRUD ──
  function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await createDeliveryChannel(chName, chDesc, chContact)
      if ('error' in res) { notify(res.error!); return }
      setChannels(prev => [...prev, (res as any).channel])
      setChName(''); setChDesc(''); setChContact(''); setShowChannelForm(false)
      notify('Channel added.')
    })
  }

  function handleChannelSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingChannelId) return
    const ch = channels.find(c => c.id === editingChannelId)!
    startTransition(async () => {
      await updateDeliveryChannel(editingChannelId, chName, chDesc, chContact, ch.is_active)
      setChannels(prev => prev.map(c => c.id === editingChannelId ? { ...c, name: chName, description: chDesc || null, contact: chContact || null } : c))
      setEditingChannelId(null); setChName(''); setChDesc(''); setChContact('')
    })
  }

  function handleChannelToggle(id: string) {
    const ch = channels.find(c => c.id === id)!
    startTransition(async () => {
      await updateDeliveryChannel(id, ch.name, ch.description ?? '', ch.contact ?? '', !ch.is_active)
      setChannels(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c))
    })
  }

  function handleChannelDelete(id: string) {
    if (!confirm('Delete this channel?')) return
    startTransition(async () => {
      await deleteDeliveryChannel(id)
      setChannels(prev => prev.filter(c => c.id !== id))
    })
  }

  function startEditChannel(ch: Channel) {
    setEditingChannelId(ch.id)
    setChName(ch.name)
    setChDesc(ch.description ?? '')
    setChContact(ch.contact ?? '')
    setShowChannelForm(false)
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* ── Delivery Types ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Delivery Types</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Each type has zones; each zone has rates with pricing.</p>
          </div>
          <button
            type="button" onClick={() => setShowTypeForm(p => !p)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            New Type
          </button>
        </div>

        {showTypeForm && (
          <form onSubmit={handleCreateType} className="mb-4 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Type name</label>
                <input autoFocus value={typeName} onChange={e => setTypeName(e.target.value)} required placeholder="e.g. Express Delivery"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Description (optional)</label>
                <input value={typeDesc} onChange={e => setTypeDesc(e.target.value)} placeholder="Brief description"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg disabled:opacity-50">
                {pending ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowTypeForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {types.map(type => (
            <div key={type.id} className={`rounded-2xl border ${type.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-200 dark:border-gray-700'} overflow-hidden`}>
              {/* Type header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 cursor-pointer" onClick={() => setExpandedTypeId(id => id === type.id ? null : type.id)}>
                <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expandedTypeId === type.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{type.name}</p>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${type.is_active ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {type.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  {type.description && <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{type.zones.length} zone{type.zones.length !== 1 ? 's' : ''} · {type.zones.reduce((a, z) => a + z.rates.length, 0)} rates</p>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => handleTypeToggle(type.id, type.is_active)} disabled={pending}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${type.is_active ? 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800' : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}>
                    {type.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" onClick={() => handleTypeDelete(type.id)} disabled={pending} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  </button>
                </div>
              </div>

              {/* Zones */}
              {expandedTypeId === type.id && (
                <div className="px-5 pb-5 pt-3 space-y-3 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
                  {type.zones.map(zone => (
                    <ZoneSection
                      key={zone.id} zone={zone} typeId={type.id}
                      onZoneUpdate={z => handleZoneUpdate(type.id, z)}
                      onZoneDelete={id => handleZoneDelete(type.id, id)}
                      onRateAdd={(zid, r) => handleRateAdd(type.id, zid, r)}
                      onRateUpdate={(zid, r) => handleRateUpdate(type.id, zid, r)}
                      onRateDelete={(zid, rid) => handleRateDelete(type.id, zid, rid)}
                    />
                  ))}

                  {addingLocToTypeId === type.id ? (
                    <form onSubmit={e => handleCreateLocations(e, type.id)} className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Add Location(s)</p>
                        <p className="text-[10px] text-gray-400">Each location becomes a zone. Type a name and press Enter — or enter multiple separated by commas.</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">State / City / Zone name(s)</label>
                        <StateAreaPicker value={locNames} onChange={setLocNames} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Rate name <span className="normal-case font-normal">(optional)</span></label>
                          <input value={locRateName} onChange={e => setLocRateName(e.target.value)}
                            placeholder="Defaults to zone name"
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Price (₦)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
                            <input type="number" min="0" step="50" value={locPrice} onChange={e => setLocPrice(e.target.value)} required
                              placeholder="0"
                              className="w-full pl-7 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Estimated delivery</label>
                          <input value={locDays} onChange={e => setLocDays(e.target.value)}
                            placeholder="e.g. 3–5 days"
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={pending || !locNames.length} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg disabled:opacity-50">
                          {pending ? 'Adding…' : `Add ${locNames.length > 1 ? locNames.length + ' Locations' : 'Location'}`}
                        </button>
                        <button type="button" onClick={() => { setAddingLocToTypeId(null); setLocNames([]); setLocRateName(''); setLocPrice(''); setLocDays('') }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAddingLocToTypeId(type.id); setLocNames([]); setLocRateName(''); setLocPrice(''); setLocDays('') }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Add Location(s)
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Delivery Channels ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Delivery Channels</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Logistics partners and carriers (GUO Motors, DHL, etc.)</p>
          </div>
          <button
            type="button" onClick={() => { setShowChannelForm(p => !p); setEditingChannelId(null); setChName(''); setChDesc(''); setChContact('') }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            New Channel
          </button>
        </div>

        {(showChannelForm || editingChannelId) && (
          <form onSubmit={editingChannelId ? handleChannelSave : handleCreateChannel}
            className="mb-4 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{editingChannelId ? 'Edit Channel' : 'New Channel'}</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Name</label>
                <input autoFocus value={chName} onChange={e => setChName(e.target.value)} required placeholder="e.g. GUO Motors"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Description</label>
                <input value={chDesc} onChange={e => setChDesc(e.target.value)} placeholder="e.g. Long-haul road freight"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Contact / Phone</label>
                <input value={chContact} onChange={e => setChContact(e.target.value)} placeholder="e.g. 0700 4826 000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg disabled:opacity-50">
                {pending ? 'Saving…' : editingChannelId ? 'Update' : 'Add Channel'}
              </button>
              <button type="button" onClick={() => { setShowChannelForm(false); setEditingChannelId(null) }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {channels.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No channels yet — add your first logistics partner above.</div>
          )}
          {channels.map(ch => (
            <div key={ch.id} className={`flex items-center gap-4 px-5 py-3.5 ${!ch.is_active ? 'opacity-50' : ''}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${ch.is_active ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{ch.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {ch.description}{ch.description && ch.contact ? ' · ' : ''}{ch.contact}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => handleChannelToggle(ch.id)} disabled={pending}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${ch.is_active ? 'border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800' : 'border-emerald-200 dark:border-emerald-800 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}>
                  {ch.is_active ? 'Disable' : 'Enable'}
                </button>
                <button type="button" onClick={() => startEditChannel(ch)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                </button>
                <button type="button" onClick={() => handleChannelDelete(ch.id)} disabled={pending} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
