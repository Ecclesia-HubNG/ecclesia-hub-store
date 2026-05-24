'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation } from '@/lib/email'

const PAYSTACK_BASE = 'https://api.paystack.co'

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return key
}

// ── Step 1: initialize ─────────────────────────────────────────────────────
// Session-based flow matching Flutterwave: no order is written until payment
// is verified. The checkout_sessions.tx_ref is used for idempotency.
export async function initializePayment(
  sessionId: string,
  email: string,
  amountNaira: number,
  customerName: string,
  phone: string,
) {
  try {
    const key = secretKey()
    const reference = `EH-PS-${sessionId.replace(/-/g, '').slice(0, 10)}-${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: Math.round(amountNaira * 100), // kobo
        reference,
        callback_url: callbackUrl,
        currency: 'NGN',
        metadata: {
          session_id: sessionId,
          customer_name: customerName,
          phone,
          cancel_action: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
        },
      }),
    })

    if (!res.ok) return { error: 'Payment provider unavailable. Please try again.' }
    const json = await res.json()
    if (!json.status) return { error: json.message ?? 'Could not initialize payment.' }

    const { authorization_url } = json.data as { authorization_url: string }

    // Store reference on the checkout session for verify-time lookup
    const supabase = createAdminClient()
    await supabase
      .from('checkout_sessions')
      .update({ tx_ref: reference })
      .eq('id', sessionId)

    return { authorizationUrl: authorization_url }
  } catch {
    return { error: 'Payment initialization failed.' }
  }
}

// ── Step 2: verify + finalise ──────────────────────────────────────────────
// Called when Paystack redirects back with ?reference=xxx.
// Mirrors the Flutterwave flow exactly.
export async function verifyAndFinalizeOrder(reference: string) {
  if (!reference?.trim()) return { error: 'Missing payment reference.' }

  try {
    const key = secretKey()
    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' },
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

    // Idempotency: return existing order if already processed
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_reference', reference)
      .maybeSingle()

    if (existingOrder) return { orderId: existingOrder.id }

    // Find checkout session by stored tx_ref
    const { data: session } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('tx_ref', reference)
      .maybeSingle()

    if (!session) return { error: 'Checkout session not found. It may have expired.' }

    // Amount check (kobo vs naira)
    const expectedKobo = Math.round((session.total as number) * 100)
    if (tx.amount !== expectedKobo) return { error: 'Payment amount does not match order total.' }

    type SessionItem = {
      productId: string; slug: string; name: string; price: number
      quantity: number; thumbnail: string | null; selectedVariants: Array<{ groupName: string; value: string }> | null
    }
    const cartItems = (session.cart_items ?? []) as SessionItem[]
    const shipping = session.shipping as Record<string, string>

    // Create order as paid
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: session.customer_id ?? null,
        status: 'paid',
        total: session.total,
        shipping_fee: session.shipping_fee,
        subtotal: session.subtotal,
        items: cartItems,
        shipping_address: shipping,
        delivery_rate_id: session.delivery_rate_id ?? null,
        delivery_label: session.delivery_label ?? null,
        payment_reference: reference,
        paid_at: new Date().toISOString(),
        order_channel: 'store',
        payment_metadata: {
          provider: 'paystack',
          channel: tx.channel,
          bank: tx.authorization?.bank ?? null,
          card_type: tx.authorization?.card_type ?? null,
        },
      })
      .select('id')
      .single()

    if (orderError) return { error: orderError.message }

    // Decrement variant stock
    const variantItems = cartItems.filter(i => Array.isArray(i.selectedVariants) && i.selectedVariants.length > 0)
    if (variantItems.length > 0) {
      const productIds = Array.from(new Set(variantItems.map(i => i.productId)))
      const { data: products } = await supabase.from('products').select('id, variants').in('id', productIds)

      for (const item of variantItems) {
        const product = products?.find(p => p.id === item.productId)
        if (!product) continue
        type VOption = { value: string; stock?: number | null }
        type VGroup = { name: string; options: VOption[] }
        const productVariants: VGroup[] = Array.isArray(product.variants)
          ? (product.variants as VGroup[]).map(v => ({ ...v, options: [...v.options] })) : []
        let changed = false
        for (const sv of item.selectedVariants ?? []) {
          const gIdx = productVariants.findIndex(v => v.name === sv.groupName)
          if (gIdx === -1) continue
          const group: VGroup = { ...productVariants[gIdx], options: [...productVariants[gIdx].options] }
          const oIdx = group.options.findIndex(o => o.value === sv.value)
          if (oIdx === -1) continue
          const opt = { ...group.options[oIdx] }
          if (opt.stock != null) { opt.stock = Math.max(0, opt.stock - item.quantity); group.options[oIdx] = opt; productVariants[gIdx] = group; changed = true }
        }
        if (changed) await supabase.from('products').update({ variants: productVariants }).eq('id', item.productId)
      }
    }

    await supabase.from('checkout_sessions').delete().eq('id', session.id)

    sendOrderConfirmation(shipping.email, {
      orderNumber: newOrder.id.slice(0, 8).toUpperCase(),
      customerName: `${shipping.firstName} ${shipping.lastName}`,
      items: cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, thumbnail: i.thumbnail ?? undefined, variant: Array.isArray(i.selectedVariants) && i.selectedVariants.length ? i.selectedVariants.map(sv => sv.value).join(', ') : undefined })),
      subtotal: session.subtotal as number,
      shipping: session.shipping_fee as number,
      total: session.total as number,
      shippingAddress: { firstName: shipping.firstName, lastName: shipping.lastName, phone: shipping.phone, address: shipping.address, city: shipping.city, state: shipping.state },
    }).catch(() => {})

    return { orderId: newOrder.id }
  } catch {
    return { error: 'An unexpected error occurred during verification.' }
  }
}
