'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function revalidateAll() {
  revalidatePath('/admin/promotions')
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/new-arrivals')
  revalidatePath('/promotions')
}

// Each placement slot can only hold one promotion at a time.
// value=true → sets this promo, clears all others for that slot.
// value=false → clears just this promo from that slot.
export async function setPromotionPlacement(
  id: string,
  placement: 'homepage' | 'promotions_page',
  value: boolean,
) {
  const col = placement === 'homepage' ? 'show_on_homepage' : 'show_on_promotions_page'
  const supabase = createAdminClient()
  if (value) {
    await supabase.from('global_promotions').update({ [col]: false }).neq('id', id)
  }
  await supabase.from('global_promotions').update({ [col]: value }).eq('id', id)
  revalidatePath('/admin/promotions')
  revalidatePath('/')
  revalidatePath('/promotions')
  return { success: true as const }
}

export async function createPromotion(name: string, discountPct: number) {
  if (!name.trim()) return { error: 'Name is required.' }
  if (discountPct <= 0 || discountPct > 100) return { error: 'Discount must be between 1 and 100.' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('global_promotions')
    .insert({ name: name.trim(), discount_pct: discountPct })

  if (error) return { error: error.message }
  revalidatePath('/admin/promotions')
  return { success: true as const }
}

export async function deletePromotion(id: string) {
  const supabase = createAdminClient()
  const { data: promo } = await supabase
    .from('global_promotions')
    .select('is_active')
    .eq('id', id)
    .single()

  if (promo?.is_active) return { error: 'Deactivate the promotion before deleting it.' }

  const { error } = await supabase.from('global_promotions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/promotions')
  return { success: true as const }
}

export async function addProductToPromotion(promoId: string, productId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promotion_products')
    .insert({ promotion_id: promoId, product_id: productId })
  if (error) return { error: error.message }
  revalidatePath('/admin/promotions')
  return { success: true as const }
}

export async function removeProductFromPromotion(promoId: string, productId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promotion_products')
    .delete()
    .eq('promotion_id', promoId)
    .eq('product_id', productId)
  if (error) return { error: error.message }
  revalidatePath('/admin/promotions')
  return { success: true as const }
}

// ── Activate ──────────────────────────────────────────────────────────────────
// If specific products are linked → apply discount only to those.
// If no products linked → apply to ALL active products (global sale).
export async function activatePromotion(id: string) {
  const supabase = createAdminClient()

  const { data: promo } = await supabase
    .from('global_promotions')
    .select('discount_pct, is_active')
    .eq('id', id)
    .single()

  if (!promo) return { error: 'Promotion not found.' }
  if (promo.is_active) return { error: 'Already active.' }

  const { data: active } = await supabase
    .from('global_promotions')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  if (active) return { error: 'Another promotion is already active. Deactivate it first.' }

  // Check for specifically-linked products
  const { data: linked } = await supabase
    .from('promotion_products')
    .select('product_id')
    .eq('promotion_id', id)

  const linkedIds = (linked ?? []).map(l => l.product_id)
  const isSelective = linkedIds.length > 0

  const pct = Number(promo.discount_pct)
  const multiplier = 1 - pct / 100

  let productsQuery = supabase
    .from('products')
    .select('id, price, compare_at_price, promo_original_price')
    .eq('is_active', true)

  if (isSelective) productsQuery = productsQuery.in('id', linkedIds)

  const { data: products, error: fetchErr } = await productsQuery
  if (fetchErr) return { error: fetchErr.message }

  for (const p of products ?? []) {
    if (p.promo_original_price != null) continue
    const originalPrice = Number(p.price)
    const discountedPrice = Math.round(originalPrice * multiplier * 100) / 100
    await supabase.from('products').update({
      promo_original_price: originalPrice,
      compare_at_price: p.compare_at_price ?? originalPrice,
      price: discountedPrice,
    }).eq('id', p.id)
  }

  await supabase
    .from('global_promotions')
    .update({ is_active: true, applied_at: new Date().toISOString() })
    .eq('id', id)

  revalidateAll()
  return { success: true as const, count: (products ?? []).length }
}

// ── Deactivate ────────────────────────────────────────────────────────────────
export async function deactivatePromotion(id: string) {
  const supabase = createAdminClient()

  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id, price, compare_at_price, promo_original_price')
    .not('promo_original_price', 'is', null)

  if (fetchErr) return { error: fetchErr.message }

  for (const p of products ?? []) {
    const origPrice = Number(p.promo_original_price)
    const restoreCompareAt =
      p.compare_at_price != null && Number(p.compare_at_price) === origPrice
        ? null
        : p.compare_at_price

    await supabase.from('products').update({
      price: origPrice,
      compare_at_price: restoreCompareAt,
      promo_original_price: null,
    }).eq('id', p.id)
  }

  await supabase
    .from('global_promotions')
    .update({ is_active: false })
    .eq('id', id)

  revalidateAll()
  return { success: true as const }
}
