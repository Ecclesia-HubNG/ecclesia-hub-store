export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { ProductsManager } from '@/components/admin/ProductsManager'

export default async function AdminProductsPage({ searchParams }: { searchParams: { page?: string } }) {
  const initialPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const supabase = createAdminClient()

  const [{ data: products }, { data: categories }, { data: brands }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, thumbnail, price, compare_at_price, stock, is_active, is_featured, created_at, category_id, brand_id, categories(name)')
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('brands').select('id, name').order('name'),
  ])

  return (
    <div className="p-8">
      <ProductsManager
        products={(products ?? []) as any}
        categories={categories ?? []}
        brands={brands ?? []}
        initialPage={initialPage}
      />
    </div>
  )
}
