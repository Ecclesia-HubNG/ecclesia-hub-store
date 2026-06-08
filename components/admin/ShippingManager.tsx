'use client'

import { useState, useTransition } from 'react'
import {
  createState, updateState, deleteState,
  createBranch, updateBranch, deleteBranch,
  createLocation, updateLocation, deleteLocation,
  type ShippingState, type ShippingBranch, type ShippingLocation,
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

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}
function IconEdit() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}
function IconCheck({ active }: { active: boolean }) {
  return active ? (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}

// ── Bulk location form ────────────────────────────────────────────────────────

function BulkLocationForm({
  onSave,
  onCancel,
  pending,
}: {
  onSave: (names: string[], price: number) => void
  onCancel: () => void
  pending: boolean
}) {
  const [text, setText] = useState('')
  const [price, setPrice] = useState('')

  const names = text.split(',').map(s => s.trim()).filter(Boolean)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const p = parseFloat(price)
    if (names.length === 0 || isNaN(p) || p < 0) return
    onSave(names, p)
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-dashed border-amber-200 dark:border-amber-800 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
        </svg>
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Bulk add — paste comma-separated location names</p>
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
          Location names <span className="normal-case font-normal text-gray-400">({names.length} detected)</span>
        </label>
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Surulere, Ebute Metta, Fadeyi, Yaba, Orile Coker, Shomolu…"
          rows={3}
          required
          className={`${fieldCls} resize-none`}
        />
        {names.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {names.map((n, i) => (
              <span key={i} className="px-2 py-0.5 text-[11px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300">{n}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-36">
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Shared price (₦)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
            <input
              type="number" min="0" step="50"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="3000"
              required
              className={fieldCls.replace('px-3', 'pl-7 pr-3')}
            />
          </div>
        </div>
        <div className="flex gap-2 pb-0.5">
          <button type="submit" disabled={pending || names.length === 0 || !price}
            className="px-4 py-2 bg-[#4A0F1C] text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-[#3A0B15] transition-colors">
            {pending ? 'Adding…' : `Add ${names.length || ''} location${names.length !== 1 ? 's' : ''}`}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
        </div>
      </div>
    </form>
  )
}

// ── Inline name+price form (for locations) ────────────────────────────────────

function LocationForm({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial?: { name: string; price: number }
  onSave: (name: string, price: number) => void
  onCancel: () => void
  pending: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const p = parseFloat(price)
    if (!name.trim() || isNaN(p) || p < 0) return
    onSave(name.trim(), p)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Location name</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Surulere, Yaba, Lekki Phase 1"
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
        <button type="submit" disabled={pending || !name.trim() || !price}
          className="px-4 py-2 bg-[#4A0F1C] text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-[#3A0B15] transition-colors">
          {pending ? 'Saving…' : initial ? 'Update' : 'Add location'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
      </div>
    </form>
  )
}

// ── Inline name form (for branches) ──────────────────────────────────────────

function NameForm({
  label,
  placeholder,
  initial,
  onSave,
  onCancel,
  pending,
}: {
  label: string
  placeholder: string
  initial?: string
  onSave: (name: string) => void
  onCancel: () => void
  pending: boolean
}) {
  const [name, setName] = useState(initial ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={placeholder}
          required
          className={fieldCls}
        />
      </div>
      <div className="flex gap-2 pb-0.5">
        <button type="submit" disabled={pending || !name.trim()}
          className="px-4 py-2 bg-[#4A0F1C] text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-[#3A0B15] transition-colors">
          {pending ? 'Saving…' : initial ? 'Update' : 'Add'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
      </div>
    </form>
  )
}

// ── Branch section ────────────────────────────────────────────────────────────

function BranchSection({
  branch,
  onBranchUpdated,
  onBranchDeleted,
}: {
  branch: ShippingBranch
  onBranchUpdated: (b: ShippingBranch) => void
  onBranchDeleted: (id: string) => void
}) {
  const [open, setOpen] = useState(branch.locations.length === 0)
  const [editing, setEditing] = useState(false)
  const [addingLoc, setAddingLoc] = useState(branch.locations.length === 0)
  const [bulkAdding, setBulkAdding] = useState(false)
  const [editingLocId, setEditingLocId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleRenameBranch(name: string) {
    startTransition(async () => {
      const res = await updateBranch(branch.id, { name })
      if ('error' in res) return
      onBranchUpdated({ ...branch, name })
      setEditing(false)
    })
  }

  function handleToggleBranch() {
    startTransition(async () => {
      await updateBranch(branch.id, { is_active: !branch.is_active })
      onBranchUpdated({ ...branch, is_active: !branch.is_active })
    })
  }

  function handleDeleteBranch() {
    if (!confirm(`Delete branch "${branch.name}" and all its locations?`)) return
    startTransition(async () => {
      await deleteBranch(branch.id)
      onBranchDeleted(branch.id)
    })
  }

  function handleAddLocation(name: string, price: number) {
    startTransition(async () => {
      const res = await createLocation(branch.id, name, price)
      if ('error' in res) return
      onBranchUpdated({
        ...branch,
        locations: [...branch.locations, { ...res, locations: [] } as unknown as ShippingLocation],
      })
      setAddingLoc(false)
    })
  }

  function handleBulkAdd(names: string[], price: number) {
    startTransition(async () => {
      const created: ShippingLocation[] = []
      for (const name of names) {
        const res = await createLocation(branch.id, name, price)
        if (!('error' in res)) {
          created.push({ ...res, locations: [] } as unknown as ShippingLocation)
        }
      }
      if (created.length > 0) {
        onBranchUpdated({ ...branch, locations: [...branch.locations, ...created] })
      }
      setBulkAdding(false)
    })
  }

  function handleUpdateLocation(loc: ShippingLocation, name: string, price: number) {
    startTransition(async () => {
      const res = await updateLocation(loc.id, { name, price })
      if (res.error) return
      onBranchUpdated({
        ...branch,
        locations: branch.locations.map(l => l.id === loc.id ? { ...l, name, price } : l),
      })
      setEditingLocId(null)
    })
  }

  function handleToggleLocation(loc: ShippingLocation) {
    startTransition(async () => {
      await updateLocation(loc.id, { is_active: !loc.is_active })
      onBranchUpdated({
        ...branch,
        locations: branch.locations.map(l => l.id === loc.id ? { ...l, is_active: !l.is_active } : l),
      })
    })
  }

  function handleDeleteLocation(locId: string) {
    if (!confirm('Delete this location?')) return
    startTransition(async () => {
      await deleteLocation(locId)
      onBranchUpdated({ ...branch, locations: branch.locations.filter(l => l.id !== locId) })
    })
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${branch.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-200 dark:border-gray-700 opacity-60'}`}>
      {/* Branch header */}
      {editing ? (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
          <NameForm
            label="Branch name"
            placeholder="e.g. Lagos Mainland, Lagos Island"
            initial={branch.name}
            onSave={handleRenameBranch}
            onCancel={() => setEditing(false)}
            pending={pending}
          />
        </div>
      ) : (
        <div
          className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer select-none"
          onClick={() => setOpen(p => !p)}
        >
          <IconChevron open={open} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{branch.name}</p>
              {!branch.is_active && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-400 rounded">disabled</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{branch.locations.length} location{branch.locations.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => { setAddingLoc(true); setBulkAdding(false); setOpen(true) }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#4A0F1C] dark:text-[#E8C4CB] bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20 hover:bg-[#4A0F1C]/10 dark:hover:bg-[#4A0F1C]/30 rounded-lg transition-colors">
              <IconPlus /> Add location
            </button>
            <button type="button" onClick={() => { setBulkAdding(true); setAddingLoc(false); setOpen(true) }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg> Bulk add
            </button>
            <button type="button" onClick={() => setEditing(true)} disabled={pending}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <IconEdit />
            </button>
            <button type="button" onClick={handleToggleBranch} disabled={pending}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${branch.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              <IconCheck active={branch.is_active} />
            </button>
            <button type="button" onClick={handleDeleteBranch} disabled={pending}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
              <IconTrash />
            </button>
          </div>
        </div>
      )}

      {/* Locations */}
      {open && (
        <div className="px-3 pb-3 pt-2 space-y-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          {branch.locations.length === 0 && !addingLoc && (
            <p className="px-2 py-3 text-xs text-gray-400 text-center">No locations yet — click "Add location" above.</p>
          )}

          {branch.locations.map(loc =>
            editingLocId === loc.id ? (
              <LocationForm
                key={loc.id}
                initial={{ name: loc.name, price: loc.price }}
                onSave={(n, p) => handleUpdateLocation(loc, n, p)}
                onCancel={() => setEditingLocId(null)}
                pending={pending}
              />
            ) : (
              <div
                key={loc.id}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${loc.is_active ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-800/40 border-dashed border-gray-200 dark:border-gray-700 opacity-60'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">{loc.name}</p>
                  {!loc.is_active && <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mt-0.5">Disabled</p>}
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">{fmt(loc.price)}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => handleToggleLocation(loc)} disabled={pending}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${loc.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <IconCheck active={loc.is_active} />
                  </button>
                  <button type="button" onClick={() => setEditingLocId(loc.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <IconEdit />
                  </button>
                  <button type="button" onClick={() => handleDeleteLocation(loc.id)} disabled={pending}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
                    <IconTrash />
                  </button>
                </div>
              </div>
            )
          )}

          {addingLoc && (
            <LocationForm
              onSave={handleAddLocation}
              onCancel={() => setAddingLoc(false)}
              pending={pending}
            />
          )}

          {bulkAdding && (
            <BulkLocationForm
              onSave={handleBulkAdd}
              onCancel={() => setBulkAdding(false)}
              pending={pending}
            />
          )}

          {!addingLoc && !bulkAdding && branch.locations.length > 0 && (
            <button type="button" onClick={() => setAddingLoc(true)}
              className="flex items-center gap-2 w-full px-4 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <IconPlus /> Add another location
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── State section ─────────────────────────────────────────────────────────────

function StateSection({
  state,
  onStateUpdated,
  onStateDeleted,
}: {
  state: ShippingState
  onStateUpdated: (s: ShippingState) => void
  onStateDeleted: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const [addingBranch, setAddingBranch] = useState(state.branches.length === 0)
  const [pending, startTransition] = useTransition()

  function handleToggleState() {
    startTransition(async () => {
      await updateState(state.id, { is_active: !state.is_active })
      onStateUpdated({ ...state, is_active: !state.is_active })
    })
  }

  function handleDeleteState() {
    if (!confirm(`Delete state "${state.name}" and all its branches and locations?`)) return
    startTransition(async () => {
      await deleteState(state.id)
      onStateDeleted(state.id)
    })
  }

  function handleAddBranch(name: string) {
    startTransition(async () => {
      const res = await createBranch(state.id, name)
      if ('error' in res) return
      onStateUpdated({
        ...state,
        branches: [...state.branches, { ...res, locations: [] }],
      })
      setAddingBranch(false)
    })
  }

  const totalLocations = state.branches.reduce((sum, b) => sum + b.locations.length, 0)

  return (
    <div className={`rounded-2xl border overflow-hidden ${state.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-200 dark:border-gray-700 opacity-70'}`}>
      {/* State header */}
      <div
        className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 cursor-pointer select-none"
        onClick={() => setOpen(p => !p)}
      >
        <IconChevron open={open} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-gray-900 dark:text-white">{state.name}</p>
            {!state.is_active && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-400 rounded">disabled</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {state.branches.length} branch{state.branches.length !== 1 ? 'es' : ''} · {totalLocations} location{totalLocations !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => { setAddingBranch(true); setOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4A0F1C] dark:text-[#E8C4CB] bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20 hover:bg-[#4A0F1C]/10 dark:hover:bg-[#4A0F1C]/30 rounded-lg transition-colors"
          >
            <IconPlus /> Add branch
          </button>
          <button type="button" onClick={handleToggleState} disabled={pending}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${state.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <IconCheck active={state.is_active} />
          </button>
          <button type="button" onClick={handleDeleteState} disabled={pending}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Branches */}
      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
          {state.branches.length === 0 && !addingBranch && (
            <p className="px-2 py-3 text-xs text-gray-400 text-center">No branches yet — click "Add branch" above.</p>
          )}

          {state.branches.map(branch => (
            <BranchSection
              key={branch.id}
              branch={branch}
              onBranchUpdated={updated =>
                onStateUpdated({ ...state, branches: state.branches.map(b => b.id === updated.id ? updated : b) })
              }
              onBranchDeleted={id =>
                onStateUpdated({ ...state, branches: state.branches.filter(b => b.id !== id) })
              }
            />
          ))}

          {addingBranch && (
            <NameForm
              label="Branch name"
              placeholder="e.g. Lagos Mainland, Lagos Island"
              onSave={handleAddBranch}
              onCancel={() => setAddingBranch(false)}
              pending={pending}
            />
          )}

          {!addingBranch && state.branches.length > 0 && (
            <button type="button" onClick={() => setAddingBranch(true)}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <IconPlus /> Add another branch
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── State picker dropdown ─────────────────────────────────────────────────────

function StatePicker({
  existing,
  onSelect,
  onClose,
}: {
  existing: string[]
  onSelect: (name: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const alreadySet = new Set(existing.map(s => s.toLowerCase()))
  const filtered = NG_STATES.filter(
    s => s.toLowerCase().includes(search.toLowerCase()) && !alreadySet.has(s.toLowerCase())
  )

  return (
    <div className="absolute top-full right-0 mt-2 w-72 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search states…"
          className={fieldCls}
          onKeyDown={e => e.key === 'Escape' && onClose()}
        />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">No states left to add</p>
        )}
        {filtered.map(state => (
          <button
            key={state}
            type="button"
            onClick={() => { onSelect(state); onClose() }}
            className="w-full flex items-center px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            {state}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ShippingManager({ states: initial }: { states: ShippingState[] }) {
  const [states, setStates] = useState(initial)
  const [showPicker, setShowPicker] = useState(false)
  const [pending, startTransition] = useTransition()

  const existingNames = states.map(s => s.name)

  function handleSelectState(name: string) {
    startTransition(async () => {
      const res = await createState(name)
      if ('error' in res) return
      setStates(prev => [...prev, { ...res, branches: [] }].sort((a, b) => a.name.localeCompare(b.name)))
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Shipping</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Add states → branches (e.g. Lagos Mainland) → locations with prices.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            disabled={pending}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 transition-colors"
          >
            <IconPlus /> Add State
          </button>
          {showPicker && (
            <StatePicker
              existing={existingNames}
              onSelect={handleSelectState}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      </div>

      {/* State sections */}
      {states.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No states added yet</p>
          <p className="text-xs text-gray-400">Click "Add State" to start configuring shipping.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {states.map(state => (
            <StateSection
              key={state.id}
              state={state}
              onStateUpdated={updated => setStates(prev => prev.map(s => s.id === updated.id ? updated : s))}
              onStateDeleted={id => setStates(prev => prev.filter(s => s.id !== id))}
            />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">How this works</p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Customers select their <strong>state</strong> → then their <strong>branch</strong> → then their <strong>location</strong> with the delivery price.</li>
          <li>Disabling a state, branch, or location hides it from checkout without deleting it.</li>
          <li>Deleting a state removes all its branches and locations.</li>
        </ul>
      </div>
    </div>
  )
}
