import { createAdminClient } from '@/lib/supabase/admin'
import { CustomersManager } from '@/components/admin/CustomersManager'

export default async function AdminCustomersPage() {
  const supabase = createAdminClient()
  const [{ data: guestCustomers }, { data: orders }, { data: authUsers }] = await Promise.all([
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('customer_id'),
    supabase.auth.admin.listUsers(),
  ])

  const orderCustomerIds = (orders ?? [])
    .map(o => o.customer_id)
    .filter(Boolean) as string[]

  // Registered users with customer role, not already in the guests/orders table
  const guestEmails = new Set((guestCustomers ?? []).map(c => c.email).filter(Boolean))
  const registeredCustomers = (authUsers?.users ?? [])
    .filter(u => u.app_metadata?.role === 'customer' && u.email && !guestEmails.has(u.email))
    .map(u => ({
      id: u.id,
      full_name: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? null,
      email: u.email ?? null,
      phone: null,
      created_at: u.created_at,
      shipping_address: null,
      is_blocked: false,
      is_archived: false,
      notes: null,
    }))

  const allCustomers = [...(guestCustomers ?? []), ...registeredCustomers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="p-8">
      <CustomersManager customers={allCustomers} orderCustomerIds={orderCustomerIds} />
    </div>
  )
}
