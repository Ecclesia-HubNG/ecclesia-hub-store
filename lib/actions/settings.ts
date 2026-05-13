'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(_: unknown, formData: FormData) {
  const supabase = createClient()
  const firstName = (formData.get('first_name') as string).trim()
  const lastName = (formData.get('last_name') as string).trim()

  const { error } = await supabase.auth.updateUser({
    data: { full_name: `${firstName} ${lastName}`.trim() },
  })

  if (error) return { error: error.message }
  revalidatePath('/admin', 'layout')
  return { success: true }
}

export async function updatePassword(_: unknown, formData: FormData) {
  const supabase = createClient()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) return { error: 'Passwords do not match.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}
