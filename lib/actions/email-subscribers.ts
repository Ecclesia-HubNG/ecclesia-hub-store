'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewsletterWelcomeEmail } from '@/lib/email'

const PATH = '/admin/emails/subscribers'

export async function addSubscriber(email: string, name?: string, source: 'manual' | 'popup' = 'manual') {
  const admin = createAdminClient()
  const normalizedEmail = email.trim().toLowerCase()

  const { data: existing } = await admin
    .from('email_subscribers')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  const { error } = await admin
    .from('email_subscribers')
    .upsert(
      { email: normalizedEmail, name: name?.trim() || null, status: 'active', source },
      { onConflict: 'email' },
    )
  if (error) return { error: error.message }

  if (!existing && source === 'popup') {
    sendNewsletterWelcomeEmail(normalizedEmail, { email: normalizedEmail }).catch(err =>
      console.error('[newsletter-welcome] send failed:', err?.message),
    )
  }

  revalidatePath(PATH)
  return { success: true }
}

export async function removeSubscriber(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('email_subscribers').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return { success: true }
}

export async function setSubscriberStatus(id: string, status: 'active' | 'unsubscribed') {
  const admin = createAdminClient()
  const { error } = await admin.from('email_subscribers').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return { success: true }
}

export async function bulkImportSubscribers(subscribers: { email: string; name?: string }[]) {
  const admin = createAdminClient()
  const rows = subscribers.map(s => ({
    email: s.email.trim().toLowerCase(),
    name: s.name?.trim() || null,
    status: 'active' as const,
  }))
  const { error } = await admin
    .from('email_subscribers')
    .upsert(rows, { onConflict: 'email' })
  if (error) return { error: error.message }
  revalidatePath(PATH)
  return { success: true, count: rows.length }
}
