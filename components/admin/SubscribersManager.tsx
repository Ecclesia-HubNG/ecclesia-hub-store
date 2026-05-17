'use client'

import { useState, useTransition, useRef } from 'react'
import { addSubscriber, removeSubscriber, setSubscriberStatus, bulkImportSubscribers } from '@/lib/actions/email-subscribers'

type Subscriber = {
  id: string
  email: string
  name: string | null
  status: 'active' | 'unsubscribed'
  source: string
  subscribed_at: string
}

export default function SubscribersManager({ subscribers: initial }: { subscribers: Subscriber[] }) {
  const [subscribers, setSubscribers] = useState(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Add form
  const [addEmail, setAddEmail] = useState('')
  const [addName, setAddName] = useState('')
  const [addError, setAddError] = useState('')
  const [addPending, startAdd] = useTransition()

  // Import
  const [importPending, startImport] = useTransition()
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Inline actions
  const [actionPending, startAction] = useTransition()

  const active = subscribers.filter(s => s.status === 'active').length
  const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length

  const filtered = subscribers.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.email.toLowerCase().includes(q) && !(s.name ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addEmail.trim()) return
    setAddError('')
    startAdd(async () => {
      const res = await addSubscriber(addEmail, addName || undefined)
      if (res.error) { setAddError(res.error); return }
      setSubscribers(prev => {
        const existing = prev.find(s => s.email === addEmail.trim().toLowerCase())
        if (existing) return prev.map(s => s.email === addEmail.trim().toLowerCase() ? { ...s, status: 'active' } : s)
        return [{ id: crypto.randomUUID(), email: addEmail.trim().toLowerCase(), name: addName.trim() || null, status: 'active', source: 'manual', subscribed_at: new Date().toISOString() }, ...prev]
      })
      setAddEmail('')
      setAddName('')
    })
  }

  async function handleToggleStatus(sub: Subscriber) {
    const next = sub.status === 'active' ? 'unsubscribed' : 'active'
    startAction(async () => {
      await setSubscriberStatus(sub.id, next)
      setSubscribers(prev => prev.map(s => s.id === sub.id ? { ...s, status: next } : s))
    })
  }

  async function handleRemove(id: string) {
    startAction(async () => {
      await removeSubscriber(id)
      setSubscribers(prev => prev.filter(s => s.id !== id))
    })
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      // Skip header row if it looks like one
      const start = lines[0]?.toLowerCase().includes('email') ? 1 : 0
      const rows: { email: string; name?: string }[] = []
      for (const line of lines.slice(start)) {
        const [email, name] = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
        if (email && email.includes('@')) rows.push({ email, name: name || undefined })
      }
      if (rows.length === 0) { setImportMsg('No valid emails found in file.'); return }
      setImportMsg('')
      startImport(async () => {
        const res = await bulkImportSubscribers(rows)
        if (res.error) { setImportMsg(`Error: ${res.error}`); return }
        setImportMsg(`Imported ${res.count} subscriber${res.count !== 1 ? 's' : ''}.`)
        setSubscribers(prev => {
          const map = new Map(prev.map(s => [s.email, s]))
          for (const r of rows) {
            const email = r.email.toLowerCase()
            if (map.has(email)) { map.set(email, { ...map.get(email)!, status: 'active' }) }
            else map.set(email, { id: crypto.randomUUID(), email, name: r.name ?? null, status: 'active', source: 'import', subscribed_at: new Date().toISOString() })
          }
          return Array.from(map.values())
        })
      })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const inputCls = 'px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Subscribers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subscribers.length} total · {active} active · {unsubscribed} unsubscribed
          </p>
        </div>
      </div>

      {/* Add + Import */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Add subscriber</h2>
        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email <span className="text-red-400">*</span></label>
            <input type="email" required value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="user@example.com" className={inputCls + ' w-full'} />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Name (optional)</label>
            <input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Full name" className={inputCls + ' w-full'} />
          </div>
          <button
            type="submit"
            disabled={addPending || !addEmail.trim()}
            className="px-4 py-2.5 text-sm font-semibold bg-[#4A0F1C] hover:bg-[#3A0B15] text-white rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {addPending ? 'Adding…' : 'Add subscriber'}
          </button>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importPending}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {importPending ? 'Importing…' : 'Import CSV'}
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileImport} className="hidden" />
          </div>
        </form>
        {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
        {importMsg && <p className={`text-xs mt-2 ${importMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>{importMsg}</p>}
        <p className="text-xs text-gray-400 mt-2">CSV format: <code className="font-mono">email,name</code> (one per line, header row optional)</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email or name…"
          className={`${inputCls} w-64`}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">{subscribers.length === 0 ? 'No subscribers yet. Add one above.' : 'No subscribers match your filters.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Source</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Subscribed</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filtered.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{sub.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{sub.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${sub.status === 'active' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                      {sub.status === 'active' ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 capitalize">{sub.source}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(sub.subscribed_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        disabled={actionPending}
                        onClick={() => handleToggleStatus(sub)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 disabled:opacity-50"
                      >
                        {sub.status === 'active' ? 'Unsubscribe' : 'Re-subscribe'}
                      </button>
                      <button
                        type="button"
                        disabled={actionPending}
                        onClick={() => handleRemove(sub.id)}
                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 underline underline-offset-2 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
