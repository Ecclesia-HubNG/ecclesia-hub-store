export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ShopClient from '@/components/store/ShopClient'

export default async function PromotionsPage() {
  const supabase = createClient()

  // Find the active promotion name for the page title
  const { data: activePromo } = await supabase
    .from('global_promotions')
    .select('name, discount_pct')
    .eq('is_active', true)
    .maybeSingle()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name)')
      .eq('is_active', true)
      .not('compare_at_price', 'is', null)
      .gt('compare_at_price', 0)
      .order('name'),
  ])

  const title = activePromo ? activePromo.name : 'Promotions & Deals'
  const tag = activePromo ? `${activePromo.discount_pct}% Off` : 'On Sale'

  return (
    <ShopClient
      products={(products ?? []) as any}
      categories={categories ?? []}
      pageTag={tag}
      pageTitle={title}
    />
  )
}
