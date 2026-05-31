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

export type ValidatedCoupon = {
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discountAmount: number
}

export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<ValidatedCoupon | { error: string }> {
  const supabase = createAdminClient()
  const { data: coupon } = await supabase
    .from('coupons')
    .select('id, code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, is_active')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle()

  if (!coupon || !coupon.is_active) return { error: 'Invalid coupon code.' }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { error: 'This coupon has expired.' }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return { error: 'This coupon has reached its usage limit.' }
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    return { error: `Minimum order amount for this coupon is ₦${Number(coupon.min_order_amount).toLocaleString('en')}.` }
  }

  const discountAmount = coupon.discount_type === 'percentage'
    ? Math.round(subtotal * (Number(coupon.discount_value) / 100))
    : Math.min(Number(coupon.discount_value), subtotal)

  return {
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type as 'percentage' | 'fixed',
    discount_value: Number(coupon.discount_value),
    discountAmount,
  }
}

export async function incrementCouponUsage(code: string) {
  const supabase = createAdminClient()
  const { data } = await supabase.from('coupons').select('used_count').eq('code', code).single()
  if (data) await supabase.from('coupons').update({ used_count: data.used_count + 1 }).eq('code', code)
}
