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
  applies_to: 'all' | 'products' | 'categories'
  product_ids: string[]
  category_ids: string[]
}

// The newsletter popup and its linked coupon can be edited from either admin
// page, so a coupon-side edit needs to push code/value/active back into
// popup_config the same way updatePopupConfig pushes the other way — otherwise
// renaming or re-valuing the coupon here silently orphans the popup's copy.
async function syncLinkedPopup(supabase: ReturnType<typeof createAdminClient>, previousCode: string, input: CouponInput) {
  const { data: popup } = await supabase.from('popup_config').select('id').eq('coupon_code', previousCode).maybeSingle()
  if (!popup) return
  const newCode = input.code.toUpperCase().trim()
  const updates: Record<string, unknown> = { coupon_code: newCode, is_enabled: input.is_active }
  if (input.discount_type === 'percentage') updates.discount_value = input.discount_value
  await supabase.from('popup_config').update(updates).eq('id', popup.id)
  revalidatePath('/', 'layout')
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
  const { data: before } = await supabase.from('coupons').select('code').eq('id', id).single()
  const { error } = await supabase.from('coupons').update({ ...input, code: input.code.toUpperCase().trim() }).eq('id', id)
  if (error) return { error: error.message }
  if (before?.code) await syncLinkedPopup(supabase, before.code, input)
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
  const { data: coupon } = await supabase.from('coupons').select('code').eq('id', id).single()
  await supabase.from('coupons').update({ is_active }).eq('id', id)
  if (coupon?.code) {
    const { data: popup } = await supabase.from('popup_config').select('id').eq('coupon_code', coupon.code).maybeSingle()
    if (popup) {
      await supabase.from('popup_config').update({ is_enabled: is_active }).eq('id', popup.id)
      revalidatePath('/', 'layout')
    }
  }
  revalidatePath('/admin/coupons')
}

export type ValidatedCoupon = {
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discountAmount: number
  // null = every product qualifies. Non-null = only these product IDs do —
  // callers (cart/checkout) filter line items against this on every
  // recompute so the discount never applies to items it shouldn't.
  eligibleProductIds: string[] | null
}

export type CouponCartItem = { productId: string; price: number; quantity: number }

export async function validateCoupon(
  code: string,
  subtotal: number,
  items: CouponCartItem[] = [],
): Promise<ValidatedCoupon | { error: string }> {
  const supabase = createAdminClient()
  const { data: coupon } = await supabase
    .from('coupons')
    .select('id, code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, is_active, applies_to, product_ids, category_ids')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle()

  if (!coupon || !coupon.is_active) return { error: 'Invalid coupon code.' }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { error: 'This coupon has expired.' }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return { error: 'This coupon has reached its usage limit.' }
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    return { error: `Minimum order amount for this coupon is ₦${Number(coupon.min_order_amount).toLocaleString('en')}.` }
  }

  // Resolve which product IDs this coupon is allowed to discount. Resolved
  // fresh from the coupon's own scoping every call — never trust a client-
  // supplied list — so a category's membership changing is always honored.
  let eligibleProductIds: string[] | null = null
  if (coupon.applies_to === 'products') {
    eligibleProductIds = coupon.product_ids ?? []
  } else if (coupon.applies_to === 'categories') {
    const categoryIds = coupon.category_ids ?? []
    const { data: matches } = categoryIds.length
      ? await supabase.from('products').select('id').overlaps('category_ids', categoryIds)
      : { data: [] }
    eligibleProductIds = (matches ?? []).map(p => p.id)
  }

  const eligibleSubtotal = eligibleProductIds === null
    ? subtotal
    : items.filter(i => eligibleProductIds!.includes(i.productId)).reduce((sum, i) => sum + i.price * i.quantity, 0)

  if (eligibleProductIds !== null && eligibleSubtotal === 0) {
    return { error: 'This coupon doesn\'t apply to any items in your cart.' }
  }

  const discountAmount = coupon.discount_type === 'percentage'
    ? Math.round(eligibleSubtotal * (Number(coupon.discount_value) / 100))
    : Math.min(Number(coupon.discount_value), eligibleSubtotal)

  return {
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type as 'percentage' | 'fixed',
    discount_value: Number(coupon.discount_value),
    discountAmount,
    eligibleProductIds,
  }
}

export async function incrementCouponUsage(code: string) {
  const supabase = createAdminClient()
  const { data } = await supabase.from('coupons').select('used_count').eq('code', code).single()
  if (data) await supabase.from('coupons').update({ used_count: data.used_count + 1 }).eq('code', code)
}
