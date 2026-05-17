import { createAdminClient } from '@/lib/supabase/admin'
import EmailLogs from '@/components/admin/EmailLogs'

export default async function EmailLogsPage() {
  const admin = createAdminClient()

  const { data: logs } = await admin
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="p-8">
      <EmailLogs logs={(logs ?? []) as any} />
    </div>
  )
}
