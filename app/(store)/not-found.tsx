import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-[#4A0F1C] dark:text-[#E8C4CB] mb-4">404</p>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Page not found</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
        This page may have been removed or the link is incorrect.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/shop"
          className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Browse shop
        </Link>
        <Link
          href="/home"
          className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
