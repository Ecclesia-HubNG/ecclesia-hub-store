'use client'

import { useState, useTransition } from 'react'
import { sendOrderConfirmationEmail } from '@/lib/actions/orders'

export function SendConfirmationEmailButton({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function handle() {
    setError('')
    setSent(false)
    startTransition(async () => {
      const result = await sendOrderConfirmationEmail(id)
      if (result.error) {
        setError(result.error)
      } else {
        setSent(true)
        setTimeout(() => setSent(false), 4000)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending || sent}
        onClick={handle}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          sent
            ? 'bg-green-600 text-white'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {pending ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : sent ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        )}
        {pending ? 'Sending…' : sent ? 'Sent!' : 'Send confirmation email'}
      </button>
      {!pending && !sent && (
        <span className="text-xs text-gray-400 dark:text-gray-600">to {email}</span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
