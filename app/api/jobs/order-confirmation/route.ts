import { NextRequest, NextResponse } from 'next/server'
import { qstashReceiver } from '@/lib/qstash'
import { sendOrderConfirmation, sendOrderProcessing, sendPaymentFailed, sendAdminOrderNotification } from '@/lib/email'
import type { OrderConfirmationProps } from '@/emails/OrderConfirmation'
import type { OrderProcessingEmailProps } from '@/emails/OrderProcessingEmail'
import type { PaymentFailedEmailProps } from '@/emails/PaymentFailedEmail'
import type { AdminOrderNotificationEmailProps } from '@/emails/AdminOrderNotificationEmail'

export const runtime = 'nodejs'

export type OrderJobPayload =
  | {
      type: 'order_confirmation'
      to: string
      props: OrderConfirmationProps
      adminProps?: AdminOrderNotificationEmailProps
    }
  | {
      type: 'order_processing'
      to: string
      props: OrderProcessingEmailProps
      adminProps?: AdminOrderNotificationEmailProps
    }
  | {
      type: 'payment_failed'
      to: string
      props: PaymentFailedEmailProps
    }

// Legacy type — kept for backwards compat with any in-flight QStash messages
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

  const parsed = JSON.parse(body) as OrderJobPayload | OrderConfirmationJobPayload

  // Legacy payload (no type field)
  if (!('type' in parsed)) {
    await sendOrderConfirmation(parsed.to, parsed.props)
    return NextResponse.json({ ok: true })
  }

  if (parsed.type === 'order_confirmation') {
    await sendOrderConfirmation(parsed.to, parsed.props)
    if (parsed.adminProps) await sendAdminOrderNotification(parsed.adminProps).catch(() => {})
  } else if (parsed.type === 'order_processing') {
    await sendOrderProcessing(parsed.to, parsed.props)
    if (parsed.adminProps) await sendAdminOrderNotification(parsed.adminProps).catch(() => {})
  } else if (parsed.type === 'payment_failed') {
    await sendPaymentFailed(parsed.to, parsed.props)
  }

  return NextResponse.json({ ok: true })
}
