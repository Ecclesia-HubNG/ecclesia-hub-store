'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
