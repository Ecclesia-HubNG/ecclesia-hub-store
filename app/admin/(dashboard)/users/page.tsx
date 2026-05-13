import { createAdminClient } from '@/lib/supabase/admin'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function AdminUsersPage() {
  const admin = createAdminClient()
  const { data: { users }, error } = await admin.auth.admin.listUsers()

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-500">
          Could not load users. Make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{users.length} registered</p>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Last sign in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {users.map(user => {
              const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Unknown'
              const isAdmin = user.app_metadata?.role === 'admin'
              const confirmed = !!user.email_confirmed_at

              return (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4A0F1C] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{getInitials(name)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white leading-tight">{name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isAdmin
                        ? 'bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30 text-[#6B1A2A] dark:text-[#D4849A]'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                    }`}>
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      confirmed
                        ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${confirmed ? 'bg-green-500' : 'bg-amber-400'}`} />
                      {confirmed ? 'Verified' : 'Pending'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('en', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>

                  {/* Last sign in */}
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString('en', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : <span className="text-gray-300 dark:text-gray-600">Never</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
