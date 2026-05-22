'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendInboxMessage(userId: string, subject: string, body: string) {
  if (!userId || !subject.trim() || !body.trim()) return { error: 'Missing required fields' }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('inbox_messages')
    .insert({ user_id: userId, subject: subject.trim(), body: body.trim(), sender: 'admin' })
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  revalidatePath('/admin/support')
  return { success: true as const }
}

export async function adminReply(userId: string, body: string) {
  if (!userId || !body.trim()) return { error: 'Missing required fields' }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('inbox_messages')
    .insert({ user_id: userId, subject: 'Support', body: body.trim(), sender: 'admin' })
  if (error) return { error: error.message }
  return { success: true as const }
}

export async function markConversationRead(userId: string) {
  const supabase = createAdminClient()
  await supabase
    .from('inbox_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('sender', 'customer')
    .is('read_at', null)
  return { success: true as const }
}

export async function markMessagesRead(messageIds: string[]) {
  if (!messageIds.length) return { success: true as const }
  const supabase = createClient()
  const { error } = await supabase
    .from('inbox_messages')
    .update({ read_at: new Date().toISOString() })
    .in('id', messageIds)
    .is('read_at', null)
  if (error) return { error: error.message }
  return { success: true as const }
}
