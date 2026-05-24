'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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
  // Refuse to delete an active promotion
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

// ── Activate ─────────────────────────────────────────────────────────────────
// 1. Save current price as promo_original_price (skip products already in promo)
// 2. Set compare_at_price = promo_original_price where compare_at_price was null
//    (so the "was ₦X" strikethrough appears on listing cards)
// 3. Set price = ROUND(promo_original_price * (1 - pct/100), 2)
// 4. Mark promotion row as active
export async function activatePromotion(id: string) {
  const supabase = createAdminClient()

  const { data: promo } = await supabase
    .from('global_promotions')
    .select('discount_pct, is_active')
    .eq('id', id)
    .single()

  if (!promo) return { error: 'Promotion not found.' }
  if (promo.is_active) return { error: 'Already active.' }

  // Check no other promotion is running
  const { data: active } = await supabase
    .from('global_promotions')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  if (active) return { error: 'Another promotion is already active. Deactivate it first.' }

  const pct = Number(promo.discount_pct)
  const multiplier = 1 - pct / 100

  // Fetch all active products
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id, price, compare_at_price, promo_original_price')
    .eq('is_active', true)

  if (fetchErr) return { error: fetchErr.message }

  for (const p of products ?? []) {
    // Skip products already tracked by a promo (shouldn't happen, but safety)
    if (p.promo_original_price != null) continue

    const originalPrice = Number(p.price)
    const discountedPrice = Math.round(originalPrice * multiplier * 100) / 100

    await supabase.from('products').update({
      promo_original_price: originalPrice,
      // Set strikethrough only if the product had no sale price before
      compare_at_price: p.compare_at_price ?? originalPrice,
      price: discountedPrice,
    }).eq('id', p.id)
  }

  await supabase
    .from('global_promotions')
    .update({ is_active: true, applied_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/promotions')
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/new-arrivals')
  return { success: true as const, count: (products ?? []).length }
}

// ── Deactivate ────────────────────────────────────────────────────────────────
// 1. Restore price = promo_original_price
// 2. If compare_at_price was set by the promo (== promo_original_price), clear it
// 3. Clear promo_original_price
// 4. Mark promotion as inactive
export async function deactivatePromotion(id: string) {
  const supabase = createAdminClient()

  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id, price, compare_at_price, promo_original_price')
    .not('promo_original_price', 'is', null)

  if (fetchErr) return { error: fetchErr.message }

  for (const p of products ?? []) {
    const origPrice = Number(p.promo_original_price)
    // If compare_at_price was set to the original price by the promo, clear it
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

  revalidatePath('/admin/promotions')
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/new-arrivals')
  return { success: true as const }
}
