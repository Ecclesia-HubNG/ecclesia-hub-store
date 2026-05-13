import { createClient } from '@/lib/supabase/server'
import { AdminSearchBar } from './AdminSearchBar'
import { ThemeToggle } from './ThemeToggle'

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export async function AdminHeader() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const fullName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Admin'
  const firstName = fullName.split(' ')[0]
  const initials = getInitials(fullName)

  return (
    <header className="h-16 bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-white/10 flex items-center px-6 gap-4 shrink-0 z-30">
      {/* Left — welcome */}
      <div className="w-56 shrink-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          Welcome back, {firstName} 👋
        </p>
      </div>

      {/* Middle — search */}
      <div className="flex-1">
        <AdminSearchBar />
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Messages */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#6B1A2A] rounded-full ring-2 ring-white dark:ring-[#111111]" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

        {/* Avatar */}
        <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#4A0F1C] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
    </header>
  )
}
