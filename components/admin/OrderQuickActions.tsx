'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from '@/lib/actions/orders'

type Action = {
  label: string
  toStatus: string
  style: string
  icon: React.ReactNode
}

const CONFIRM_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
)
const PAID_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
  </svg>
)
const SHIP_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
)
const DELIVER_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)
const CANCEL_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)
const REOPEN_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
)

const ACTIONS_BY_STATUS: Record<string, Action[]> = {
  pending: [
    { label: 'Confirm Order', toStatus: 'processing', style: 'bg-[#4A0F1C] hover:bg-[#3A0B15] text-white', icon: CONFIRM_ICON },
    { label: 'Mark Paid', toStatus: 'paid', style: 'bg-blue-600 hover:bg-blue-700 text-white', icon: PAID_ICON },
    { label: 'Cancel', toStatus: 'cancelled', style: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20', icon: CANCEL_ICON },
  ],
  paid: [
    { label: 'Start Processing', toStatus: 'processing', style: 'bg-[#4A0F1C] hover:bg-[#3A0B15] text-white', icon: CONFIRM_ICON },
    { label: 'Cancel', toStatus: 'cancelled', style: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20', icon: CANCEL_ICON },
  ],
  processing: [
    { label: 'Mark Shipped', toStatus: 'shipped', style: 'bg-purple-600 hover:bg-purple-700 text-white', icon: SHIP_ICON },
    { label: 'Cancel', toStatus: 'cancelled', style: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20', icon: CANCEL_ICON },
  ],
  shipped: [
    { label: 'Mark Delivered', toStatus: 'delivered', style: 'bg-green-600 hover:bg-green-700 text-white', icon: DELIVER_ICON },
  ],
  cancelled: [
    { label: 'Reopen Order', toStatus: 'pending', style: 'bg-[#4A0F1C] hover:bg-[#3A0B15] text-white', icon: REOPEN_ICON },
  ],
  refunded: [
    { label: 'Reopen Order', toStatus: 'pending', style: 'bg-[#4A0F1C] hover:bg-[#3A0B15] text-white', icon: REOPEN_ICON },
  ],
}

export function OrderQuickActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition()
  const actions = ACTIONS_BY_STATUS[status] ?? []

  if (actions.length === 0) return null

  function doAction(toStatus: string) {
    const fd = new FormData()
    fd.set('id', id)
    fd.set('status', toStatus)
    startTransition(() => updateOrderStatus(fd))
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-4">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        {actions.map(action => (
          <button
            key={action.toStatus}
            type="button"
            disabled={pending}
            onClick={() => doAction(action.toStatus)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${action.style}`}
          >
            {pending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
