export default function MenuPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Manage your store&apos;s navigation menus.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Menu editor coming soon</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Configure header and footer navigation links here.</p>
      </div>
    </div>
  )
}
