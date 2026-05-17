'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { updateUserName, setUserRole, setUserBanned, deleteUser } from '@/lib/actions/users'
import { ROLES, ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS, assignableRoles } from '@/lib/roles'

type AuthUser = {
  id: string
  email?: string
  created_at: string
  last_sign_in_at?: string | null
  email_confirmed_at?: string | null
  banned_until?: string | null
  user_metadata: { full_name?: string }
  app_metadata: { role?: string }
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function isBanned(user: AuthUser) {
  if (!user.banned_until) return false
  return new Date(user.banned_until) > new Date()
}

// ── Row action menu ──────────────────────────────────────────────────────────
function ActionMenu({ user, currentUserRole, onEdit, onDelete }: {
  user: AuthUser
  currentUserRole: string
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({ top: 0, right: 0 })
  const [, startTransition] = useTransition()
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const banned = isBanned(user)
  const canAssign = assignableRoles(currentUserRole)

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuStyle({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setRoleOpen(false)
    setOpen(p => !p)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) { setOpen(false); setRoleOpen(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative">
      <button ref={btnRef} type="button" onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
        </svg>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setRoleOpen(false) }} />
          <div ref={menuRef} className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1 overflow-hidden" style={{ ...menuStyle, width: roleOpen ? 220 : 192 }}>

            {/* Edit name */}
            <button type="button" onClick={() => { setOpen(false); onEdit() }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
              Edit name
            </button>

            {/* Change role — expands inline */}
            {canAssign.length > 0 && (
              <>
                <button type="button" onClick={() => setRoleOpen(p => !p)}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
                  </svg>
                  <span className="flex-1 text-left">Change role</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${roleOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {roleOpen && (
                  <div className="mx-2 mb-1 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {canAssign.map(r => {
                      const active = user.app_metadata?.role === r
                      return (
                        <button key={r} type="button"
                          onClick={() => {
                            setOpen(false); setRoleOpen(false)
                            startTransition(() => setUserRole(user.id, r))
                          }}
                          className={`flex items-start gap-2.5 w-full px-3 py-2.5 text-left transition-colors ${active ? 'bg-gray-50 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                        >
                          <span className={`mt-0.5 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${ROLE_COLORS[r]}`}>
                            {r === 'super_admin' ? 'SA' : r === 'shop_keeper' ? 'SK' : ROLE_LABELS[r].slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className={`text-xs font-semibold ${active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {ROLE_LABELS[r]}
                              {active && <span className="ml-1.5 text-[10px] font-normal text-gray-400">current</span>}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{ROLE_DESCRIPTIONS[r]}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

            {/* Ban / Unban */}
            <button type="button"
              onClick={() => { setOpen(false); startTransition(() => setUserBanned(user.id, !banned)) }}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm transition-colors ${banned ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {banned
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                }
              </svg>
              {banned ? 'Unblock user' : 'Block user'}
            </button>

            {/* Delete */}
            <button type="button" onClick={() => { setOpen(false); onDelete() }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Delete user
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(user.user_metadata?.full_name ?? '')
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateUserName(user.id, name.trim())
      setDone(true)
      setTimeout(onClose, 800)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit user</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
            <p className="text-sm text-gray-700 dark:text-gray-300 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition-colors"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${done ? 'bg-green-600 text-white' : 'bg-[#4A0F1C] hover:bg-[#3A0B15] text-white disabled:opacity-50'}`}
            >
              {done ? '✓ Saved' : pending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'this user'

  function handleDelete() {
    startTransition(async () => {
      await deleteUser(user.id)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-1">Delete user?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span> will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {pending ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'active' | 'blocked' | 'unverified'
type RoleFilter = 'all' | 'no_role' | string

export default function UsersManager({ users: initial, currentUserRole }: { users: AuthUser[], currentUserRole: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [showStatusDd, setShowStatusDd] = useState(false)
  const [showRoleDd, setShowRoleDd] = useState(false)
  const [editUser, setEditUser] = useState<AuthUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null)

  const filtered = useMemo(() => initial.filter(u => {
    const banned = isBanned(u)
    const confirmed = !!u.email_confirmed_at
    const role = u.app_metadata?.role ?? ''
    if (statusFilter === 'active' && banned) return false
    if (statusFilter === 'blocked' && !banned) return false
    if (statusFilter === 'unverified' && confirmed) return false
    if (roleFilter === 'no_role' && role) return false
    if (roleFilter !== 'all' && roleFilter !== 'no_role' && role !== roleFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (u.user_metadata?.full_name ?? '').toLowerCase()
      const email = (u.email ?? '').toLowerCase()
      if (!name.includes(q) && !email.includes(q)) return false
    }
    return true
  }), [initial, search, statusFilter, roleFilter])

  const stats = [
    { label: 'Total users', value: initial.length },
    { label: 'Staff', value: initial.filter(u => ROLES.includes(u.app_metadata?.role as any)).length, accent: true },
    { label: 'Active', value: initial.filter(u => !isBanned(u)).length },
    { label: 'Blocked', value: initial.filter(u => isBanned(u)).length, warn: true },
  ]

  const statusLabels: Record<StatusFilter, string> = { all: 'All statuses', active: 'Active', blocked: 'Blocked', unverified: 'Unverified' }
  const roleFilterOptions: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All roles' },
    ...ROLES.map(r => ({ value: r, label: ROLE_LABELS[r] })),
    { value: 'no_role', label: 'No role' },
  ]

  return (
    <div>
      {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} />}
      {deleteTarget && <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{initial.length} registered</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.warn ? 'text-red-500' : s.accent ? 'text-[#6B1A2A] dark:text-[#D4849A]' : 'text-gray-900 dark:text-white'}`}>{s.value}</p>
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
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Status dropdown */}
        <div className="relative">
          {showStatusDd && <div className="fixed inset-0 z-10" onClick={() => setShowStatusDd(false)} />}
          <button type="button" onClick={() => { setShowStatusDd(p => !p); setShowRoleDd(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${statusFilter !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {statusLabels[statusFilter]}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showStatusDd && (
            <div className="absolute left-0 top-full mt-1 z-20 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1">
              {(['all', 'active', 'blocked', 'unverified'] as StatusFilter[]).map(s => (
                <button key={s} type="button" onClick={() => { setStatusFilter(s); setShowStatusDd(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${statusFilter === s ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {statusLabels[s]}
                  {statusFilter === s && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Role dropdown */}
        <div className="relative">
          {showRoleDd && <div className="fixed inset-0 z-10" onClick={() => setShowRoleDd(false)} />}
          <button type="button" onClick={() => { setShowRoleDd(p => !p); setShowStatusDd(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${roleFilter !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            {roleFilterOptions.find(o => o.value === roleFilter)?.label ?? 'All roles'}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showRoleDd && (
            <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1">
              {roleFilterOptions.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => { setRoleFilter(value); setShowRoleDd(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors ${roleFilter === value ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  {label}
                  {roleFilter === value && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                </button>
              ))}
            </div>
          )}
        </div>

        {(search || statusFilter !== 'all' || roleFilter !== 'all') && (
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setRoleFilter('all') }}
              className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400">{initial.length === 0 ? 'No users yet.' : 'No users match your filters.'}</p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Last sign in</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filtered.map(user => {
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown'
                const role = user.app_metadata?.role ?? ''
                const isStaff = ROLES.includes(role as any)
                const confirmed = !!user.email_confirmed_at
                const banned = isBanned(user)

                return (
                  <tr key={user.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${banned ? 'opacity-60' : ''}`}>
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isStaff ? 'bg-[#4A0F1C] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                          {getInitials(name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white leading-tight">
                            {name}
                            {banned && <span className="ml-2 text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-full">Blocked</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {isStaff ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}>
                          {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          No role
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {banned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Blocked
                        </span>
                      ) : confirmed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Last sign in */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-gray-300 dark:text-gray-600">Never</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-right">
                      <ActionMenu user={user} currentUserRole={currentUserRole} onEdit={() => setEditUser(user)} onDelete={() => setDeleteTarget(user)} />
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
