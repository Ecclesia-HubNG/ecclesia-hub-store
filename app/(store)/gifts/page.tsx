export const revalidate = 60

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ShopClient from '@/components/store/ShopClient'

export default async function GiftsPage() {
  const supabase = createClient()

  const [{ data: giftCategories }, { data: allCategories }] = await Promise.all([
    supabase.from('categories').select('id').eq('is_gift', true),
    supabase.from('categories').select('id, name, slug').is('parent_id', null).order('name'),
  ])

  const giftCategoryIds = (giftCategories ?? []).map(c => c.id)

  // Products tagged directly as gift OR products in gift categories
  let query = supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name)')
    .eq('is_active', true)
    .gt('stock', 0)

  const { data: directProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name)')
    .eq('is_active', true)
    .gt('stock', 0)
    .eq('is_gift', true)

  const { data: categoryProducts } = giftCategoryIds.length > 0
    ? await supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name)')
        .eq('is_active', true)
        .gt('stock', 0)
        .in('category_id', giftCategoryIds)
    : { data: [] }

  // Merge and deduplicate by id
  const seen = new Set<string>()
  const products: any[] = []
  for (const p of [...(directProducts ?? []), ...(categoryProducts ?? [])]) {
    if (!seen.has(p.id)) { seen.add(p.id); products.push(p) }
  }
  products.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Suspense>
      <ShopClient
        products={products}
        categories={allCategories ?? []}
        pageTag="Gift Items"
        pageTitle="Gift Items"
      />
    </Suspense>
  )
}
