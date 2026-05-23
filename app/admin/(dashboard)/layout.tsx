import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import AdminSidebar from '@/components/admin/Sidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ROLES } from '@/lib/roles'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware already authenticated the user and verified their role.
  // Reading the forwarded header avoids a redundant Supabase round-trip that
  // can corrupt the session when the access token is near expiry.
  const role = headers().get('x-admin-role') ?? ''
  if (!role || !ROLES.includes(role as any)) redirect('/admin/login')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0d0d0d]">
      <AdminSidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-[#0d0d0d]">
          {children}
        </main>
      </div>
    </div>
  )
}
