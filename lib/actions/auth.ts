'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from '@/lib/email'
import { verifyTurnstile } from '@/lib/turnstile'
import { headers } from 'next/headers'

function clientIp() {
  return headers().get('x-forwarded-for')?.split(',')[0]?.trim()
}

export async function signIn(_: unknown, formData: FormData) {
  const captchaOk = await verifyTurnstile(formData.get('cf-turnstile-response'), clientIp())
  if (!captchaOk) return { error: 'Verification failed. Please refresh the page and try again.' }

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
  const captchaOk = await verifyTurnstile(formData.get('cf-turnstile-response'), clientIp())
  if (!captchaOk) return { error: 'Verification failed. Please refresh the page and try again.' }

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

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email, {
    name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
    email,
  }).catch(() => {})

  return { success: true, email }
}

export async function forgotPassword(_: unknown, formData: FormData) {
  const captchaOk = await verifyTurnstile(formData.get('cf-turnstile-response'), clientIp())
  if (!captchaOk) return { error: 'Verification failed. Please refresh the page and try again.' }

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
