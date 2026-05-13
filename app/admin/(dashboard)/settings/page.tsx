import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/admin/ProfileForm'
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm'
import { signOut } from '@/lib/actions/auth'

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-b border-gray-100 dark:border-white/10 last:border-0">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="md:col-span-2">
        {children}
      </div>
    </div>
  )
}

export default async function AdminSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const fullName = (user?.user_metadata?.full_name as string) || ''
  const [firstName, ...rest] = fullName.split(' ')
  const lastName = rest.join(' ')
  const email = user?.email ?? ''
  const isAdmin = user?.app_metadata?.role === 'admin'

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Manage your profile and account preferences.</p>
      </div>

      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-8 divide-y divide-gray-100 dark:divide-white/10">

        {/* Profile */}
        <Section
          title="Profile"
          description="Update your display name. This shows in the admin header."
        >
          <ProfileForm firstName={firstName} lastName={lastName} email={email} />
        </Section>

        {/* Password */}
        <Section
          title="Password"
          description="Choose a strong password with at least 8 characters, a number, and a special character."
        >
          <ChangePasswordForm />
        </Section>

        {/* Account info */}
        <Section
          title="Account"
          description="Your account role and verification status."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isAdmin
                  ? 'bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30 text-[#6B1A2A] dark:text-[#D4849A]'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
              }`}>
                {isAdmin ? 'Admin' : 'User'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-gray-600 dark:text-gray-400">Email verified</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                user?.email_confirmed_at ? 'text-green-600 dark:text-green-400' : 'text-amber-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user?.email_confirmed_at ? 'bg-green-500' : 'bg-amber-400'}`} />
                {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Member since</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section
          title="Session"
          description="Sign out of your admin account on this device."
        >
          <form action={signOut}>
            <button
              type="submit"
              className="px-5 py-2.5 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Sign out
            </button>
          </form>
        </Section>

      </div>
    </div>
  )
}
