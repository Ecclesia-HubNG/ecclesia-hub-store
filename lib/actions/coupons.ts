'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

type CouponInput = {
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  max_uses: number | null
  expires_at: string | null
  is_active: boolean
}

export async function createCoupon(input: CouponInput) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('coupons').insert({ ...input, code: input.code.toUpperCase().trim() })
  if (error) return { error: error.message }
  revalidatePath('/admin/coupons')
  return { success: true as const }
}

export async function updateCoupon(id: string, input: CouponInput) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('coupons').update({ ...input, code: input.code.toUpperCase().trim() }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/coupons')
  return { success: true as const }
}

export async function deleteCoupon(id: string) {
  const supabase = createAdminClient()
  await supabase.from('coupons').delete().eq('id', id)
  revalidatePath('/admin/coupons')
}

export async function toggleCouponActive(id: string, is_active: boolean) {
  const supabase = createAdminClient()
  await supabase.from('coupons').update({ is_active }).eq('id', id)
  revalidatePath('/admin/coupons')
}
