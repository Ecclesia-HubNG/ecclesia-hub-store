'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { verifyAndFinalizeOrder } from '@/lib/actions/paystack'

type State = 'verifying' | 'success' | 'error'

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()
  const [state, setState] = useState<State>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    if (!reference) {
      setState('error')
      setErrorMsg('No payment reference found.')
      return
    }

    verifyAndFinalizeOrder(reference).then(result => {
      if ('error' in result) {
        setState('error')
        setErrorMsg(result.error ?? 'Verification failed.')
        return
      }

      clearCart()
      setState('success')
      setTimeout(() => router.replace(`/orders/${result.orderId}?paid=1`), 1500)
    })
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {state === 'verifying' && (
          <>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full border-4 border-[#4A0F1C]/20 border-t-[#4A0F1C] animate-spin" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">Confirming your payment…</p>
            <p className="text-sm text-gray-400 mt-1">Please don't close this page.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">Payment confirmed!</p>
            <p className="text-sm text-gray-400 mt-1">Taking you to your order…</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">Payment verification failed</p>
            <p className="text-sm text-gray-400 mt-1">{errorMsg}</p>
            <div className="mt-5 flex gap-3 justify-center">
              <a href="/checkout" className="px-5 py-2.5 text-sm font-semibold bg-[#4A0F1C] text-white rounded-xl hover:bg-[#3A0B15] transition-colors">
                Try again
              </a>
              <a href="/support" className="px-5 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Contact support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
