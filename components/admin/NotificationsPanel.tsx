'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Notification = {
  id: string
  type: 'order' | 'stock'
  title: string
  sub: string
  time: string
  href: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(true)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [{ data: orders }, { data: lowStock }] = await Promise.all([
      supabase.from('orders').select('id, status, total, created_at').eq('status', 'pending').gte('created_at', since).order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id, name, stock').lte('stock', 5).order('stock').limit(5),
    ])

    const notifications: Notification[] = [
      ...(orders ?? []).map(o => ({
        id: `order-${o.id}`,
        type: 'order' as const,
        title: `New order #${o.id.slice(0, 8).toUpperCase()}`,
        sub: `${Number(o.total).toLocaleString('en', { minimumFractionDigits: 2 })} · pending`,
        time: timeAgo(o.created_at),
        href: '/admin/orders',
      })),
      ...(lowStock ?? []).map(p => ({
        id: `stock-${p.id}`,
        type: 'stock' as const,
        title: p.name,
        sub: p.stock === 0 ? 'Out of stock' : `Only ${p.stock} left`,
        time: '',
        href: '/admin/products',
      })),
    ]

    setItems(notifications)
    setLoading(false)
  }, [])

  function handleOpen() {
    if (!open) fetchNotifications()
    setOpen(o => !o)
    setUnread(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#6B1A2A] rounded-full ring-2 ring-white dark:ring-[#111111]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {items.length > 0 && (
              <span className="text-xs font-medium text-white bg-[#6B1A2A] px-2 py-0.5 rounded-full">{items.length}</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <svg className="w-5 h-5 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : !items.length ? (
              <div className="text-center py-10">
                <svg className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <p className="text-sm text-gray-400">All caught up</p>
              </div>
            ) : (
              items.map((item, i) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${i > 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'order' ? 'bg-blue-50 dark:bg-blue-950/40' : 'bg-amber-50 dark:bg-amber-950/40'
                  }`}>
                    {item.type === 'order' ? (
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                    <p className={`text-xs mt-0.5 ${item.type === 'stock' && item.sub === 'Out of stock' ? 'text-red-500' : 'text-gray-400'}`}>
                      {item.sub}
                    </p>
                  </div>
                  {item.time && <span className="text-xs text-gray-300 dark:text-gray-600 shrink-0 mt-0.5">{item.time}</span>}
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-white/10 px-4 py-2.5">
            <Link href="/admin/orders" onClick={() => setOpen(false)} className="text-xs text-[#6B1A2A] dark:text-[#D4849A] hover:underline">
              View all orders →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
