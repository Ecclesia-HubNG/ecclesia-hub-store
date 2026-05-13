import { createClient } from '@/lib/supabase/server'
import { AdminSearchBar } from './AdminSearchBar'
import { ThemeToggle } from './ThemeToggle'
import { MessagesPanel } from './MessagesPanel'
import { NotificationsPanel } from './NotificationsPanel'
import { AvatarMenu } from './AvatarMenu'

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
  const email = user?.email ?? ''

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
        <ThemeToggle />
        <MessagesPanel />
        <NotificationsPanel />

        <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

        <AvatarMenu name={fullName} email={email} initials={initials} />
      </div>
    </header>
  )
}
