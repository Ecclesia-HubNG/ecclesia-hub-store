import { createAdminClient } from '@/lib/supabase/admin'
import FinanceOverview from '@/components/admin/FinanceOverview'

export default async function FinancePage() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, total, status, created_at, shipping_address, payment_reference')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <FinanceOverview orders={(orders ?? []) as any} />
    </div>
  )
}
