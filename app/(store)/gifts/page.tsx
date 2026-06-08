export const revalidate = 60

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ShopClient from '@/components/store/ShopClient'

export default async function GiftsPage() {
  const supabase = createClient()

  const { data: giftCategories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_gift', true)

  const categoryIds = (giftCategories ?? []).map(c => c.id)

  const [{ data: allCategories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').is('parent_id', null).order('name'),
    categoryIds.length > 0
      ? supabase
          .from('products')
          .select('id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name)')
          .eq('is_active', true)
          .in('category_id', categoryIds)
          .order('name')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <Suspense>
      <ShopClient
        products={(products ?? []) as any}
        categories={allCategories ?? []}
        pageTag="Gift Items"
        pageTitle="Gift Items"
      />
    </Suspense>
  )
}
