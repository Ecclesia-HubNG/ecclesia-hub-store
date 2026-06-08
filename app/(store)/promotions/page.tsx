export const revalidate = 60

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ShopClient from '@/components/store/ShopClient'

export default async function PromotionsPage() {
  const supabase = createClient()
  const admin = createAdminClient()

  // Check for a promotion pinned to the promotions page
  const { data: pagePromo } = await admin
    .from('global_promotions')
    .select('id, name, discount_pct')
    .eq('show_on_promotions_page', true)
    .maybeSingle()

  const [{ data: categories }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').is('parent_id', null).order('name'),
  ])

  let products: any[] = []
  let title = 'Promotions & Deals'
  let tag = 'On Sale'

  if (pagePromo) {
    // Show products linked to this specific promotion
    const { data: linked } = await admin
      .from('promotion_products')
      .select('products ( id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name) )')
      .eq('promotion_id', pagePromo.id)

    const linkedProducts = (linked ?? []).map((r: any) => r.products).filter(Boolean)

    // If no specific products linked, fall back to all discounted products
    if (linkedProducts.length > 0) {
      products = linkedProducts
    } else {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name)')
        .eq('is_active', true)
        .not('compare_at_price', 'is', null)
        .gt('compare_at_price', 0)
        .order('name')
      products = data ?? []
    }

    title = pagePromo.name
    tag = `${pagePromo.discount_pct}% Off`
  } else {
    // No promo pinned — show all currently-discounted products
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name)')
      .eq('is_active', true)
      .not('compare_at_price', 'is', null)
      .gt('compare_at_price', 0)
      .order('name')
    products = data ?? []
  }

  return (
    <Suspense>
      <ShopClient
        products={products as any}
        categories={categories ?? []}
        pageTag={tag}
        pageTitle={title}
      />
    </Suspense>
  )
}
