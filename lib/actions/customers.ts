'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const PATH = '/admin/customers'

export async function updateCustomer(formData: FormData) {
  const supabase = createAdminClient()
  const id = formData.get('id') as string
  await supabase.from('customers').update({
    full_name: (formData.get('full_name') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }).eq('id', id)
  revalidatePath(PATH)
}

export async function setCustomerBlocked(id: string, blocked: boolean) {
  const supabase = createAdminClient()
  await supabase.from('customers').update({ is_blocked: blocked }).eq('id', id)
  revalidatePath(PATH)
}

export async function setCustomerArchived(id: string, archived: boolean) {
  const supabase = createAdminClient()
  await supabase.from('customers').update({ is_archived: archived }).eq('id', id)
  revalidatePath(PATH)
}

export async function deleteCustomer(id: string) {
  const supabase = createAdminClient()
  await supabase.from('customers').delete().eq('id', id)
  revalidatePath(PATH)
}
