import { createAdminClient } from '@/lib/supabase/admin'
import PromoComposer from '@/components/admin/PromoComposer'

export default async function PromoPage() {
  const admin = createAdminClient()

  const [{ data: products }, { count: customerCount }, { count: subscriberCount }, { data: authUsers }] = await Promise.all([
    admin.from('products').select('id, name, price, compare_at_price, thumbnail, slug').eq('is_active', true).order('name').limit(200),
    admin.from('customers').select('*', { count: 'exact', head: true }).not('email', 'is', null).eq('is_archived', false).eq('is_blocked', false),
    admin.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const userCount = (authUsers?.users ?? []).filter((u: any) => u.app_metadata?.role).length

  return (
    <div className="p-8">
      <PromoComposer
        products={(products ?? []) as any}
        totalCustomers={customerCount ?? 0}
        totalSubscribers={subscriberCount ?? 0}
        totalUsers={userCount}
      />
    </div>
  )
}
