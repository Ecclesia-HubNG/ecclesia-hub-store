'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markMessagesRead } from '@/lib/actions/inbox'

type Message = { id: string; subject: string; body: string; read_at: string | null; created_at: string }

export default function InboxPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('inbox_messages')
        .select('id, subject, body, read_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          const msgs = (data ?? []) as Message[]
          setMessages(msgs)
          setLoading(false)
          const unread = msgs.filter(m => !m.read_at).map(m => m.id)
          if (unread.length) {
            markMessagesRead(unread).then(() =>
              setMessages(prev => prev.map(m => unread.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m))
            )
          }
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inbox</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Messages from Ecclesia Hub</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white dark:bg-gray-900 animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 rounded-full bg-[#4A0F1C]/8 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#4A0F1C] dark:text-[#D4849A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No messages yet</p>
          <p className="text-sm text-gray-400">Order confirmations and updates will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`p-5 rounded-2xl border transition-colors ${
                msg.read_at
                  ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  : 'bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/10 border-[#4A0F1C]/20 dark:border-[#D4849A]/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {!msg.read_at && (
                    <span className="w-2 h-2 rounded-full bg-[#4A0F1C] dark:bg-[#D4849A] shrink-0" />
                  )}
                  <p className={`text-sm font-semibold truncate ${msg.read_at ? 'text-gray-800 dark:text-gray-200' : 'text-[#4A0F1C] dark:text-[#D4849A]'}`}>
                    {msg.subject || '(No subject)'}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
                  {new Date(msg.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {msg.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
