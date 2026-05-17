import { createAdminClient } from '@/lib/supabase/admin'
import { CustomersManager } from '@/components/admin/CustomersManager'

export default async function AdminCustomersPage() {
  const supabase = createAdminClient()
  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('customer_id'),
  ])

  const orderCustomerIds = (orders ?? [])
    .map(o => o.customer_id)
    .filter(Boolean) as string[]

  return (
    <div className="p-8">
      <CustomersManager customers={customers ?? []} orderCustomerIds={orderCustomerIds} />
    </div>
  )
}
