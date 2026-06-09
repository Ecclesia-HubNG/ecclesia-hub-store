'use client'

import { useState, useTransition } from 'react'
import { addOrderComment, type OrderEvent } from '@/lib/actions/order-events'

type DerivedEvent = {
  id: string
  type: string
  message: string
  created_at: string
}

type TimelineItem = DerivedEvent | (OrderEvent & { type: string })

function dot(type: string) {
  if (type === 'comment') return 'bg-[#4A0F1C] dark:bg-[#E8C4CB]'
  if (type === 'payment') return 'bg-emerald-500'
  if (type === 'email') return 'bg-blue-400'
  if (type === 'status') return 'bg-purple-400'
  return 'bg-gray-400'
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function groupByDate(items: TimelineItem[]) {
  const groups: Record<string, TimelineItem[]> = {}
  for (const item of items) {
    const day = new Date(item.created_at).toLocaleDateString('en', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    ;(groups[day] ??= []).push(item)
  }
  return groups
}

export function OrderTimeline({
  orderId,
  events: initial,
  derivedEvents,
}: {
  orderId: string
  events: OrderEvent[]
  derivedEvents: DerivedEvent[]
}) {
  const [events, setEvents] = useState(initial)
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const allItems: TimelineItem[] = [...derivedEvents, ...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  const groups = groupByDate(allItems)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await addOrderComment(orderId, comment)
      if (res.error) { setError(res.error); return }
      setEvents(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          order_id: orderId,
          type: 'comment',
          message: comment.trim(),
          created_at: new Date().toISOString(),
        },
      ])
      setComment('')
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-5">Timeline</h2>

      {/* Comment box */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#4A0F1C]/20 focus-within:border-[#4A0F1C]/40 transition-all">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Leave a note (only you and other staff see this)…"
            rows={3}
            className="w-full px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400">Only visible to staff</p>
            <button
              type="submit"
              disabled={pending || !comment.trim()}
              className="px-4 py-1.5 bg-[#4A0F1C] text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-[#3A0B15] transition-colors"
            >
              {pending ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </form>

      {/* Event list */}
      {allItems.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No activity yet.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([day, items]) => (
            <div key={day}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">{day}</p>
              <div className="space-y-0">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot(item.type)}`} />
                      {idx < items.length - 1 && (
                        <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${item.type === 'comment' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                          {item.message}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {item.type === 'comment' && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Staff note · {fmt(item.created_at)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
