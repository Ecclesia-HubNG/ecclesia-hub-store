import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

// Supabase Auth webhook — fires on user.created
// Configure in Supabase Dashboard → Auth → Hooks → "Send Email" webhook
// Set URL to: https://ecclesiahub.store/api/webhooks/auth
// Set secret in SUPABASE_WEBHOOK_SECRET env var to verify requests

export async function POST(req: NextRequest) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET
  if (secret) {
    const sig = req.headers.get('x-supabase-signature')
    if (sig !== secret) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const payload = await req.json()
  const { type, record } = payload

  if (type === 'INSERT' && record?.email) {
    const name = record.raw_user_meta_data?.full_name ?? record.email.split('@')[0]
    await sendWelcomeEmail(record.email, { name, email: record.email }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
