import { NextRequest, NextResponse } from 'next/server'
import { qstashReceiver } from '@/lib/qstash'
import { sendOrderConfirmation } from '@/lib/email'
import type { OrderConfirmationProps } from '@/emails/OrderConfirmation'

export const runtime = 'nodejs'

export type OrderConfirmationJobPayload = {
  to: string
  props: OrderConfirmationProps
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('upstash-signature') ?? ''

  const isValid = await qstashReceiver.verify({
    signature,
    body,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/jobs/order-confirmation`,
  })

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { to, props } = JSON.parse(body) as OrderConfirmationJobPayload

  await sendOrderConfirmation(to, props)

  return NextResponse.json({ ok: true })
}
