import { createAdminClient } from '@/lib/supabase/admin'
import { SupportManager } from '@/components/admin/SupportManager'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  const supabase = createAdminClient()

  // Get all messages grouped by user
  const { data: messages } = await supabase
    .from('inbox_messages')
    .select('id, user_id, subject, body, sender, read_at, created_at')
    .order('created_at', { ascending: true })

  // Get user profiles for names/emails
  const userIds = Array.from(new Set((messages ?? []).map(m => m.user_id)))
  const { data: authUsers } = userIds.length
    ? await supabase.auth.admin.listUsers()
    : { data: { users: [] } }

  const userMap = Object.fromEntries(
    (authUsers?.users ?? []).map(u => [
      u.id,
      { email: u.email ?? '', name: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? 'Unknown' }
    ])
  )

  // Group into conversations
  type Msg = NonNullable<typeof messages>[number]
  const conversations: Record<string, {
    userId: string
    name: string
    email: string
    messages: Msg[]
    hasUnread: boolean
    lastAt: string
  }> = {}

  for (const msg of messages ?? []) {
    if (!conversations[msg.user_id]) {
      conversations[msg.user_id] = {
        userId: msg.user_id,
        name: userMap[msg.user_id]?.name ?? 'Unknown',
        email: userMap[msg.user_id]?.email ?? '',
        messages: [],
        hasUnread: false,
        lastAt: msg.created_at,
      }
    }
    conversations[msg.user_id].messages!.push(msg)
    if (msg.sender === 'customer' && !msg.read_at) conversations[msg.user_id].hasUnread = true
    conversations[msg.user_id].lastAt = msg.created_at
  }

  const convList = Object.values(conversations).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  )

  return (
    <div className="p-8 h-full">
      <SupportManager conversations={convList} />
    </div>
  )
}
