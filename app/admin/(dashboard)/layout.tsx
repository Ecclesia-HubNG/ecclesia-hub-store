import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/Sidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0d0d0d]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-[#0d0d0d]">
          {children}
        </main>
      </div>
    </div>
  )
}
