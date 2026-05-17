import { createAdminClient } from '@/lib/supabase/admin'
import EmailsManager from '@/components/admin/EmailsManager'

export default async function AdminEmailsPage() {
  const supabase = createAdminClient()

  const [{ data: customers }, { data: products }, { data: logs }] = await Promise.all([
    supabase.from('customers').select('email').not('email', 'is', null).eq('is_archived', false).eq('is_blocked', false),
    supabase.from('products').select('id, name, price, compare_at_price, thumbnail, slug').eq('is_active', true).order('created_at', { ascending: false }).limit(50),
    supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(200),
  ])

  return (
    <div className="p-8">
      <EmailsManager
        logs={(logs ?? []) as any}
        products={(products ?? []) as any}
        totalCustomers={(customers ?? []).length}
      />
    </div>
  )
}
