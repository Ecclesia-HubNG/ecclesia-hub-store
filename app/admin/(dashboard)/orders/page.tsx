import { createAdminClient } from '@/lib/supabase/admin'
import OrdersManager from '@/components/admin/OrdersManager'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const supabase = createAdminClient()

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from('orders').select('id, created_at, total, status, customer_id, items, shipping_address, payment_reference, order_channel, is_manual, deleted_at').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, price, thumbnail, stock').eq('is_active', true).order('name'),
  ])

  // Fetch customer names/emails separately — orders.customer_id → auth.users,
  // but PostgREST can only auto-join public tables, so we do it manually.
  const customerIds = Array.from(new Set((orders ?? []).map(o => o.customer_id).filter(Boolean)))
  const { data: customers } = customerIds.length
    ? await supabase.from('customers').select('id, full_name, email').in('id', customerIds)
    : { data: [] }

  const customerMap = Object.fromEntries((customers ?? []).map(c => [c.id, c]))

  const enriched = (orders ?? []).map(o => ({
    ...o,
    customers: o.customer_id ? (customerMap[o.customer_id] ?? null) : null,
  }))

  return (
    <div className="p-8">
      <OrdersManager orders={enriched as any} products={products ?? []} />
    </div>
  )
}
