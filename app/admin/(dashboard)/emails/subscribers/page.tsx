import { createAdminClient } from '@/lib/supabase/admin'
import SubscribersManager from '@/components/admin/SubscribersManager'

export default async function SubscribersPage() {
  const admin = createAdminClient()

  const { data: subscribers } = await admin
    .from('email_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })

  return (
    <div className="p-8">
      <SubscribersManager subscribers={(subscribers ?? []) as any} />
    </div>
  )
}
