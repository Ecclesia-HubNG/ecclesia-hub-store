'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation } from '@/lib/email'

const FLW_BASE = 'https://api.flutterwave.com/v3'

function secretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not set')
  return key
}

// ── Step 1: initialize ──────────────────────────────────────────────────
// Called with a checkout session ID — NOT an order ID.
// No order row is written here; that only happens after payment succeeds.
export async function initializePayment(
  sessionId: string,
  email: string,
  amountNaira: number,
  customerName: string,
  phone: string,
) {
  try {
    const key = secretKey()
    const txRef = `EH-${sessionId.replace(/-/g, '').slice(0, 10)}-${Date.now()}`
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`

    const res = await fetch(`${FLW_BASE}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amountNaira,
        currency: 'NGN',
        redirect_url: redirectUrl,
        customer: { email, name: customerName, phonenumber: phone },
        meta: { session_id: sessionId },
        customizations: {
          title: 'Ecclesia Hub',
          description: 'Complete your purchase',
          logo: `${process.env.NEXT_PUBLIC_APP_URL}/favicon.ico`,
        },
      }),
    })

    if (!res.ok) return { error: 'Payment provider unavailable. Please try again.' }
    const json = await res.json()
    if (json.status !== 'success') return { error: json.message ?? 'Could not initialize payment.' }

    const { link } = json.data as { link: string }

    // Store tx_ref back on the session so verify can look it up via tx_ref
    const supabase = createAdminClient()
    await supabase
      .from('checkout_sessions')
      .update({ tx_ref: txRef })
      .eq('id', sessionId)

    return { paymentLink: link, txRef }
  } catch {
    return { error: 'Payment initialization failed.' }
  }
}

// ── Step 2: verify + finalise ───────────────────────────────────────────
// Called when Flutterwave redirects back with ?transaction_id=xxx.
// Verifies the payment, reads the checkout session, creates the order
// as "paid" in one step, decrements stock, sends confirmation email,
// and deletes the session.
//
// Idempotent: if called twice (e.g. user refreshes), returns the already-
// created order ID without double-charging or double-creating.
export async function verifyAndFinalizeOrder(transactionId: string) {
  if (!transactionId?.trim()) return { error: 'Missing transaction ID.' }

  try {
    const key = secretKey()

    const res = await fetch(
      `${FLW_BASE}/transactions/${encodeURIComponent(transactionId)}/verify`,
      { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' },
    )

    if (!res.ok) return { error: 'Could not verify payment.' }
    const json = await res.json()
    if (json.status !== 'success') return { error: 'Verification request failed.' }

    const tx = json.data as {
      status: string
      amount: number
      currency: string
      tx_ref: string
      payment_type: string
      meta?: { session_id?: string }
      card?: { first_6digits?: string; last_4digits?: string; type?: string }
      bank?: string
    }

    if (tx.status !== 'successful') return { error: `Payment was not successful (status: ${tx.status}).` }
    if (tx.currency !== 'NGN') return { error: 'Unexpected payment currency.' }

    const supabase = createAdminClient()

    // ── Idempotency: if we already created the order, return it ────────
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status')
      .eq('payment_reference', tx.tx_ref)
      .maybeSingle()

    if (existingOrder) return { orderId: existingOrder.id }
    // ──────────────────────────────────────────────────────────────────

    // Find the checkout session by tx_ref (stored at init time)
    const { data: session } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('tx_ref', tx.tx_ref)
      .maybeSingle()

    if (!session) return { error: 'Checkout session not found. It may have expired.' }

    // Amount check (never trust the client)
    if (Math.abs(tx.amount - (session.total as number)) > 1) {
      return { error: 'Payment amount does not match order total.' }
    }

    type SessionItem = {
      productId: string
      slug: string
      name: string
      price: number
      quantity: number
      thumbnail: string | null
      selectedVariants: Array<{ groupName: string; value: string }> | null
    }
    const cartItems = (session.cart_items ?? []) as SessionItem[]
    const shipping = session.shipping as Record<string, string>

    // ── Re-validate stock (race condition guard) ──────────────────────
    const variantItems = cartItems.filter(i => Array.isArray(i.selectedVariants) && i.selectedVariants.length > 0)
    if (variantItems.length > 0) {
      const productIds = Array.from(new Set(variantItems.map(i => i.productId)))
      const { data: products } = await supabase
        .from('products')
        .select('id, name, variants')
        .in('id', productIds)

      for (const item of variantItems) {
        const product = products?.find(p => p.id === item.productId)
        if (!product) continue
        const productVariants = Array.isArray(product.variants) ? product.variants : []
        for (const sv of item.selectedVariants ?? []) {
          const group = productVariants.find((v: { name: string }) => v.name === sv.groupName)
          if (!group) continue
          const opt = (group.options ?? []).find((o: { value: string; stock?: number | null }) => o.value === sv.value)
          if (opt?.stock != null && opt.stock < item.quantity) {
            return {
              error: opt.stock === 0
                ? `"${item.name} — ${sv.value}" sold out while you were paying. Please contact us.`
                : `"${item.name} — ${sv.value}" only has ${opt.stock} left. Please contact us.`,
            }
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────

    // ── Create order directly as paid — no pending state ever ────────
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
        payment_reference: tx.tx_ref,
        paid_at: new Date().toISOString(),
        order_channel: 'store',
        payment_metadata: {
          provider: 'flutterwave',
          transaction_id: transactionId,
          payment_type: tx.payment_type,
          card_type: tx.card?.type ?? null,
          bank: tx.bank ?? null,
        },
      })
      .select('id')
      .single()

    if (orderError) return { error: orderError.message }
    // ─────────────────────────────────────────────────────────────────

    // ── Decrement variant stock ───────────────────────────────────────
    if (variantItems.length > 0) {
      const productIds = Array.from(new Set(variantItems.map(i => i.productId)))
      const { data: products } = await supabase
        .from('products')
        .select('id, variants')
        .in('id', productIds)

      for (const item of variantItems) {
        const product = products?.find(p => p.id === item.productId)
        if (!product) continue

        type VOption = { value: string; stock?: number | null }
        type VGroup = { name: string; options: VOption[] }
        const productVariants: VGroup[] = Array.isArray(product.variants)
          ? (product.variants as VGroup[]).map(v => ({ ...v, options: [...v.options] }))
          : []
        let changed = false

        for (const sv of item.selectedVariants ?? []) {
          const groupIdx = productVariants.findIndex(v => v.name === sv.groupName)
          if (groupIdx === -1) continue
          const group: VGroup = { ...productVariants[groupIdx], options: [...productVariants[groupIdx].options] }
          const optIdx = group.options.findIndex(o => o.value === sv.value)
          if (optIdx === -1) continue
          const opt = { ...group.options[optIdx] }
          if (opt.stock != null) {
            opt.stock = Math.max(0, opt.stock - item.quantity)
            group.options[optIdx] = opt
            productVariants[groupIdx] = group
            changed = true
          }
        }

        if (changed) {
          await supabase.from('products').update({ variants: productVariants }).eq('id', item.productId)
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────

    // ── Delete the session (cleanup) ─────────────────────────────────
    await supabase.from('checkout_sessions').delete().eq('id', session.id)
    // ─────────────────────────────────────────────────────────────────

    // ── Confirmation email (non-blocking) ────────────────────────────
    sendOrderConfirmation(shipping.email, {
      orderNumber: newOrder.id.slice(0, 8).toUpperCase(),
      customerName: `${shipping.firstName} ${shipping.lastName}`,
      items: cartItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        thumbnail: i.thumbnail ?? undefined,
        variant: Array.isArray(i.selectedVariants) && i.selectedVariants.length
          ? i.selectedVariants.map(sv => sv.value).join(', ')
          : undefined,
      })),
      subtotal: session.subtotal as number,
      shipping: session.shipping_fee as number,
      total: session.total as number,
      shippingAddress: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
      },
    }).catch(() => {})
    // ─────────────────────────────────────────────────────────────────

    return { orderId: newOrder.id }
  } catch {
    return { error: 'An unexpected error occurred during verification.' }
  }
}
