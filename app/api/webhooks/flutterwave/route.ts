import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'
import { qstash } from '@/lib/qstash'
import type { OrderJobPayload } from '@/app/api/jobs/order-confirmation/route'
import { logOrderEvent } from '@/lib/actions/order-events'
import { decrementStock } from '@/lib/stock'

export const runtime = 'nodejs'

function verifyHash(hash: string): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_HASH
  if (!secret) return false
  return hash === secret
}

type FlwTx = {
  tx_ref: string
  status: string
  amount: number
  currency: string
  id: number
  payment_type: string
  card?: { type?: string }
  bank?: string
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

  // Handle explicit charge.failed events
  if (payload.event === 'charge.failed') {
    const tx = payload.data as FlwTx
    if (tx.tx_ref) await markPaymentFailed(tx.tx_ref, tx.id)
    return NextResponse.json({ received: true })
  }

  if (payload.event !== 'charge.completed') {
    return NextResponse.json({ received: true })
  }

  const tx = payload.data as FlwTx

  // Non-successful charge — mark failed and notify
  if (tx.status !== 'successful' || tx.currency !== 'NGN' || !tx.tx_ref) {
    if (tx.tx_ref && tx.status !== 'successful') await markPaymentFailed(tx.tx_ref, tx.id)
    return NextResponse.json({ received: true })
  }

  // Re-verify with Flutterwave API (never trust the webhook payload alone)
  const verifyRes = await fetch(
    `https://api.flutterwave.com/v3/transactions/${tx.id}/verify`,
    { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }, cache: 'no-store' },
  )

  if (!verifyRes.ok) {
    return NextResponse.json({ error: 'Could not re-verify transaction' }, { status: 500 })
  }

  const verified = await verifyRes.json()
  if (verified.status !== 'success' || verified.data?.status !== 'successful') {
    await markPaymentFailed(tx.tx_ref, tx.id)
    return NextResponse.json({ received: true })
  }

  const verifiedAmount: number = verified.data.amount
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total, subtotal, shipping_fee, shipping_address, items')
    .eq('payment_reference', tx.tx_ref)
    .maybeSingle()

  // Already processing (verify page beat the webhook) — nothing to do
  if (!order || order.status === 'processing') {
    return NextResponse.json({ received: true })
  }

  // Only process orders we created (pending_verification) or legacy pending orders
  if (order.status !== 'pending_verification' && order.status !== 'pending') {
    return NextResponse.json({ received: true })
  }

  // Amount guard
  if (Math.abs(verifiedAmount - (order.total as number)) > 1) {
    console.error(`FLW webhook amount mismatch for order ${order.id}: expected ${order.total}, got ${verifiedAmount}`)
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'processing',
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
    .in('status', ['pending_verification', 'pending'])

  if (updateErr) {
    console.error('FLW webhook order update failed:', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Clean up checkout session
  await supabase.from('checkout_sessions').delete().eq('tx_ref', tx.tx_ref)

  // Decrement stock — variant stock for items with a selected variant,
  // otherwise the product's own stock count.
  type SessionItem = {
    productId: string
    selectedVariants: Array<{ groupName: string; value: string }> | null
    quantity: number
  }
  const cartItems = (order.items as SessionItem[]) ?? []
  await decrementStock(supabase, cartItems)

  logAudit('order.paid', 'order', order.id, {
    provider: 'flutterwave',
    transaction_id: tx.id,
    reference: tx.tx_ref,
    amount: verifiedAmount,
    payment_type: tx.payment_type,
    source: 'webhook',
  }, { email: 'flutterwave-webhook' }).catch(() => {})

  await logOrderEvent(order.id, 'payment', `Payment confirmed via Flutterwave — ₦${Number(verifiedAmount).toLocaleString('en')} (ref: ${tx.tx_ref})`)
  await logOrderEvent(order.id, 'status', 'Status changed to processing')

  const shipping = order.shipping_address as Record<string, string>
  const items = (order.items as Array<Record<string, unknown>>) ?? []
  const orderNum = order.id.slice(0, 8).toUpperCase()
  const emailItems = items.map(i => ({
    name: i.name as string,
    quantity: i.quantity as number,
    price: i.price as number,
    thumbnail: (i.thumbnail as string) ?? undefined,
    variant: Array.isArray(i.selectedVariants) && (i.selectedVariants as Array<{ value: string }>).length
      ? (i.selectedVariants as Array<{ value: string }>).map(sv => sv.value).join(', ')
      : undefined,
  }))

  const jobPayload: OrderJobPayload = {
    type: 'order_processing',
    to: shipping.email,
    props: {
      orderNumber: orderNum,
      orderId: order.id,
      customerName: `${shipping.firstName} ${shipping.lastName}`,
      items: emailItems,
      subtotal: (order.subtotal ?? order.total) as number,
      shipping: (order.shipping_fee ?? 0) as number,
      total: order.total as number,
      shippingAddress: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
      },
    },
    adminProps: {
      orderNumber: orderNum,
      orderId: order.id,
      customerName: `${shipping.firstName} ${shipping.lastName}`,
      customerEmail: shipping.email,
      customerPhone: shipping.phone,
      total: order.total as number,
      paymentMethod: 'flutterwave',
      status: 'processing',
      items: emailItems,
      address: shipping.address,
      city: shipping.city,
      state: shipping.state,
      event: 'payment_confirmed' as const,
    },
  }

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/jobs/order-confirmation`,
    body: jobPayload,
    retries: 3,
    delay: 0,
  }).catch((err) => console.error('[flutterwave-webhook] qstash enqueue failed:', err?.message))

  await logOrderEvent(order.id, 'email', `Order processing email sent to ${shipping.email}`)

  return NextResponse.json({ received: true })
}

async function markPaymentFailed(txRef: string, txId: number) {
  try {
    const supabase = createAdminClient()
    const { data: order } = await supabase
      .from('orders')
      .select('id, shipping_address')
      .eq('payment_reference', txRef)
      .eq('status', 'pending_verification')
      .maybeSingle()

    if (!order) return

    await supabase
      .from('orders')
      .update({
        status: 'payment_failed',
        payment_metadata: { provider: 'flutterwave', transaction_id: txId, source: 'webhook_failed' },
      })
      .eq('id', order.id)

    await logOrderEvent(order.id, 'status', 'Status changed to payment_failed')

    const s = order.shipping_address as Record<string, string>

    // Import dynamically to avoid circular deps at module level
    const { sendPaymentFailed } = await import('@/lib/email')
    await sendPaymentFailed(s.email, {
      customerName: `${s.firstName} ${s.lastName}`,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
    }).catch(() => {})
    await logOrderEvent(order.id, 'email', `Payment failed email sent to ${s.email}`)
  } catch (err) {
    console.error('[flutterwave-webhook] markPaymentFailed error:', err)
  }
}
