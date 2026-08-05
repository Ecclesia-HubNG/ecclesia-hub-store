'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyTurnstile } from '@/lib/turnstile'
import { headers } from 'next/headers'

function clientIp() {
  return headers().get('x-forwarded-for')?.split(',')[0]?.trim()
}

export async function customerSignIn(email: string, password: string, captchaToken: string | null) {
  const captchaOk = await verifyTurnstile(captchaToken, clientIp())
  if (!captchaOk) return { error: 'Verification failed. Please refresh the page and try again.' }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { success: true as const }
}

export async function customerSignUp(email: string, password: string, fullName: string, captchaToken: string | null) {
  const captchaOk = await verifyTurnstile(captchaToken, clientIp())
  if (!captchaOk) return { error: 'Verification failed. Please refresh the page and try again.' }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) return { error: error.message }
  return { success: true as const }
}

export async function customerForgotPassword(email: string, redirectTo: string, captchaToken: string | null) {
  const captchaOk = await verifyTurnstile(captchaToken, clientIp())
  if (!captchaOk) return { error: 'Verification failed. Please refresh the page and try again.' }

  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) return { error: error.message }
  return { success: true as const }
}
