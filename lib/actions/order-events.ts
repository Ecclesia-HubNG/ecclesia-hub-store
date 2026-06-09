'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type OrderEvent = {
  id: string
  order_id: string
  type: string
  message: string
  created_at: string
}

export async function getOrderEvents(orderId: string): Promise<OrderEvent[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('order_events')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  return (data as OrderEvent[]) ?? []
}

export async function addOrderComment(
  orderId: string,
  message: string,
): Promise<{ error?: string }> {
  if (!message.trim()) return { error: 'Message is empty' }
  const admin = createAdminClient()
  const { error } = await admin.from('order_events').insert({
    order_id: orderId,
    type: 'comment',
    message: message.trim(),
  })
  return error ? { error: error.message } : {}
}

export async function logOrderEvent(orderId: string, type: string, message: string): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('order_events').insert({ order_id: orderId, type, message })
  } catch {
    // non-blocking — timeline logging must never break the main flow
  }
}
