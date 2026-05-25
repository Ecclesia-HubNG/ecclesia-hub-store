export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ShopClient from '@/components/store/ShopClient'

export default async function ShopPage() {
  const supabase = createClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, category_id, is_featured, is_new_arrival, variants, categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  return (
    <Suspense>
      <ShopClient
        products={(products ?? []) as any}
        categories={categories ?? []}
      />
    </Suspense>
  )
}
