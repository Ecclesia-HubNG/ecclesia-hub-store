'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { updateCustomer, setCustomerBlocked, setCustomerArchived, deleteCustomer } from '@/lib/actions/customers'

type Customer = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  shipping_address: unknown
  is_blocked: boolean
  is_archived: boolean
  notes: string | null
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

// ── Row action menu ──────────────────────────────────────────────────────────
function ActionMenu({ customer, onEdit, onDelete }: {
  customer: Customer
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({ top: 0, right: 0 })
  const [, startTransition] = useTransition()
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuStyle({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen(p => !p)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
        </svg>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div ref={menuRef} className="fixed z-50 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1 overflow-hidden" style={menuStyle}>
          {/* Edit */}
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit() }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            Edit customer
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

          {/* Archive / Unarchive */}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              startTransition(() => setCustomerArchived(customer.id, !customer.is_archived))
            }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            {customer.is_archived ? 'Unarchive' : 'Archive'}
          </button>

          {/* Block / Unblock */}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              startTransition(() => setCustomerBlocked(customer.id, !customer.is_blocked))
            }}
            className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm transition-colors ${customer.is_blocked ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {customer.is_blocked ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              )}
            </svg>
            {customer.is_blocked ? 'Unblock' : 'Block'}
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

          {/* Delete */}
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete() }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            Delete
          </button>
        </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [name, setName] = useState(customer.full_name ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [notes, setNotes] = useState(customer.notes ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('id', customer.id)
    fd.set('full_name', name.trim())
    fd.set('email', email.trim())
    fd.set('phone', phone.trim())
    fd.set('notes', notes.trim())
    startTransition(async () => {
      await updateCustomer(fd)
      setDone(true)
      setTimeout(onClose, 800)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit customer</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Admin notes <span className="font-normal text-gray-400">(internal)</span></label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes about this customer…"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition-colors resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={pending}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${done ? 'bg-green-600 text-white' : 'bg-[#4A0F1C] hover:bg-[#3A0B15] text-white disabled:opacity-50'}`}>
              {done ? '✓ Saved' : pending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const name = customer.full_name || customer.email?.split('@')[0] || 'this customer'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-1">Delete customer?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span> will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="button" disabled={pending}
            onClick={() => startTransition(async () => { await deleteCustomer(customer.id); onClose() })}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50">
            {pending ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'active' | 'blocked' | 'archived'

export function CustomersManager({ customers, orderCustomerIds }: {
  customers: Customer[]
  orderCustomerIds: string[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [showStatusDd, setShowStatusDd] = useState(false)
  const [showOrdersDd, setShowOrdersDd] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const orderSet = useMemo(() => new Set(orderCustomerIds), [orderCustomerIds])

  const filtered = useMemo(() => customers.filter(c => {
    if (statusFilter === 'active' && (c.is_blocked || c.is_archived)) return false
    if (statusFilter === 'blocked' && !c.is_blocked) return false
    if (statusFilter === 'archived' && !c.is_archived) return false
    if (ordersFilter === 'yes' && !orderSet.has(c.id)) return false
    if (ordersFilter === 'no' && orderSet.has(c.id)) return false
    if (search) {
      const q = search.toLowerCase()
      if (!(c.full_name ?? '').toLowerCase().includes(q) && !(c.email ?? '').toLowerCase().includes(q)) return false
    }
    return true
  }), [customers, statusFilter, ordersFilter, orderSet, search])

  const stats = [
    { label: 'Total customers', value: customers.length },
    { label: 'Has orders', value: customers.filter(c => orderSet.has(c.id)).length },
    { label: 'Archived', value: customers.filter(c => c.is_archived).length },
    { label: 'Blocked', value: customers.filter(c => c.is_blocked).length, warn: true },
  ]

  const statusLabels: Record<StatusFilter, string> = { all: 'All customers', active: 'Active', blocked: 'Blocked', archived: 'Archived' }
  const ordersLabels = { all: 'All orders', yes: 'Has orders', no: 'No orders' }

  return (
    <div>
      {editTarget && <EditModal customer={editTarget} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteModal customer={deleteTarget} onClose={() => setDeleteTarget(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{customers.length} total</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.warn ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative w-64 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Status */}
        <div className="relative">
          {showStatusDd && <div className="fixed inset-0 z-10" onClick={() => setShowStatusDd(false)} />}
          <button type="button" onClick={() => { setShowStatusDd(p => !p); setShowOrdersDd(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${statusFilter !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {statusLabels[statusFilter]}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showStatusDd && (
            <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1">
              {(['all', 'active', 'blocked', 'archived'] as StatusFilter[]).map(s => (
                <button key={s} type="button" onClick={() => { setStatusFilter(s); setShowStatusDd(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm capitalize transition-colors ${statusFilter === s ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {statusLabels[s]}
                  {statusFilter === s && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="relative">
          {showOrdersDd && <div className="fixed inset-0 z-10" onClick={() => setShowOrdersDd(false)} />}
          <button type="button" onClick={() => { setShowOrdersDd(p => !p); setShowStatusDd(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${ordersFilter !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {ordersLabels[ordersFilter]}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showOrdersDd && (
            <div className="absolute left-0 top-full mt-1 z-20 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1">
              {(['all', 'yes', 'no'] as const).map(v => (
                <button key={v} type="button" onClick={() => { setOrdersFilter(v); setShowOrdersDd(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${ordersFilter === v ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {ordersLabels[v]}
                  {ordersFilter === v && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        {(search || statusFilter !== 'all' || ordersFilter !== 'all') && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setOrdersFilter('all') }}
              className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors">Clear</button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400">{customers.length === 0 ? 'No customers yet.' : 'No customers match your filters.'}</p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filtered.map(c => {
                const name = c.full_name || c.email?.split('@')[0] || 'Unknown'
                const address = c.shipping_address as { city?: string; state?: string } | null
                const hasOrder = orderSet.has(c.id)

                return (
                  <tr key={c.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${(c.is_blocked || c.is_archived) ? 'opacity-60' : ''}`}>
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E8C4CB] dark:bg-[#4A0F1C]/40 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#4A0F1C] dark:text-[#D4849A]">{getInitials(name)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white leading-tight">{name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {c.phone ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {address?.city ? `${address.city}${address.state ? `, ${address.state}` : ''}` : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3">
                      {hasOrder
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Has orders</span>
                        : <span className="text-xs text-gray-400 dark:text-gray-600">No orders</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {c.is_blocked
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Blocked</span>
                        : c.is_archived
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Archived</span>
                        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Active</span>}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-right">
                      <ActionMenu customer={c} onEdit={() => setEditTarget(c)} onDelete={() => setDeleteTarget(c)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
