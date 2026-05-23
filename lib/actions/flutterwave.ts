'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation } from '@/lib/email'

const FLW_BASE = 'https://api.flutterwave.com/v3'

function secretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not set')
  return key
}

export async function initializePayment(orderId: string, email: string, amountNaira: number, customerName: string, phone: string) {
  try {
    const key = secretKey()
    const txRef = `EH-${orderId.replace(/-/g, '').slice(0, 10)}-${Date.now()}`
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
        customer: {
          email,
          name: customerName,
          phonenumber: phone,
        },
        meta: { order_id: orderId },
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

    // Persist tx_ref on order so webhook/verify can look it up
    const supabase = createAdminClient()
    await supabase
      .from('orders')
      .update({ payment_reference: txRef })
      .eq('id', orderId)

    return { paymentLink: link, txRef }
  } catch {
    return { error: 'Payment initialization failed.' }
  }
}

export async function verifyAndFinalizeOrder(transactionId: string) {
  if (!transactionId?.trim()) return { error: 'Missing transaction ID.' }

  try {
    const key = secretKey()

    const res = await fetch(`${FLW_BASE}/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })

    if (!res.ok) return { error: 'Could not verify payment.' }
    const json = await res.json()
    if (json.status !== 'success') return { error: 'Verification request failed.' }

    const tx = json.data as {
      status: string
      amount: number
      currency: string
      tx_ref: string
      payment_type: string
      card?: { first_6digits?: string; last_4digits?: string; type?: string }
      bank?: string
    }

    if (tx.status !== 'successful') return { error: `Payment was not successful (status: ${tx.status}).` }
    if (tx.currency !== 'NGN') return { error: 'Unexpected payment currency.' }

    const supabase = createAdminClient()

    const { data: order } = await supabase
      .from('orders')
      .select('id, status, total, shipping_address, items')
      .eq('payment_reference', tx.tx_ref)
      .single()

    if (!order) return { error: 'Order not found for this payment.' }

    // Already processed — safe to redirect
    if (order.status !== 'pending') return { orderId: order.id }

    // Amount verification (Flutterwave amounts are in Naira)
    const expectedNaira = order.total as number
    if (Math.abs(tx.amount - expectedNaira) > 1) {
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
      .eq('id', order.id)
      .eq('status', 'pending')

    if (updateErr) return { error: updateErr.message }

    // ── Decrement per-variant stock ───────────────────────
    const orderItems = (order.items as Array<Record<string, unknown>>) ?? []
    const variantProductIds = Array.from(new Set(
      orderItems.filter(i => Array.isArray(i.selectedVariants) && (i.selectedVariants as unknown[]).length > 0)
        .map(i => i.productId as string)
    ))

    if (variantProductIds.length > 0) {
      const { data: variantProducts } = await supabase
        .from('products')
        .select('id, variants')
        .in('id', variantProductIds)

      for (const item of orderItems) {
        const svs = item.selectedVariants as Array<{ groupName: string; value: string }> | null
        if (!svs?.length) continue

        const product = variantProducts?.find(p => p.id === item.productId)
        if (!product) continue

        type VOption = { value: string; stock?: number | null }
        type VGroup = { name: string; options: VOption[] }
        const productVariants: VGroup[] = Array.isArray(product.variants)
          ? (product.variants as VGroup[]).map(v => ({ ...v, options: [...v.options] }))
          : []
        let changed = false

        for (const sv of svs) {
          const groupIdx = productVariants.findIndex(v => v.name === sv.groupName)
          if (groupIdx === -1) continue

          const group: VGroup = { ...productVariants[groupIdx], options: [...productVariants[groupIdx].options] }
          const optIdx = group.options.findIndex(o => o.value === sv.value)
          if (optIdx === -1) continue

          const opt = { ...group.options[optIdx] }
          if (opt.stock != null) {
            opt.stock = Math.max(0, opt.stock - ((item.quantity as number) ?? 1))
            group.options[optIdx] = opt
            productVariants[groupIdx] = group
            changed = true
          }
        }

        if (changed) {
          await supabase.from('products').update({ variants: productVariants }).eq('id', item.productId as string)
        }
      }
    }
    // ─────────────────────────────────────────────────────

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

    return { orderId: order.id }
  } catch {
    return { error: 'An unexpected error occurred during verification.' }
  }
}
