'use client'

import { useState, useEffect, useTransition } from 'react'
import { addSubscriber } from '@/lib/actions/email-subscribers'

const STORAGE_KEY = 'ecclesia-newsletter'
const SUPPRESS_DAYS = 14
const DELAY_MS = 2500

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { ts } = JSON.parse(raw) as { ts: number }
        if (Date.now() - ts < SUPPRESS_DAYS * 24 * 60 * 60 * 1000) return
      }
    } catch {}
    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() })) } catch {}
    setVisible(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    startTransition(async () => {
      const res = await addSubscriber(email.trim())
      if (res && 'error' in res) {
        setError('Something went wrong. Please try again.')
        return
      }
      setDone(true)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() })) } catch {}
      setTimeout(() => setVisible(false), 2500)
    })
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex pointer-events-auto">

          {/* Left — brand panel */}
          <div className="hidden sm:flex w-[45%] shrink-0 bg-[#4A0F1C] flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Decorative rings */}
            <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-white/10" />
            <div className="absolute -right-12 -top-12 w-80 h-80 rounded-full border border-white/[0.06]" />
            <div className="absolute -left-10 -bottom-10 w-56 h-56 rounded-full border border-white/10" />
            {/* Dot grid */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <div className="relative z-10 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4849A] mb-4">Ecclesia Hub</p>
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[#E8C4CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="text-white font-bold text-lg leading-snug">Glow. Nourish.<br />Thrive.</p>
              <p className="text-white/50 text-xs mt-3 leading-relaxed max-w-[160px] mx-auto">
                Premium skincare & body care crafted with intention.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="flex-1 bg-white dark:bg-gray-900 p-8 relative flex flex-col justify-center">

            {/* Close */}
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">You're in!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Check your inbox for your exclusive discount.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6B1A2A] dark:text-[#D4849A] mb-2">
                  Join the community
                </p>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight mb-1">
                  UNLOCK<br />15% OFF
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  On your next order. Sign up for exclusive updates, new arrivals & insider-only discounts.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition"
                  />
                  {error && (
                    <p className="text-xs text-red-500">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 bg-[#4A0F1C] hover:bg-[#3A0B15] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                  >
                    {isPending ? 'Subscribing…' : 'SUBSCRIBE & SAVE 15%'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={dismiss}
                  className="mt-4 w-full text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  No thanks, I'll pay full price
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
