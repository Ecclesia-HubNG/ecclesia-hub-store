'use client'

import { useState } from 'react'

type Log = {
  id: string
  type: string
  to_email: string
  subject: string
  status: 'sent' | 'failed'
  error: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  order_confirmation: 'Order Confirmation',
  order_shipped:      'Order Shipped',
  welcome:            'Welcome',
  promo:              'Promo Blast',
  newsletter:         'Newsletter',
  staff_invite:       'Staff Invite',
  password_reset:     'Password Reset',
}

const TYPE_COLOR: Record<string, string> = {
  order_confirmation: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  order_shipped:      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  welcome:            'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  promo:              'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  newsletter:         'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400',
  staff_invite:       'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400',
  password_reset:     'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
}

const ALL_TYPES = ['newsletter', 'promo', 'order_confirmation', 'order_shipped', 'welcome', 'staff_invite', 'password_reset']

export default function EmailLogs({ logs: initialLogs }: { logs: Log[] }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = initialLogs.filter(log => {
    if (typeFilter !== 'all' && log.type !== typeFilter) return false
    if (statusFilter !== 'all' && log.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!log.to_email.toLowerCase().includes(q) && !log.subject.toLowerCase().includes(q)) return false
    }
    return true
  })

  const sentCount = initialLogs.filter(l => l.status === 'sent').length
  const failedCount = initialLogs.filter(l => l.status === 'failed').length

  const inputCls = 'px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Email Logs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {initialLogs.length} total · {sentCount} sent · {failedCount} failed
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search subject or recipient…"
          className={`${inputCls} w-64`}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={inputCls}>
          <option value="all">All types</option>
          {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls}>
          <option value="all">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        {(typeFilter !== 'all' || statusFilter !== 'all' || search) && (
          <button type="button" onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearch('') }} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-2">
            Clear filters
          </button>
        )}
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">{initialLogs.length === 0 ? 'No emails sent yet.' : 'No emails match your filters.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Recipient(s)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${TYPE_COLOR[log.type] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {TYPE_LABEL[log.type] ?? log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{log.subject}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">{log.to_email}</td>
                  <td className="px-4 py-3">
                    {log.status === 'sent' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500" title={log.error ?? ''}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' '}
                    {new Date(log.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
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
