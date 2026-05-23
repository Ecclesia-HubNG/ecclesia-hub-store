import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation } from '@/lib/email'

export const runtime = 'nodejs'

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return false
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
  return expected === signature
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const rawBody = await req.text()

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const tx = event.data as {
    reference: string
    status: string
    amount: number
    channel: string
    authorization?: { bank?: string; card_type?: string }
  }

  if (tx.status !== 'success' || !tx.reference) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total, shipping_address, items')
    .eq('payment_reference', tx.reference)
    .single()

  if (!order || order.status !== 'pending') {
    return NextResponse.json({ received: true })
  }

  // Amount guard
  const expectedKobo = Math.round((order.total as number) * 100)
  if (tx.amount !== expectedKobo) {
    console.error(`Webhook amount mismatch for order ${order.id}: expected ${expectedKobo}, got ${tx.amount}`)
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_metadata: {
        channel: tx.channel,
        bank: tx.authorization?.bank ?? null,
        card_type: tx.authorization?.card_type ?? null,
        source: 'webhook',
      },
    })
    .eq('id', order.id)
    .eq('status', 'pending')

  if (updateErr) {
    console.error('Webhook order update failed:', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const shipping = order.shipping_address as Record<string, string>
  const items = (order.items as Array<Record<string, unknown>>) ?? []
  sendOrderConfirmation(shipping.email, {
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    customerName: `${shipping.firstName} ${shipping.lastName}`,
    items: items.map(i => ({
      name: i.name as string,
      quantity: i.quantity as number,
      price: i.price as number,
      thumbnail: (i.thumbnail as string) ?? undefined,
      variant: Array.isArray(i.selectedVariants) && (i.selectedVariants as Array<{ value: string }>).length
        ? (i.selectedVariants as Array<{ value: string }>).map(sv => sv.value).join(', ')
        : i.selectedVariant
        ? Object.values(i.selectedVariant as Record<string, string>).join(' / ')
        : undefined,
    })),
    subtotal: order.total as number,
    shipping: 0,
    total: order.total as number,
    shippingAddress: {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      phone: shipping.phone,
      address: shipping.address,
      city: shipping.city,
      state: shipping.state,
    },
  }).catch(() => {})

  return NextResponse.json({ received: true })
}
