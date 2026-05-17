import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import UsersManager from '@/components/admin/UsersManager'

export default async function AdminUsersPage() {
  const [admin, supabase] = [createAdminClient(), createClient()]
  const [{ data: { users }, error }, { data: { user: me } }] = await Promise.all([
    admin.auth.admin.listUsers(),
    supabase.auth.getUser(),
  ])

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-500">
          Could not load users. Make sure SUPABASE_SERVICE_ROLE_KEY is set.
        </p>
      </div>
    )
  }

  const myRole = (me?.app_metadata?.role ?? '') as string

  return (
    <div className="p-8">
      <UsersManager users={users as any} currentUserRole={myRole} />
    </div>
  )
}
