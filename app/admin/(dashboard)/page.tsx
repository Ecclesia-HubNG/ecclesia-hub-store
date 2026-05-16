import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/admin/DashboardClient'

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, stock, is_active, thumbnail, price'),
  ])

  const customerCount = new Set(orders?.map(o => o.customer_id).filter(Boolean)).size

  return (
    <DashboardClient
      orders={orders ?? []}
      products={products ?? []}
      customerCount={customerCount}
    />
  )
}
