'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation } from '@/lib/email'

const PAYSTACK_BASE = 'https://api.paystack.co'

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return key
}

export async function initializePayment(orderId: string, email: string, amountNaira: number) {
  try {
    const key = secretKey()
    const reference = `EH-${orderId.replace(/-/g, '').slice(0, 10)}-${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountNaira * 100), // kobo
        reference,
        callback_url: callbackUrl,
        metadata: { order_id: orderId, cancel_action: `${process.env.NEXT_PUBLIC_APP_URL}/checkout` },
        currency: 'NGN',
      }),
    })

    if (!res.ok) return { error: 'Payment provider unavailable. Please try again.' }
    const json = await res.json()
    if (!json.status) return { error: json.message ?? 'Could not initialize payment.' }

    const { authorization_url } = json.data as { authorization_url: string }

    // Persist reference on order so webhook/verify can look it up
    const supabase = createAdminClient()
    await supabase
      .from('orders')
      .update({ payment_reference: reference })
      .eq('id', orderId)

    return { authorizationUrl: authorization_url, reference }
  } catch {
    return { error: 'Payment initialization failed.' }
  }
}

export async function verifyAndFinalizeOrder(reference: string) {
  if (!reference?.trim()) return { error: 'Missing payment reference.' }

  try {
    const key = secretKey()

    // Re-verify with Paystack (never trust the client)
    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' }
    )

    if (!res.ok) return { error: 'Could not verify payment.' }
    const json = await res.json()
    if (!json.status) return { error: 'Verification failed.' }

    const tx = json.data as {
      status: string
      amount: number
      channel: string
      authorization?: { bank?: string; card_type?: string }
    }

    if (tx.status !== 'success') return { error: `Payment was not successful (status: ${tx.status}).` }

    const supabase = createAdminClient()

    const { data: order } = await supabase
      .from('orders')
      .select('id, status, total, shipping_address, items')
      .eq('payment_reference', reference)
      .single()

    if (!order) return { error: 'Order not found for this payment.' }

    // Already processed (idempotent — safe to redirect)
    if (order.status !== 'pending') return { orderId: order.id }

    // Amount verification — reject if Paystack amount doesn't match what we stored
    const expectedKobo = Math.round((order.total as number) * 100)
    if (tx.amount !== expectedKobo) return { error: 'Payment amount does not match order total.' }

    // Mark paid (eq status check makes this atomic/idempotent)
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_metadata: {
          channel: tx.channel,
          bank: tx.authorization?.bank ?? null,
          card_type: tx.authorization?.card_type ?? null,
        },
      })
      .eq('id', order.id)
      .eq('status', 'pending')

    if (updateErr) return { error: updateErr.message }

    // Confirmation email (non-blocking)
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
        variant: i.selectedVariant
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

    return { orderId: order.id }
  } catch {
    return { error: 'An unexpected error occurred during verification.' }
  }
}
