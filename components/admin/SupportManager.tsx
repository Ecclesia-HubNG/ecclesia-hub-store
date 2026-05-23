'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { adminReply, markConversationRead } from '@/lib/actions/inbox'

type Attachment = { type: 'order' | 'product'; id: string; label: string; slug?: string }

type Msg = {
  id: string
  user_id: string
  subject: string
  body: string
  sender: 'admin' | 'customer'
  read_at: string | null
  created_at: string
  attachment?: Attachment | null
}

type Conversation = {
  userId: string
  name: string
  email: string
  messages: Msg[]
  hasUnread: boolean
  lastAt: string
}

export function SupportManager({ conversations: initial }: { conversations: Conversation[] }) {
  const supabase = createClient()
  const [convs, setConvs] = useState(initial)
  const [selected, setSelected] = useState<string | null>(initial[0]?.userId ?? null)
  const [reply, setReply] = useState('')
  const [pending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeConv = convs.find(c => c.userId === selected)

  // Real-time: listen for new messages across all conversations
  useEffect(() => {
    const channel = supabase
      .channel('admin-support')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inbox_messages' },
        (payload) => {
          const msg = payload.new as Msg
          setConvs(prev => {
            const idx = prev.findIndex(c => c.userId === msg.user_id)
            if (idx === -1) {
              // New conversation
              return [{
                userId: msg.user_id,
                name: msg.user_id,
                email: '',
                messages: [msg],
                hasUnread: msg.sender === 'customer',
                lastAt: msg.created_at,
              }, ...prev]
            }
            const updated = [...prev]
            updated[idx] = {
              ...updated[idx],
              messages: [...updated[idx].messages, msg],
              hasUnread: updated[idx].hasUnread || (msg.sender === 'customer'),
              lastAt: msg.created_at,
            }
            return updated.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll to bottom when active conversation changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected, activeConv?.messages.length])

  function selectConv(userId: string) {
    setSelected(userId)
    setConvs(prev => prev.map(c => c.userId === userId ? { ...c, hasUnread: false } : c))
    markConversationRead(userId)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = reply.trim()
    if (!body || !selected) return
    setReply('')
    startTransition(async () => {
      const res = await adminReply(selected, body)
      if (res.error) setReply(body)
    })
  }

  return (
    <div className="flex gap-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden" style={{ height: 'calc(100vh - 10rem)' }}>

      {/* Sidebar — conversation list */}
      <aside className="w-72 shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Support</h1>
          <p className="text-xs text-gray-400 mt-0.5">{convs.length} conversation{convs.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convs.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-400">No conversations yet</p>
            </div>
          ) : convs.map(conv => (
            <button
              key={conv.userId}
              type="button"
              onClick={() => selectConv(conv.userId)}
              className={`w-full text-left px-5 py-3.5 border-b border-gray-50 dark:border-gray-800/60 transition-colors ${
                selected === conv.userId
                  ? 'bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/15'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">{conv.name}</span>
                {conv.hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-[#4A0F1C] dark:bg-[#D4849A] shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">{conv.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(conv.lastAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat panel */}
      {selected && activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{activeConv.name}</p>
            <p className="text-xs text-gray-400">{activeConv.email}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {activeConv.messages.map(msg => {
              const isAdmin = msg.sender === 'admin'
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  {!isAdmin && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <span className="text-gray-600 dark:text-gray-300 text-[10px] font-bold">
                        {activeConv.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[72%] rounded-2xl text-sm leading-relaxed overflow-hidden ${
                    isAdmin
                      ? 'bg-[#4A0F1C] text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                  }`}>
                    <div className="px-4 py-2.5">
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${isAdmin ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{new Date(msg.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    {msg.attachment && (
                      <a
                        href={
                          msg.attachment.type === 'order'
                            ? `/admin/orders/${msg.attachment.id}`
                            : `/product/${msg.attachment.slug ?? msg.attachment.id}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 border-t text-xs font-medium transition-opacity hover:opacity-80 ${
                          isAdmin
                            ? 'border-white/20 text-white/80 bg-white/10'
                            : 'border-gray-200 dark:border-gray-700 text-[#4A0F1C] dark:text-[#D4849A] bg-white dark:bg-gray-900'
                        }`}
                      >
                        {msg.attachment.type === 'order' ? (
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                          </svg>
                        )}
                        <span className="truncate">{msg.attachment.label}</span>
                        <svg className="w-3 h-3 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          <form onSubmit={handleSend} className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Reply…"
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) } }}
            />
            <button
              type="submit"
              disabled={!reply.trim() || pending}
              className="px-4 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-50 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Select a conversation</p>
        </div>
      )}
    </div>
  )
}
