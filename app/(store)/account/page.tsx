'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useWishlist } from '@/lib/wishlist-context'
import ProductCard from '@/components/store/ProductCard'
import { markMessagesRead } from '@/lib/actions/inbox'

type Tab = 'signin' | 'signup' | 'forgot'
type AccountTab = 'orders' | 'wishlist' | 'inbox'
type InboxMessage = { id: string; subject: string; body: string; read_at: string | null; created_at: string }

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', paid: 'Paid', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
}

const STATUS_COLOUR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

type Order = { id: string; status: string; total: number; items: { name: string }[]; created_at: string }
type User = { id: string; email?: string; user_metadata?: { full_name?: string } }
type WishlistProduct = { id: string; name: string; slug: string; price: number; compare_at_price: number | null; thumbnail: string | null; stock: number; categories: { name: string } | null }

export default function AccountPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('signin')
  const [accountTab, setAccountTab] = useState<AccountTab>('orders')
  const { items: wishlistIds, ready: wishlistReady } = useWishlist()
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchOrders(user.id)
      else setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchOrders(userId: string) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total, items, created_at')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
    setOrders((data ?? []) as Order[])
    setLoading(false)
  }

  useEffect(() => {
    if (accountTab !== 'wishlist' || !wishlistReady) return
    if (wishlistIds.length === 0) { setWishlistProducts([]); return }
    setWishlistLoading(true)
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, categories(name)')
      .in('id', wishlistIds)
      .eq('is_active', true)
      .then(({ data }) => {
        const map = new Map((data ?? []).map((p: any) => [p.id, { ...p, categories: Array.isArray(p.categories) ? (p.categories[0] ?? null) : p.categories }]))
        setWishlistProducts(wishlistIds.map(id => map.get(id)).filter(Boolean) as WishlistProduct[])
        setWishlistLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountTab, wishlistIds, wishlistReady])

  useEffect(() => {
    if (accountTab !== 'inbox' || !user) return
    setMessagesLoading(true)
    supabase
      .from('inbox_messages')
      .select('id, subject, body, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const msgs = (data ?? []) as InboxMessage[]
        setMessages(msgs)
        setMessagesLoading(false)
        const unread = msgs.filter(m => !m.read_at).map(m => m.id)
        if (unread.length) {
          markMessagesRead(unread).then(() => {
            setMessages(prev => prev.map(m => unread.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m))
          })
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountTab, user])

  function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        fd.get('email') as string,
        { redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password` }
      )
      if (error) { setMsg({ type: 'error', text: error.message }); return }
      setMsg({ type: 'success', text: 'Check your email for a reset link.' })
    })
  }

  function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: fd.get('email') as string,
        password: fd.get('password') as string,
      })
      if (error) { setMsg({ type: 'error', text: error.message }); return }
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) fetchOrders(user.id)
    })
  }

  function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        options: { data: { full_name: fd.get('name') as string } },
      })
      if (error) { setMsg({ type: 'error', text: error.message }); return }
      setMsg({ type: 'success', text: 'Check your email to confirm your account.' })
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setOrders([])
  }

  function handleGoogleSignIn() {
    startTransition(async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      })
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-24 text-center">
        <div className="w-6 h-6 border-2 border-[#4A0F1C] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-1">Account</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.user_metadata?.full_name ?? user.email}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
          {([
            { id: 'orders', label: 'Orders', count: orders.length },
            { id: 'wishlist', label: 'Wishlist', count: wishlistIds.length },
            { id: 'inbox', label: 'Inbox', count: messages.filter(m => !m.read_at).length },
          ] as { id: AccountTab; label: string; count: number }[]).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAccountTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                accountTab === t.id
                  ? 'border-[#4A0F1C] dark:border-[#E8C4CB] text-[#4A0F1C] dark:text-[#E8C4CB]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  accountTab === t.id
                    ? 'bg-[#4A0F1C]/10 dark:bg-[#E8C4CB]/10 text-[#4A0F1C] dark:text-[#E8C4CB]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {accountTab === 'orders' && (
          orders.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No orders yet</p>
              <Link href="/shop" className="text-sm font-medium text-[#6B1A2A] dark:text-[#D4849A] hover:underline">
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all group"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${STATUS_COLOUR[order.status] ?? STATUS_COLOUR.pending}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-bold text-[#4A0F1C] dark:text-[#E8C4CB]">
                      ₦{Number(order.total).toLocaleString('en')}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Wishlist tab */}
        {accountTab === 'wishlist' && (
          wishlistLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-[20px] overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : wishlistIds.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-full bg-[#4A0F1C]/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#4A0F1C] dark:text-[#E8C4CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No saved items yet</p>
              <Link href="/shop" className="text-sm font-medium text-[#6B1A2A] dark:text-[#D4849A] hover:underline">
                Browse products →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {wishlistProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        )}

        {/* Inbox tab */}
        {accountTab === 'inbox' && (
          messagesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-full bg-[#4A0F1C]/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#4A0F1C] dark:text-[#E8C4CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    msg.read_at
                      ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                      : 'bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/10 border-[#4A0F1C]/20 dark:border-[#E8C4CB]/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className={`text-sm font-semibold ${msg.read_at ? 'text-gray-800 dark:text-gray-200' : 'text-[#4A0F1C] dark:text-[#E8C4CB]'}`}>
                      {msg.subject || '(No subject)'}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!msg.read_at && (
                        <span className="w-2 h-2 rounded-full bg-[#4A0F1C] dark:bg-[#E8C4CB]" />
                      )}
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {new Date(msg.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#4A0F1C] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to view your orders</p>
      </div>

      {tab !== 'forgot' && (
        <>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as ('signin' | 'signup')[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setMsg(null) }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={pending}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 mb-4"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
        </>
      )}

      {msg && (
        <p className={`text-xs mb-4 px-3 py-2.5 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {msg.text}
        </p>
      )}

      {tab === 'forgot' ? (
        <form onSubmit={handleForgotPassword} className="space-y-3">
          <button
            type="button"
            onClick={() => { setTab('signin'); setMsg(null) }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            Back to sign in
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">Enter your email and we'll send you a reset link.</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
            <input name="email" type="email" placeholder="you@example.com" required className={inputCls} />
          </div>
          <button type="submit" disabled={pending} className="w-full py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 transition-colors mt-1">
            {pending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      ) : tab === 'signin' ? (
        <form onSubmit={handleSignIn} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
            <input name="email" type="email" placeholder="you@example.com" required className={inputCls} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Password</label>
              <button type="button" onClick={() => { setTab('forgot'); setMsg(null) }} className="text-xs text-[#4A0F1C] dark:text-[#D4849A] hover:underline">
                Forgot password?
              </button>
            </div>
            <input name="password" type="password" placeholder="••••••••" required className={inputCls} />
          </div>
          <button type="submit" disabled={pending} className="w-full py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 transition-colors mt-1">
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Full name</label>
            <input name="name" type="text" placeholder="John Doe" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
            <input name="email" type="email" placeholder="you@example.com" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Password</label>
            <input name="password" type="password" placeholder="••••••••" minLength={6} required className={inputCls} />
          </div>
          <button type="submit" disabled={pending} className="w-full py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 transition-colors mt-1">
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  )
}
