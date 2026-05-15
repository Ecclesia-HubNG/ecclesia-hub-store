import { createAdminClient } from '@/lib/supabase/admin'
import { ProductsManager } from '@/components/admin/ProductsManager'

export default async function AdminProductsPage() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, thumbnail, price, compare_at_price, stock, is_active, is_featured, created_at, categories(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <ProductsManager products={(products ?? []) as any} />
    </div>
  )
}
