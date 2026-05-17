import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import UsersManager from '@/components/admin/UsersManager'

const SLUG_TO_ROLE: Record<string, string> = {
  admins: 'admin',
  editors: 'editor',
  managers: 'manager',
  'shop-keepers': 'shop_keeper',
  financiers: 'financier',
}

export default async function AdminUsersRolePage({ params }: { params: { slug: string } }) {
  const role = SLUG_TO_ROLE[params.slug]
  if (!role) notFound()

  const [adminClient, supabase] = [createAdminClient(), createClient()]
  const [{ data: { users }, error }, { data: { user: me } }] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    supabase.auth.getUser(),
  ])

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-500">Could not load users. Make sure SUPABASE_SERVICE_ROLE_KEY is set.</p>
      </div>
    )
  }

  const myRole = (me?.app_metadata?.role ?? '') as string

  return (
    <div className="p-8">
      <UsersManager users={users as any} currentUserRole={myRole} initialRoleFilter={role} />
    </div>
  )
}
