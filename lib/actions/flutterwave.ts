'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendOrderProcessing, sendPaymentFailed, sendAdminOrderNotification } from '@/lib/email'
import { logOrderEvent } from '@/lib/actions/order-events'


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

      const { data: newOrder, error: orderErr } = await supabase
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
        .select('id')
        .single()
      if (orderErr) {
        console.error('[flutterwave] failed to create pre-order:', orderErr.message)
      } else {
        await logOrderEvent(newOrder.id, 'order_placed', 'Order placed — awaiting Flutterwave payment')
        // Notify admin that a new Flutterwave order is pending payment
        sendAdminOrderNotification({
          orderNumber: txRef.slice(0, 12),
          orderId: '',
          customerName,
          customerEmail: email,
          customerPhone: phone,
          total: amountNaira,
          paymentMethod: 'flutterwave',
          status: 'pending_verification',
          items: (session.cart_items as Array<{ name: string; quantity: number; price: number }> ?? []).map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          address: (session.shipping as Record<string, string>)?.address ?? '',
          city: (session.shipping as Record<string, string>)?.city ?? '',
          state: (session.shipping as Record<string, string>)?.state ?? '',
          event: 'new_order',
        }).catch(() => {})
      }

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

    if (tx.currency !== 'NGN') return { error: 'Unexpected payment currency.' }

    const supabase = createAdminClient()

    if (tx.status !== 'successful') {
      // Mark pre-order as payment_failed and notify customer
      if (tx.tx_ref) {
        const { data: failedOrder } = await supabase
          .from('orders')
          .select('id, shipping_address')
          .eq('payment_reference', tx.tx_ref)
          .eq('status', 'pending_verification')
          .maybeSingle()

        if (failedOrder) {
          await supabase.from('orders').update({ status: 'payment_failed' }).eq('id', failedOrder.id)
          const s = failedOrder.shipping_address as Record<string, string>
          sendPaymentFailed(s.email, {
            customerName: `${s.firstName} ${s.lastName}`,
            orderNumber: failedOrder.id.slice(0, 8).toUpperCase(),
          }).catch(() => {})
        }
      }
      return { error: `Payment was not successful (status: ${tx.status}).` }
    }

    // Find the pre-order created at init time
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, total, subtotal, shipping_fee, items, shipping_address')
      .eq('payment_reference', tx.tx_ref)
      .maybeSingle()

    // Already processing — idempotent return
    if (existingOrder?.status === 'processing') return { orderId: existingOrder.id }

    // Pre-order found — finalise it
    if (existingOrder?.status === 'pending_verification') {
      if (Math.abs(tx.amount - (existingOrder.total as number)) > 1) {
        return { error: 'Payment amount does not match order total.' }
      }

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'processing',
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
      const orderNum = existingOrder.id.slice(0, 8).toUpperCase()
      const emailItems = cartItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        thumbnail: i.thumbnail ?? undefined,
        variant: Array.isArray(i.selectedVariants) && i.selectedVariants.length
          ? i.selectedVariants.map(sv => sv.value).join(', ')
          : undefined,
      }))

      sendOrderProcessing(shipping.email, {
        orderNumber: orderNum,
        orderId: existingOrder.id,
        customerName: `${shipping.firstName} ${shipping.lastName}`,
        items: emailItems,
        subtotal: existingOrder.subtotal as number,
        shipping: existingOrder.shipping_fee as number,
        total: existingOrder.total as number,
        shippingAddress: { firstName: shipping.firstName, lastName: shipping.lastName, phone: shipping.phone, address: shipping.address, city: shipping.city, state: shipping.state },
      }).catch((err) => console.error('[flutterwave] processing email failed:', err?.message))

      sendAdminOrderNotification({
        orderNumber: orderNum,
        orderId: existingOrder.id,
        customerName: `${shipping.firstName} ${shipping.lastName}`,
        customerEmail: shipping.email,
        customerPhone: shipping.phone,
        total: existingOrder.total as number,
        paymentMethod: 'flutterwave',
        status: 'processing',
        items: emailItems,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        event: 'payment_confirmed',
      }).catch(() => {})

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
        status: 'processing',
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

    const orderNum = newOrder.id.slice(0, 8).toUpperCase()
    const emailItems = cartItems.map(i => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      thumbnail: i.thumbnail ?? undefined,
      variant: Array.isArray(i.selectedVariants) && i.selectedVariants.length
        ? i.selectedVariants.map(sv => sv.value).join(', ')
        : undefined,
    }))

    sendOrderProcessing(shipping.email, {
      orderNumber: orderNum,
      orderId: newOrder.id,
      customerName: `${shipping.firstName} ${shipping.lastName}`,
      items: emailItems,
      subtotal: session.subtotal as number,
      shipping: session.shipping_fee as number,
      total: session.total as number,
      shippingAddress: { firstName: shipping.firstName, lastName: shipping.lastName, phone: shipping.phone, address: shipping.address, city: shipping.city, state: shipping.state },
    }).catch((err) => console.error('[flutterwave] processing email failed:', err?.message))

    sendAdminOrderNotification({
      orderNumber: orderNum,
      orderId: newOrder.id,
      customerName: `${shipping.firstName} ${shipping.lastName}`,
      customerEmail: shipping.email,
      customerPhone: shipping.phone,
      total: session.total as number,
      paymentMethod: 'flutterwave',
      status: 'processing',
      items: emailItems,
      address: shipping.address,
      city: shipping.city,
      state: shipping.state,
      event: 'payment_confirmed',
    }).catch(() => {})

    return { orderId: newOrder.id }
  } catch {
    return { error: 'An unexpected error occurred during verification.' }
  }
}

// Called when Flutterwave redirects back with status=cancelled.
// Marks the pre-order as payment_failed and notifies the customer.
export async function cancelPendingOrder(txRef: string) {
  if (!txRef) return
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
      .update({ status: 'payment_failed' })
      .eq('id', order.id)

    const s = order.shipping_address as Record<string, string>
    const { sendPaymentFailed } = await import('@/lib/email')
    await sendPaymentFailed(s.email, {
      customerName: `${s.firstName} ${s.lastName}`,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
    }).catch(() => {})
  } catch (err) {
    console.error('[flutterwave] cancelPendingOrder error:', err)
  }
}

// Reinitializes Flutterwave payment for a payment_failed order.
// Allowed for the order owner (authenticated) or anyone with the order UUID (guest link).
export async function retryPayment(orderId: string) {
  try {
    const admin = createAdminClient()
    const { data: order } = await admin
      .from('orders')
      .select('id, status, total, shipping_address, customer_id')
      .eq('id', orderId)
      .eq('status', 'payment_failed')
      .maybeSingle()

    if (!order) return { error: 'Order not found or not eligible for retry.' }

    // If order has a customer_id, verify the caller owns it
    if (order.customer_id) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id !== order.customer_id) return { error: 'Not authorised.' }
    }

    const shipping = order.shipping_address as Record<string, string>
    const txRef = `EH-${orderId.replace(/-/g, '').slice(0, 10)}-${Date.now()}`
    const key = secretKey()

    const res = await fetch(`${FLW_BASE}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: order.total,
        currency: 'NGN',
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
        customer: {
          email: shipping.email,
          name: `${shipping.firstName} ${shipping.lastName}`,
          phonenumber: shipping.phone,
        },
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

    await admin
      .from('orders')
      .update({ status: 'pending_verification', payment_reference: txRef })
      .eq('id', orderId)

    return { paymentLink: link }
  } catch {
    return { error: 'An unexpected error occurred.' }
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
