import { createAdminClient } from '@/lib/supabase/admin'
import FinanceOverview from '@/components/admin/FinanceOverview'

export default async function FinancePage() {
  const supabase = createAdminClient()

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status, created_at, shipping_address, payment_reference')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name, price, cost_price, stock, is_active')
      .order('name'),
  ])

  return (
    <div className="p-8">
      <FinanceOverview orders={(orders ?? []) as any} products={(products ?? []) as any} />
    </div>
  )
}
