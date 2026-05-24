export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import PromotionsManager from '@/components/admin/PromotionsManager'

export default async function PromotionsPage() {
  const supabase = createAdminClient()

  const [{ data: rawPromos }, { data: allProducts }] = await Promise.all([
    supabase
      .from('global_promotions')
      .select(`
        id, name, discount_pct, is_active, applied_at, created_at,
        show_on_homepage, show_on_promotions_page,
        promotion_products ( product_id, products ( id, name, thumbnail, price ) )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name, thumbnail, price')
      .eq('is_active', true)
      .order('name'),
  ])

  const promotions = (rawPromos ?? []).map(p => ({
    id: p.id,
    name: p.name,
    discount_pct: p.discount_pct,
    is_active: p.is_active,
    applied_at: p.applied_at,
    created_at: p.created_at,
    show_on_homepage: p.show_on_homepage,
    show_on_promotions_page: p.show_on_promotions_page,
    products: (p.promotion_products ?? [])
      .map((pp: any) => pp.products)
      .filter(Boolean),
  }))

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Promotions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Create promotions with a discount %. Assign products (or apply to all). Pin one to the homepage and one to the Promotions page.
        </p>
      </div>
      <PromotionsManager
        initial={promotions as any}
        allProducts={(allProducts ?? []) as any}
      />
    </div>
  )
}
