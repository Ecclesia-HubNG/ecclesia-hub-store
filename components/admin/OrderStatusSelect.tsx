'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from '@/lib/actions/orders'

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  paid:       'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  processing: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  shipped:    'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  delivered:  'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  cancelled:  'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
  refunded:   'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

export function OrderStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    const fd = new FormData()
    fd.set('id', id)
    fd.set('status', newStatus)
    startTransition(() => updateOrderStatus(fd))
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={pending}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer capitalize focus:outline-none focus:ring-2 focus:ring-[#6B1A2A] disabled:opacity-50 ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {STATUSES.map(s => (
        <option key={s} value={s} className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white capitalize">
          {s}
        </option>
      ))}
    </select>
  )
}
