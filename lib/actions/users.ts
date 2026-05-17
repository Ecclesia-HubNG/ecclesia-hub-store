'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const PATH = '/admin/users'

export async function updateUserName(id: string, fullName: string) {
  const supabase = createAdminClient()
  await supabase.auth.admin.updateUserById(id, {
    user_metadata: { full_name: fullName },
  })
  revalidatePath(PATH)
}

export async function setUserRole(id: string, role: 'admin' | 'user') {
  const supabase = createAdminClient()
  await supabase.auth.admin.updateUserById(id, {
    app_metadata: { role },
  })
  revalidatePath(PATH)
}

export async function setUserBanned(id: string, banned: boolean) {
  const supabase = createAdminClient()
  await supabase.auth.admin.updateUserById(id, {
    ban_duration: banned ? '876000h' : 'none',
  })
  revalidatePath(PATH)
}

export async function deleteUser(id: string) {
  const supabase = createAdminClient()
  await supabase.auth.admin.deleteUser(id)
  revalidatePath(PATH)
}
