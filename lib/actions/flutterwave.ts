'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation } from '@/lib/email'

const FLW_BASE = 'https://api.flutterwave.com/v3'

function secretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not set')
  return key
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

// ── Step 1: initialize ──────────────────────────────────────────────────────
// Creates a pending_verification order BEFORE the user pays so admin always
// has visibility, even if the customer never returns after paying.
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

    const supabase = createAdminClient()

    // Load session to pre-create the order (visible in admin even if customer never returns)
    const { data: session } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle()

    if (session) {
      const cartItems = (session.cart_items ?? []) as SessionItem[]
      const shipping = session.shipping as Record<string, string>

      const { error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_id: session.customer_id ?? null,
          status: 'pending_verification',
          total: session.total,
          shipping_fee: session.shipping_fee,
          subtotal: session.subtotal,
          items: cartItems,
          shipping_address: shipping,
          delivery_rate_id: session.delivery_rate_id ?? null,
          delivery_label: session.delivery_label ?? null,
          coupon_code: (session as Record<string, unknown>).coupon_code as string ?? null,
          discount_amount: Number((session as Record<string, unknown>).discount_amount ?? 0),
          payment_reference: txRef,
          order_channel: 'store',
          payment_metadata: { provider: 'flutterwave' },
        })
      if (orderErr) console.error('[flutterwave] failed to create pre-order:', orderErr.message)

      const { error: refErr } = await supabase
        .from('checkout_sessions')
        .update({ tx_ref: txRef })
        .eq('id', sessionId)
      if (refErr) console.error('[flutterwave] failed to save tx_ref on session:', refErr.message)
    }

    return { paymentLink: link, txRef }
  } catch {
    return { error: 'Payment initialization failed.' }
  }
}

// ── Step 2: verify + finalise ───────────────────────────────────────────────
// Called when Flutterwave redirects back with ?transaction_id=xxx.
// The happy path: finds the pending_verification order (created at init time)
// and updates it to paid. Falls back to creating a new order if no pre-order
// exists (edge case: init crashed before DB write).
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

    // Find the pre-order created at init time
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, total, subtotal, shipping_fee, items, shipping_address')
      .eq('payment_reference', tx.tx_ref)
      .maybeSingle()

    // Already paid — idempotent return
    if (existingOrder?.status === 'paid') return { orderId: existingOrder.id }

    // Pre-order found — finalise it
    if (existingOrder?.status === 'pending_verification') {
      if (Math.abs(tx.amount - (existingOrder.total as number)) > 1) {
        return { error: 'Payment amount does not match order total.' }
      }

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_metadata: {
            provider: 'flutterwave',
            transaction_id: transactionId,
            payment_type: tx.payment_type,
            card_type: tx.card?.type ?? null,
            bank: tx.bank ?? null,
          },
        })
        .eq('id', existingOrder.id)
        .eq('status', 'pending_verification')

      if (updateErr) return { error: updateErr.message }

      // Clean up session and decrement stock
      await supabase.from('checkout_sessions').delete().eq('tx_ref', tx.tx_ref)

      const cartItems = (existingOrder.items ?? []) as SessionItem[]
      await decrementVariantStock(supabase, cartItems)

      const shipping = existingOrder.shipping_address as Record<string, string>
      sendOrderConfirmation(shipping.email, {
        orderNumber: existingOrder.id.slice(0, 8).toUpperCase(),
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
        subtotal: existingOrder.subtotal as number,
        shipping: existingOrder.shipping_fee as number,
        total: existingOrder.total as number,
        shippingAddress: {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          state: shipping.state,
        },
      }).catch((err) => console.error('[flutterwave] order confirmation email failed:', err?.message))

      return { orderId: existingOrder.id }
    }

    // ── Fallback: no pre-order exists (init crashed before DB write) ────────
    // Find checkout session by tx_ref, then by meta.session_id
    let { data: session } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('tx_ref', tx.tx_ref)
      .maybeSingle()

    if (!session && tx.meta?.session_id) {
      const { data: fallback } = await supabase
        .from('checkout_sessions')
        .select('*')
        .eq('id', tx.meta.session_id)
        .maybeSingle()
      if (fallback) {
        await supabase.from('checkout_sessions').update({ tx_ref: tx.tx_ref }).eq('id', fallback.id)
        session = fallback
      }
    }

    if (!session) return { error: 'Checkout session not found. It may have expired.' }

    if (Math.abs(tx.amount - (session.total as number)) > 1) {
      return { error: 'Payment amount does not match order total.' }
    }

    const cartItems = (session.cart_items ?? []) as SessionItem[]
    const shipping = session.shipping as Record<string, string>

    // Stock re-validation
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
        coupon_code: (session as Record<string, unknown>).coupon_code as string ?? null,
        discount_amount: Number((session as Record<string, unknown>).discount_amount ?? 0),
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

    await decrementVariantStock(supabase, cartItems)
    await supabase.from('checkout_sessions').delete().eq('id', session.id)

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
    }).catch((err) => console.error('[flutterwave] order confirmation email failed:', err?.message))

    return { orderId: newOrder.id }
  } catch {
    return { error: 'An unexpected error occurred during verification.' }
  }
}

async function decrementVariantStock(
  supabase: ReturnType<typeof createAdminClient>,
  cartItems: SessionItem[],
) {
  const variantItems = cartItems.filter(i => Array.isArray(i.selectedVariants) && i.selectedVariants.length > 0)
  if (variantItems.length === 0) return

  const productIds = Array.from(new Set(variantItems.map(i => i.productId)))
  const { data: products } = await supabase.from('products').select('id, variants').in('id', productIds)

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
