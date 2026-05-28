'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelMyOrder } from '@/lib/actions/customer-orders'

export function CancelOrderButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelMyOrder(id)
      if (result.error) {
        setError(result.error)
        setConfirm(false)
        return
      }
      router.push('/orders')
    })
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="px-5 py-2.5 border border-red-200 dark:border-red-800 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
      >
        Cancel order
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
      <p className="text-sm font-semibold text-red-800 dark:text-red-300">Cancel this order?</p>
      <p className="text-xs text-red-600 dark:text-red-400">This cannot be undone. If you already made a payment, please contact us before cancelling.</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={handleCancel}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Cancelling…' : 'Yes, cancel order'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => { setConfirm(false); setError('') }}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          Keep order
        </button>
      </div>
    </div>
  )
}
