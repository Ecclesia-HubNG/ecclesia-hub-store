import { createAdminClient } from '@/lib/supabase/admin'
import CouponsManager from '@/components/admin/CouponsManager'

export default async function CouponsPage() {
  const supabase = createAdminClient()
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <CouponsManager coupons={coupons ?? []} />
    </div>
  )
}
