import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewsletter, sendPromoEmail } from '@/lib/email'
import type { PromoEmailProps } from '@/emails/PromoEmail'

export async function POST(req: NextRequest) {
  // Verify the caller is an authenticated admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = user.app_metadata?.role ?? ''
  if (!['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { type } = body

  // Fetch all customer emails
  const admin = createAdminClient()
  const { data: customers } = await admin.from('customers').select('email').not('email', 'is', null).eq('is_archived', false).eq('is_blocked', false)
  const emails = (customers ?? []).map((c: any) => c.email).filter(Boolean) as string[]

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No customers to send to' }, { status: 400 })
  }

  if (type === 'newsletter') {
    const { subject, body: content, issueNumber } = body
    if (!subject || !content) return NextResponse.json({ error: 'subject and body required' }, { status: 400 })
    const result = await sendNewsletter(emails, { subject, body: content, issueNumber })
    return NextResponse.json({ success: true, ...result })
  }

  if (type === 'promo') {
    const props: PromoEmailProps = body.props
    if (!props?.subject) return NextResponse.json({ error: 'props.subject required' }, { status: 400 })
    const result = await sendPromoEmail(emails, props)
    return NextResponse.json({ success: true, ...result })
  }

  return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
}
