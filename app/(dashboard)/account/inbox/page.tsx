'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Attachment = { type: 'order' | 'product'; id: string; label: string; slug?: string }

type Message = {
  id: string
  subject: string
  body: string
  sender: 'admin' | 'customer'
  read_at: string | null
  created_at: string
  attachment?: Attachment | null
}

type Order = { id: string; status: string; total: number; created_at: string }

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

  // Attachment state
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [showAttachPicker, setShowAttachPicker] = useState(false)
  const [attachTab, setAttachTab] = useState<'order' | 'product'>('order')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [productUrl, setProductUrl] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

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

      supabase
        .from('inbox_messages')
        .select('id, subject, body, sender, read_at, created_at, attachment')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          const msgs = (data ?? []) as Message[]
          setMessages(msgs)
          setLoading(false)

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

      const channel = supabase
        .channel(`inbox:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'inbox_messages', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const msg = payload.new as Message
            setMessages(prev => [...prev, msg])
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load orders when attaching
  useEffect(() => {
    if (showAttachPicker && attachTab === 'order' && orders.length === 0 && userId) {
      setOrdersLoading(true)
      supabase
        .from('orders')
        .select('id, status, total, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          setOrders((data ?? []) as Order[])
          setOrdersLoading(false)
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAttachPicker, attachTab, userId])

  function handleAttachOrder(order: Order) {
    setAttachment({
      type: 'order',
      id: order.id,
      label: `Order #${order.id.slice(0, 8).toUpperCase()} · ₦${Number(order.total).toLocaleString('en')}`,
    })
    setShowAttachPicker(false)
  }

  function handleAttachProduct() {
    const raw = productUrl.trim()
    if (!raw) return
    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
      const slug = url.pathname.replace(/^\/product\//, '').replace(/\/$/, '')
      if (slug) {
        setAttachment({ type: 'product', id: slug, slug, label: `Product: ${slug}` })
        setProductUrl('')
        setShowAttachPicker(false)
        return
      }
    } catch {}
    // Fallback: treat as label
    setAttachment({ type: 'product', id: raw, slug: raw, label: raw })
    setProductUrl('')
    setShowAttachPicker(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !userId || sending) return
    setSending(true)
    setText('')
    const payload: any = { user_id: userId, subject: 'Support', body, sender: 'customer' }
    if (attachment) payload.attachment = attachment
    const { error } = await supabase.from('inbox_messages').insert(payload)
    if (error) { setText(body); setSendError('Failed to send. Please try again.') }
    else setAttachment(null)
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
                <div className={`max-w-[75%] rounded-2xl text-sm leading-relaxed overflow-hidden ${
                  isCustomer
                    ? 'bg-[#4A0F1C] text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                }`}>
                  <div className="px-4 py-2.5">
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${isCustomer ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(msg.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {msg.attachment && (
                    <a
                      href={
                        msg.attachment.type === 'order'
                          ? '/account/orders'
                          : `/product/${msg.attachment.slug ?? msg.attachment.id}`
                      }
                      className={`flex items-center gap-2 px-4 py-2 border-t text-xs font-medium transition-opacity hover:opacity-80 ${
                        isCustomer
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
                    </a>
                  )}
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

      {/* Attachment picker */}
      {showAttachPicker && (
        <div className="mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {(['order', 'product'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setAttachTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                  attachTab === tab
                    ? 'text-[#4A0F1C] dark:text-[#D4849A] border-b-2 border-[#4A0F1C] dark:border-[#D4849A]'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'order' ? 'My orders' : 'Product link'}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowAttachPicker(false)}
              className="px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3">
            {attachTab === 'order' ? (
              ordersLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No orders found</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {orders.map(order => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleAttachOrder(order)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        ₦{Number(order.total).toLocaleString('en')}
                      </span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="flex gap-2">
                <input
                  value={productUrl}
                  onChange={e => setProductUrl(e.target.value)}
                  placeholder="Paste product URL or name…"
                  className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAttachProduct() } }}
                />
                <button
                  type="button"
                  onClick={handleAttachProduct}
                  disabled={!productUrl.trim()}
                  className="px-3 py-2 bg-[#4A0F1C] text-white text-xs font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-50 transition-colors"
                >
                  Attach
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attached item preview */}
      {attachment && !showAttachPicker && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/15 border border-[#4A0F1C]/20 rounded-xl">
          <svg className="w-3.5 h-3.5 text-[#4A0F1C] dark:text-[#D4849A] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
          <span className="flex-1 text-xs text-[#4A0F1C] dark:text-[#D4849A] font-medium truncate">{attachment.label}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-[#4A0F1C]/60 dark:text-[#D4849A]/60 hover:text-[#4A0F1C] dark:hover:text-[#D4849A]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Compose */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => { setShowAttachPicker(o => !o); setSendError(null) }}
          className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
            showAttachPicker || attachment
              ? 'border-[#4A0F1C]/40 bg-[#4A0F1C]/5 text-[#4A0F1C] dark:text-[#D4849A]'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          title="Attach order or product"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
        </button>
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
