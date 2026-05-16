import { createAdminClient } from '@/lib/supabase/admin'
import CouponsManager from '@/components/admin/CouponsManager'

export default async function CouponsPage() {
  const supabase = createAdminClient()

  const [{ data: coupons }, { data: products }, { data: categories }] = await Promise.all([
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, thumbnail').order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ])

  return (
    <div className="p-8">
      <CouponsManager
        coupons={coupons ?? []}
        products={products ?? []}
        categories={categories ?? []}
      />
    </div>
  )
}
