'use client'

import { useState, useTransition } from 'react'
import { retryPayment } from '@/lib/actions/flutterwave'

export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleRetry() {
    setError('')
    startTransition(async () => {
      const result = await retryPayment(orderId)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      if (result.paymentLink) window.location.href = result.paymentLink
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleRetry}
        disabled={pending}
        className="px-5 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] disabled:opacity-60 transition-colors"
      >
        {pending ? 'Preparing payment…' : 'Retry payment'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
