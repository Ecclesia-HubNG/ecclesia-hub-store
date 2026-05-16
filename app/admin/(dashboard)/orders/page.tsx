import { createAdminClient } from '@/lib/supabase/admin'
import OrdersManager from '@/components/admin/OrdersManager'

export default async function AdminOrdersPage() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, customers(full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <OrdersManager orders={(orders ?? []) as any} />
    </div>
  )
}
