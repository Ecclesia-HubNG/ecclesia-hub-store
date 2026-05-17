import { createAdminClient } from '@/lib/supabase/admin'
import TransactionsManager from '@/components/admin/TransactionsManager'

export default async function FinanceTransactionsPage() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, total, status, created_at, shipping_address, payment_reference')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <TransactionsManager orders={(orders ?? []) as any} />
    </div>
  )
}
