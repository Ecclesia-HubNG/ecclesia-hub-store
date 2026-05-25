import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation } from '@/lib/email'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'

function verifyHash(hash: string): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_HASH
  if (!secret) return false
  return hash === secret
}

export async function POST(req: NextRequest) {
  const hash = req.headers.get('verif-hash') ?? ''

  if (!verifyHash(hash)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: { event: string; data: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only handle successful charges
  if (payload.event !== 'charge.completed') {
    return NextResponse.json({ received: true })
  }

  const tx = payload.data as {
    tx_ref: string
    status: string
    amount: number
    currency: string
    id: number
    payment_type: string
    card?: { type?: string }
    bank?: string
  }

  if (tx.status !== 'successful' || tx.currency !== 'NGN' || !tx.tx_ref) {
    return NextResponse.json({ received: true })
  }

  // Re-verify with Flutterwave API (never trust the webhook payload alone)
  const verifyRes = await fetch(
    `https://api.flutterwave.com/v3/transactions/${tx.id}/verify`,
    { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }, cache: 'no-store' }
  )

  if (!verifyRes.ok) {
    return NextResponse.json({ error: 'Could not re-verify transaction' }, { status: 500 })
  }

  const verified = await verifyRes.json()
  if (verified.status !== 'success' || verified.data?.status !== 'successful') {
    return NextResponse.json({ received: true })
  }

  const verifiedAmount: number = verified.data.amount

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total, shipping_address, items')
    .eq('payment_reference', tx.tx_ref)
    .single()

  if (!order || order.status !== 'pending') {
    return NextResponse.json({ received: true })
  }

  // Amount guard (Flutterwave amounts are in Naira)
  const expectedNaira = order.total as number
  if (Math.abs(verifiedAmount - expectedNaira) > 1) {
    console.error(`FLW webhook amount mismatch for order ${order.id}: expected ${expectedNaira}, got ${verifiedAmount}`)
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_metadata: {
        provider: 'flutterwave',
        transaction_id: tx.id,
        payment_type: tx.payment_type,
        card_type: tx.card?.type ?? null,
        bank: tx.bank ?? null,
        source: 'webhook',
      },
    })
    .eq('id', order.id)
    .eq('status', 'pending')

  if (updateErr) {
    console.error('FLW webhook order update failed:', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  logAudit('order.paid', 'order', order.id, {
    provider: 'flutterwave',
    transaction_id: tx.id,
    reference: tx.tx_ref,
    amount: verifiedAmount,
    payment_type: tx.payment_type,
  }, { email: 'flutterwave-webhook' }).catch(() => {})

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
