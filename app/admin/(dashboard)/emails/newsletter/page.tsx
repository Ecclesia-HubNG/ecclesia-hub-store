import { createAdminClient } from '@/lib/supabase/admin'
import NewsletterComposer from '@/components/admin/NewsletterComposer'

export default async function NewsletterPage() {
  const admin = createAdminClient()

  const [{ count: customerCount }, { count: subscriberCount }] = await Promise.all([
    admin.from('customers').select('*', { count: 'exact', head: true }).not('email', 'is', null).eq('is_archived', false).eq('is_blocked', false),
    admin.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return (
    <div className="p-8">
      <NewsletterComposer
        totalCustomers={customerCount ?? 0}
        totalSubscribers={subscriberCount ?? 0}
      />
    </div>
  )
}
