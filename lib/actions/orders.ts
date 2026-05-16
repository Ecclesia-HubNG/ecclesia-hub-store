'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  await supabase.from('orders').update({ status }).eq('id', id)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}

export async function bulkUpdateOrderStatus(ids: string[], status: string) {
  const supabase = createClient()
  await supabase.from('orders').update({ status }).in('id', ids)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}
