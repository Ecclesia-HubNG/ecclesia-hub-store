'use client'

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending:    { color: 'text-amber-700',  bg: 'bg-amber-400' },
  paid:       { color: 'text-blue-700',   bg: 'bg-blue-400' },
  processing: { color: 'text-blue-700',   bg: 'bg-blue-500' },
  shipped:    { color: 'text-purple-700', bg: 'bg-purple-400' },
  delivered:  { color: 'text-green-700',  bg: 'bg-green-400' },
  cancelled:  { color: 'text-gray-500',   bg: 'bg-gray-300' },
  refunded:   { color: 'text-red-700',    bg: 'bg-red-400' },
}

export function OrderStatusBreakdown({
  data,
  total,
}: {
  data: { status: string; count: number }[]
  total: number
}) {
  if (!total) {
    return <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
  }

  return (
    <div className="space-y-3">
      {data.map(({ status, count }) => {
        const pct = total ? Math.round((count / total) * 100) : 0
        const cfg = STATUS_CONFIG[status] ?? { color: 'text-gray-500', bg: 'bg-gray-300' }
        return (
          <div key={status}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{status}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {count} <span className="text-gray-400 font-normal">({pct}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.bg} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
