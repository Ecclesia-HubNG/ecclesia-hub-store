'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendStaffInvite, sendPasswordResetEmail } from '@/lib/email'
import { ROLE_LABELS, assignableRoles } from '@/lib/roles'

const PATH = '/admin/users'

async function getCallerRole(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.app_metadata?.role ?? ''
}

async function getTargetRole(id: string): Promise<string> {
  const admin = createAdminClient()
  const { data: { user } } = await admin.auth.admin.getUserById(id)
  return user?.app_metadata?.role ?? ''
}

export async function updateUserName(id: string, fullName: string) {
  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(id, {
    user_metadata: { full_name: fullName },
  })
  revalidatePath(PATH)
}

export async function setUserRole(id: string, role: string) {
  const [callerRole, targetRole] = await Promise.all([getCallerRole(), getTargetRole(id)])

  // Super admin accounts are permanently protected — nobody can demote them
  if (targetRole === 'super_admin') {
    return { error: 'Super Admin accounts cannot have their role changed.' }
  }
  // Only super_admin can grant the super_admin role
  if (role === 'super_admin' && callerRole !== 'super_admin') {
    return { error: 'Only a Super Admin can grant Super Admin access.' }
  }
  // Must be admin or super_admin to change roles at all
  if (callerRole !== 'super_admin' && callerRole !== 'admin') {
    return { error: 'You do not have permission to change roles.' }
  }

  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(id, { app_metadata: { role } })
  revalidatePath(PATH)
}

export async function setUserBanned(id: string, banned: boolean) {
  const targetRole = await getTargetRole(id)
  if (targetRole === 'super_admin') {
    return { error: 'Super Admin accounts cannot be blocked.' }
  }

  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(id, {
    ban_duration: banned ? '876000h' : 'none',
  })
  revalidatePath(PATH)
}

export async function deleteUser(id: string) {
  const targetRole = await getTargetRole(id)
  if (targetRole === 'super_admin') {
    return { error: 'Super Admin accounts cannot be deleted.' }
  }

  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(id)
  revalidatePath(PATH)
}

export async function inviteStaffMember(email: string, role: string) {
  const callerRole = await getCallerRole()
  if (callerRole !== 'super_admin' && callerRole !== 'admin') {
    return { error: 'Only admins can invite staff.' }
  }
  if (!assignableRoles(callerRole).includes(role as any)) {
    return { error: 'You cannot assign that role.' }
  }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ecclesiahub.store'

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/admin/settings` },
  })
  if (error) return { error: error.message }

  // Set app_metadata role on the newly created user
  await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role } })

  const roleLabel = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role
  await sendStaffInvite(email, {
    email,
    roleLabel,
    inviteLink: data.properties.action_link,
  }).catch(() => {})

  revalidatePath(PATH)
  return { success: true }
}

export async function sendPasswordReset(email: string, name?: string) {
  const callerRole = await getCallerRole()
  if (callerRole !== 'super_admin' && callerRole !== 'admin') {
    return { error: 'Only admins can send password resets.' }
  }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ecclesiahub.store'

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/admin/settings` },
  })
  if (error) return { error: error.message }

  await sendPasswordResetEmail(email, {
    name: name || email.split('@')[0],
    email,
    resetLink: data.properties.action_link,
  }).catch(() => {})

  return { success: true }
}
