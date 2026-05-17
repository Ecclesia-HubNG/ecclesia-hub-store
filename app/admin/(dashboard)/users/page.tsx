import { createAdminClient } from '@/lib/supabase/admin'
import UsersManager from '@/components/admin/UsersManager'

export default async function AdminUsersPage() {
  const admin = createAdminClient()
  const { data: { users }, error } = await admin.auth.admin.listUsers()

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-500">
          Could not load users. Make sure SUPABASE_SERVICE_ROLE_KEY is set.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <UsersManager users={users as any} />
    </div>
  )
}
