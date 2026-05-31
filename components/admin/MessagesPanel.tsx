'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type ConvRow = {
  userId: string
  name: string
  preview: string
  unread: boolean
  time: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs  < 24) return `${hrs}h ago`
  return `${days}d ago`
}

export function MessagesPanel() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [convs, setConvs] = useState<ConvRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    const supabase = createClient()
    const { count } = await supabase
      .from('inbox_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender', 'customer')
      .is('read_at', null)
    setUnreadCount(count ?? 0)
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const supabase = createClient()
    const channel = supabase
      .channel('messages-panel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_messages' }, (payload) => {
        if ((payload.new as any).sender === 'customer') fetchUnreadCount()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inbox_messages' }, () => {
        fetchUnreadCount()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchUnreadCount])

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: messages } = await supabase
      .from('inbox_messages')
      .select('id, user_id, body, sender, read_at, created_at')
      .eq('sender', 'customer')
      .order('created_at', { ascending: false })
      .limit(60)

    if (!messages) { setLoading(false); return }

    const userIds = Array.from(new Set(messages.map(m => m.user_id)))
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
      : { data: [] }

    const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))

    const byUser: Record<string, (typeof messages)[0]> = {}
    for (const msg of messages) {
      if (!byUser[msg.user_id]) byUser[msg.user_id] = msg
    }

    const convList: ConvRow[] = Object.values(byUser)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(msg => ({
        userId: msg.user_id,
        name: nameMap[msg.user_id] ?? 'Customer',
        preview: msg.body.length > 55 ? msg.body.slice(0, 55) + '…' : msg.body,
        unread: !msg.read_at,
        time: msg.created_at,
      }))

    setConvs(convList)
    setLoading(false)
    setLoaded(true)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { const next = !open; setOpen(next); if (next && !loaded) load() }}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#6B1A2A] rounded-full ring-2 ring-white dark:ring-[#111111]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Support messages</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-white bg-[#6B1A2A] px-2 py-0.5 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-px">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-4 py-3 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-0.5">
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : convs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No messages yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Customer messages will appear here</p>
              </div>
            ) : (
              convs.map((conv, i) => (
                <Link
                  key={conv.userId}
                  href="/admin/support"
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${i > 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-gray-600 dark:text-gray-300 text-[10px] font-bold">
                      {conv.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.name}</p>
                      {conv.unread && <span className="w-2 h-2 rounded-full bg-[#4A0F1C] dark:bg-[#D4849A] shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.preview}</p>
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{timeAgo(conv.time)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-white/10 px-4 py-2.5">
            <Link
              href="/admin/support"
              onClick={() => setOpen(false)}
              className="text-xs text-[#6B1A2A] dark:text-[#D4849A] hover:underline"
            >
              Open support inbox →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
