export default function AdminLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 animate-pulse">
      {/* Page title bar */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>

      {/* Stats row (shows on dashboard; harmless on other pages) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-2">
            <div className="h-3.5 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex gap-4">
          {[40, 24, 16, 12].map((w, i) => (
            <div key={i} className={`h-3 bg-gray-100 dark:bg-gray-800 rounded`} style={{ width: `${w}%` }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-gray-50 dark:border-gray-800/50 flex gap-4 items-center last:border-0">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-2/5" />
              <div className="h-3 bg-gray-50 dark:bg-gray-800/60 rounded w-1/4" />
            </div>
            <div className="h-3.5 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
            <div className="h-7 w-7 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
