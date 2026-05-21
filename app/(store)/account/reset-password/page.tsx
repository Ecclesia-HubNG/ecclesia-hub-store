'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type State = 'loading' | 'ready' | 'success' | 'error'

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

export default function CustomerResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [pending, startTransition] = useTransition()

  // Supabase fires PASSWORD_RECOVERY after the callback exchanges the code.
  // If the user landed here without that event, they have no valid recovery session.
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setState('ready')
      }
    })

    // Also check if already signed in (e.g. page refresh after recovery)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setState('ready')
      else setState('error')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const password = fd.get('password') as string
    const confirm = fd.get('confirm') as string

    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setErrorMsg('')
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setErrorMsg(error.message)
        return
      }
      setState('success')
      setTimeout(() => router.replace('/account'), 1800)
    })
  }

  if (state === 'loading') {
    return (
      <div className="max-w-sm mx-auto px-6 py-24 flex justify-center">
        <div className="w-6 h-6 border-2 border-[#4A0F1C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <p className="text-sm text-gray-500 mb-4">This reset link is invalid or has expired.</p>
        <Link href="/account" className="text-sm font-medium text-[#4A0F1C] hover:underline">
          ← Back to account
        </Link>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-900 dark:text-white">Password updated!</p>
        <p className="text-sm text-gray-400 mt-1">Taking you to your account…</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#4A0F1C] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Set new password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <p className="text-xs bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-3 py-2.5 rounded-lg">
            {errorMsg}
          </p>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">New password</label>
          <input name="password" type="password" placeholder="Min. 6 characters" minLength={6} required className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Confirm password</label>
          <input name="confirm" type="password" placeholder="Repeat password" required className={inputCls} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 transition-colors mt-1"
        >
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
