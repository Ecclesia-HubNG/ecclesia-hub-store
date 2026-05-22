'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'signin' | 'signup' | 'forgot'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

export default function AccountPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('signin')
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [showSignInPwd, setShowSignInPwd] = useState(false)
  const [showSignUpPwd, setShowSignUpPwd] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/account/orders')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      router.replace('/account/orders')
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
      setMsg({ type: 'success', text: 'Check your email to confirm your account. If you don\'t see it, check your spam folder.' })
    })
  }

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

  function handleGoogleSignIn() {
    startTransition(async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/account/orders`,
        },
      })
    })
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <img src="/logo.svg" alt="Ecclesia Hub" className="h-16 w-auto mx-auto mb-6" />
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
            <div className="relative">
              <input name="password" type={showSignInPwd ? 'text' : 'password'} placeholder="••••••••" required className={inputCls + ' pr-10'} />
              <button type="button" onClick={() => setShowSignInPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <EyeIcon open={showSignInPwd} />
              </button>
            </div>
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
            <div className="relative">
              <input name="password" type={showSignUpPwd ? 'text' : 'password'} placeholder="••••••••" minLength={6} required className={inputCls + ' pr-10'} />
              <button type="button" onClick={() => setShowSignUpPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <EyeIcon open={showSignUpPwd} />
              </button>
            </div>
          </div>
          <button type="submit" disabled={pending} className="w-full py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 transition-colors mt-1">
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  )
}
