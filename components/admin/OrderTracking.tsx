'use client'

import { useTransition, useState } from 'react'
import { updateOrderTracking } from '@/lib/actions/orders'

export function OrderTracking({
  id,
  trackingNumber,
  carrier,
  adminNotes,
}: {
  id: string
  trackingNumber: string | null
  carrier: string | null
  adminNotes: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('id', id)
    startTransition(async () => {
      await updateOrderTracking(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-4">Tracking & Notes</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Carrier */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Carrier</label>
            <input
              name="carrier"
              type="text"
              defaultValue={carrier ?? ''}
              placeholder="e.g. DHL, GIG Logistics"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition-colors"
            />
          </div>
          {/* Tracking number */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tracking Number</label>
            <input
              name="tracking_number"
              type="text"
              defaultValue={trackingNumber ?? ''}
              placeholder="e.g. 1Z999AA10123456784"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Admin notes */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Admin Notes</label>
          <textarea
            name="admin_notes"
            rows={2}
            defaultValue={adminNotes ?? ''}
            placeholder="Internal notes — not visible to customer"
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 focus:border-[#4A0F1C]/50 transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${saved ? 'bg-green-600 text-white' : 'bg-[#4A0F1C] hover:bg-[#3A0B15] text-white'}`}
          >
            {pending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : saved ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Saved
              </>
            ) : (
              'Save Tracking'
            )}
          </button>
          {trackingNumber && (
            <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">Current: {trackingNumber}</p>
          )}
        </div>
      </form>
    </div>
  )
}
