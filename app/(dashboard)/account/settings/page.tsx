'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

type User = { id: string; email?: string; user_metadata?: { full_name?: string } }

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors disabled:opacity-60'

export default function SettingsPage() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [resetPending, startResetTransition] = useTransition()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUser(user)
      setName(user.user_metadata?.full_name ?? '')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
      if (error) { setMsg({ type: 'error', text: error.message }); return }
      setMsg({ type: 'success', text: 'Name updated.' })
    })
  }

  function handlePasswordReset() {
    if (!user?.email) return
    startResetTransition(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
      })
      if (!error) setResetSent(true)
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your profile and account</p>
      </div>

      <div className="max-w-lg space-y-5">

        {/* Profile */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Profile</h2>
          <form onSubmit={handleSaveName} className="space-y-4">
            {msg && (
              <p className={`text-xs px-3 py-2.5 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                {msg.text}
              </p>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Display name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed here.</p>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 transition-colors"
            >
              {pending ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Password</h2>
          <p className="text-xs text-gray-400 mb-4">We'll send a reset link to your email address.</p>
          {resetSent ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Reset link sent — check your inbox.
            </p>
          ) : (
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetPending}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {resetPending ? 'Sending…' : 'Send password reset email'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
