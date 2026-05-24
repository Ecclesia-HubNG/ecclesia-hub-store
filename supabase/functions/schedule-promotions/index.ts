import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  // Protect with a shared secret when called from an external cron
  const authHeader = req.headers.get('authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date().toISOString()
  const log: string[] = []

  // ── Auto-deactivate expired promotions ────────────────────────────────────
  const { data: toDeactivate } = await supabase
    .from('global_promotions')
    .select('id, name')
    .eq('is_active', true)
    .lt('ends_at', now)

  for (const promo of toDeactivate ?? []) {
    const { data: products } = await supabase
      .from('products')
      .select('id, price, compare_at_price, promo_original_price')
      .not('promo_original_price', 'is', null)

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
      .eq('id', promo.id)

    log.push(`Deactivated: ${promo.name}`)
  }

  // ── Auto-activate scheduled promotions ────────────────────────────────────
  // Only if no promotion is currently active
  const { data: currentActive } = await supabase
    .from('global_promotions')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  if (!currentActive) {
    const { data: toActivate } = await supabase
      .from('global_promotions')
      .select('id, name, discount_pct, max_discount_amount')
      .eq('is_active', false)
      .lte('starts_at', now)
      .or('ends_at.is.null,ends_at.gt.' + now)
      .order('starts_at', { ascending: true })
      .limit(1)

    const promo = toActivate?.[0]
    if (promo) {
      const { data: linked } = await supabase
        .from('promotion_products')
        .select('product_id')
        .eq('promotion_id', promo.id)

      const linkedIds = (linked ?? []).map((l: { product_id: string }) => l.product_id)
      const isSelective = linkedIds.length > 0

      const pct = Number(promo.discount_pct)
      const cap = promo.max_discount_amount != null ? Number(promo.max_discount_amount) : null

      let q = supabase
        .from('products')
        .select('id, price, compare_at_price, promo_original_price')
        .eq('is_active', true)
      if (isSelective) q = q.in('id', linkedIds)

      const { data: products } = await q

      for (const p of products ?? []) {
        if (p.promo_original_price != null) continue
        const originalPrice = Number(p.price)
        const discountAmount = cap !== null
          ? Math.min(originalPrice * pct / 100, cap)
          : originalPrice * pct / 100
        const discountedPrice = Math.round((originalPrice - discountAmount) * 100) / 100
        await supabase.from('products').update({
          promo_original_price: originalPrice,
          compare_at_price: p.compare_at_price ?? originalPrice,
          price: discountedPrice,
        }).eq('id', p.id)
      }

      await supabase
        .from('global_promotions')
        .update({ is_active: true, applied_at: now })
        .eq('id', promo.id)

      log.push(`Activated: ${promo.name} (${(products ?? []).length} products)`)
    }
  }

  return Response.json({ ok: true, actions: log, timestamp: now })
})
