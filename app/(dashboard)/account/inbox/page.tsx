'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  subject: string
  body: string
  sender: 'admin' | 'customer'
  read_at: string | null
  created_at: string
}

export default function InboxPage() {
  const supabase = createClient()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      // Redirect admin/staff to the admin support panel
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const adminRoles = ['super_admin', 'admin', 'manager', 'shop_keeper', 'editor', 'financier']
      if (profile?.role && adminRoles.includes(profile.role)) {
        router.replace('/admin/support')
        return
      }

      setUserId(user.id)

      // Initial load
      supabase
        .from('inbox_messages')
        .select('id, subject, body, sender, read_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          const msgs = (data ?? []) as Message[]
          setMessages(msgs)
          setLoading(false)

          // Mark unread admin messages as read
          const unread = msgs.filter(m => m.sender === 'admin' && !m.read_at).map(m => m.id)
          if (unread.length) {
            supabase
              .from('inbox_messages')
              .update({ read_at: new Date().toISOString() })
              .in('id', unread)
              .then(() =>
                setMessages(prev => prev.map(m => unread.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m))
              )
          }
        })

      // Real-time subscription
      const channel = supabase
        .channel(`inbox:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'inbox_messages', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const msg = payload.new as Message
            setMessages(prev => [...prev, msg])
            // Auto-mark incoming admin messages as read
            if (msg.sender === 'admin') {
              supabase
                .from('inbox_messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', msg.id)
            }
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !userId || sending) return
    setSending(true)
    setText('')
    const { error } = await supabase
      .from('inbox_messages')
      .insert({ user_id: userId, subject: 'Support', body, sender: 'customer' })
    if (error) { setText(body); setSendError('Failed to send. Please try again.') }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Support</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Chat with Ecclesia Hub support</p>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3 min-h-[300px]">
        {loading ? (
          <div className="space-y-3 p-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse ${i % 2 === 0 ? 'w-2/3' : 'w-1/2 ml-auto'}`} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#4A0F1C]/8 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[#4A0F1C] dark:text-[#D4849A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No messages yet</p>
            <p className="text-xs text-gray-400">Send a message and we'll get back to you shortly</p>
          </div>
        ) : (
          messages.map(msg => {
            const isCustomer = msg.sender === 'customer'
            return (
              <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                {!isCustomer && (
                  <div className="w-7 h-7 rounded-full bg-[#4A0F1C] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <span className="text-white text-[10px] font-bold">EH</span>
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isCustomer
                    ? 'bg-[#4A0F1C] text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${isCustomer ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p className="mt-2 text-xs text-red-500 px-1">{sendError}</p>
      )}

      {/* Compose */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={e => { setText(e.target.value); setSendError(null) }}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) } }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="px-4 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-50 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  )
}
