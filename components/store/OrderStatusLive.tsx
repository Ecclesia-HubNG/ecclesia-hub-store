'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getOrderStatus } from '@/lib/actions/customer-orders'
import { CancelOrderButton } from '@/components/CancelOrderButton'
import { RetryPaymentButton } from '@/components/RetryPaymentButton'

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'] as const
type Status = typeof STATUS_STEPS[number] | 'cancelled' | 'refunded' | 'payment_failed' | 'pending_verification' | 'pending_bank_transfer'

const TERMINAL_STATUSES = new Set(['delivered', 'cancelled', 'refunded'])
const POLL_INTERVAL_MS = 12000

const STATUS_LABEL: Record<string, string> = {
  pending_verification:  'Awaiting verification',
  pending_bank_transfer: 'Awaiting bank transfer',
  payment_failed:        'Payment failed',
  pending:               'Order placed',
  paid:                  'Payment confirmed',
  processing:            'Being prepared',
  shipped:               'Out for delivery',
  delivered:             'Delivered',
  cancelled:             'Cancelled',
  refunded:              'Refunded',
}

const STATUS_COLOUR: Record<string, string> = {
  pending_verification:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending_bank_transfer: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  payment_failed:        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending:               'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid:                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing:            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  shipped:               'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered:             'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled:             'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded:              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

function Timeline({ status }: { status: Status }) {
  if (status === 'cancelled' || status === 'refunded' || status === 'payment_failed') {
    const labels: Record<string, string> = { cancelled: 'Order cancelled', refunded: 'Order refunded', payment_failed: 'Payment failed' }
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLOUR[status]}`}>
        {labels[status] ?? status}
      </div>
    )
  }

  const currentIdx = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx
        const last = i === STATUS_STEPS.length - 1
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${done ? 'bg-[#4A0F1C] border-[#4A0F1C] text-white' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              <span className={`text-[10px] font-medium text-center max-w-[60px] leading-tight ${done ? 'text-[#4A0F1C] dark:text-[#E8C4CB]' : 'text-gray-400 dark:text-gray-600'}`}>
                {STATUS_LABEL[step]}
              </span>
            </div>
            {!last && (
              <div className={`h-0.5 w-8 sm:w-14 mb-5 transition-colors ${i < currentIdx ? 'bg-[#4A0F1C]' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const CANCELLABLE_STATUSES = new Set(['pending', 'pending_verification', 'pending_bank_transfer'])

export function OrderStatusLive({
  orderId,
  orderNumber,
  initialStatus,
  initialTrackingNumber,
  initialCarrier,
  children,
}: {
  orderId: string
  orderNumber: string
  initialStatus: string
  initialTrackingNumber: string | null
  initialCarrier: string | null
  children?: React.ReactNode
}) {
  const [status, setStatus] = useState(initialStatus)
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber)
  const [carrier, setCarrier] = useState(initialCarrier)
  const [justUpdated, setJustUpdated] = useState(false)
  const prevStatus = useRef(initialStatus)

  useEffect(() => {
    if (TERMINAL_STATUSES.has(status)) return

    let cancelled = false
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      const latest = await getOrderStatus(orderId)
      if (cancelled || !latest) return

      if (latest.status !== prevStatus.current) {
        prevStatus.current = latest.status
        setStatus(latest.status)
        setJustUpdated(true)
        setTimeout(() => setJustUpdated(false), 2500)
      }
      setTrackingNumber(latest.tracking_number)
      setCarrier(latest.carrier)
    }, POLL_INTERVAL_MS)

    return () => { cancelled = true; clearInterval(interval) }
  }, [orderId, status])

  return (
    <>
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${STATUS_COLOUR[status] ?? STATUS_COLOUR.pending} ${justUpdated ? 'ring-2 ring-offset-2 ring-[#4A0F1C]/40 dark:ring-offset-gray-950' : ''}`}>
          {STATUS_LABEL[status] ?? status}
        </div>
        {justUpdated && (
          <span className="text-xs text-gray-400 dark:text-gray-500 animate-in fade-in">Just updated</span>
        )}
      </div>

      {/* Payment failed notice */}
      {status === 'payment_failed' && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Your payment was not completed</p>
          <p className="text-sm text-red-700 dark:text-red-400">
            Your items are still reserved. You can retry your payment below — no need to start over.
          </p>
        </div>
      )}

      {status === 'pending_verification' && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Payment verification in progress</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Your payment is being confirmed. This usually takes a few seconds. If it doesn&apos;t update automatically,
            please quote your order number <span className="font-mono font-semibold">#{orderNumber}</span> when contacting us.
          </p>
        </div>
      )}
      {status === 'pending_bank_transfer' && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">Waiting for your bank transfer</p>
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Once we confirm your transfer, your order will be processed. Use order number{' '}
            <span className="font-mono font-semibold">#{orderNumber}</span> as your transfer reference.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Order status</h2>
          {!TERMINAL_STATUSES.has(status) && (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <Timeline status={status as Status} />
      </div>

      {/* Tracking info — appears once the admin adds it */}
      {(trackingNumber || carrier) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tracking</h2>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {carrier && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Carrier</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{carrier}</p>
              </div>
            )}
            {trackingNumber && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Tracking number</p>
                <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{trackingNumber}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {children}

      <div className="flex flex-col gap-3">
        {status === 'payment_failed' ? (
          <div className="flex gap-3 flex-wrap">
            <RetryPaymentButton orderId={orderId} />
            <Link href="/shop" className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Back to shop
            </Link>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link href="/shop" className="px-5 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] transition-colors">
              Continue shopping
            </Link>
            <Link href="/account/orders" className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              My orders
            </Link>
          </div>
        )}
        {CANCELLABLE_STATUSES.has(status) && (
          <CancelOrderButton id={orderId} />
        )}
      </div>
    </>
  )
}
