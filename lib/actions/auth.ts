'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signIn(_: unknown, formData: FormData) {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin', 'layout')
  redirect('/admin/products')
}

export async function signUp(_: unknown, formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string

  const { error } = await supabase.auth.signUp({
    email,
    password: formData.get('password') as string,
    options: {
      data: { full_name: `${firstName} ${lastName}`.trim() },
    },
  })

  if (error) return { error: error.message }

  return { success: true, email }
}

export async function forgotPassword(_: unknown, formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/reset-password`,
  })

  if (error) return { error: error.message }

  return { success: true, email }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/admin', 'layout')
  redirect('/admin/login')
}
