'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email'
import type { CartItem } from '@/lib/cart-context'

export type ShippingAddress = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
}

// ── Stock validator (shared between session create and order finalise) ──
async function validateStock(items: CartItem[]): Promise<string | null> {
  const adminSupabase = createAdminClient()
  const productIds = Array.from(new Set(items.map(i => i.productId)))
  const { data: products } = await adminSupabase
    .from('products')
    .select('id, name, variants')
    .in('id', productIds)

  for (const item of items) {
    if (!item.selectedVariants?.length) continue
    const product = products?.find(p => p.id === item.productId)
    if (!product) continue
    const productVariants = Array.isArray(product.variants) ? product.variants : []
    for (const sv of item.selectedVariants) {
      const group = productVariants.find((v: { name: string }) => v.name === sv.groupName)
      if (!group) continue
      const opt = (group.options ?? []).find((o: { value: string; stock?: number | null }) => o.value === sv.value)
      if (opt?.stock != null && opt.stock < item.quantity) {
        return opt.stock === 0
          ? `"${item.name} — ${sv.value}" is out of stock.`
          : `"${item.name} — ${sv.value}" only has ${opt.stock} left in stock.`
      }
    }
  }
  return null
}

// ── Checkout session ────────────────────────────────────────────────────
// Created when the customer submits the checkout form.
// The actual orders row is only written AFTER Flutterwave confirms payment.
// This keeps the orders table clean — every row is a real paid order.
export async function createCheckoutSession(
  items: CartItem[],
  shipping: ShippingAddress,
  subtotal: number,
  shippingFee: number,
  total: number,
  deliveryRateId: string | null,
  deliveryLabel: string,
  couponCode: string | null = null,
  discountAmount: number = 0,
): Promise<{ sessionId: string } | { error: string }> {
  const stockError = await validateStock(items)
  if (stockError) return { error: stockError }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const serialisedItems = items.map(i => ({
    productId: i.productId,
    slug: i.slug,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    thumbnail: i.thumbnail,
    selectedVariants: i.selectedVariants ?? null,
  }))

  // Use admin client so the insert works even for unauthenticated (guest) users
  const admin = createAdminClient()
  const { data: session, error } = await admin
    .from('checkout_sessions')
    .insert({
      cart_items: serialisedItems,
      shipping,
      subtotal,
      shipping_fee: shippingFee,
      total,
      delivery_rate_id: deliveryRateId || null,
      delivery_label: deliveryLabel || null,
      coupon_code: couponCode || null,
      discount_amount: discountAmount,
      customer_id: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { sessionId: session.id }
}

// ── Kept for admin manual-order flow (not used in storefront checkout) ──
export async function createOrder(items: CartItem[], shipping: ShippingAddress, total: number, shippingFee = 0) {
  const stockError = await validateStock(items)
  if (stockError) return { error: stockError }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_id: user?.id ?? null,
      status: 'pending',
      total,
      shipping_fee: shippingFee,
      items: items.map(i => ({
        productId: i.productId,
        slug: i.slug,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        thumbnail: i.thumbnail,
        selectedVariants: i.selectedVariants ?? null,
      })),
      shipping_address: shipping,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { orderId: order.id }
}

export async function getOrder(id: string) {
  // Use admin client so guest orders (customer_id = null) are accessible.
  // Access control: logged-in users can see their own orders; guests can see
  // any order by UUID (UUIDs are unguessable, so this is safe).
  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !order) return null

  // If order belongs to a specific customer, verify the requester is that customer
  if (order.customer_id) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== order.customer_id) return null
  }

  return order
}

export async function cancelMyOrder(id: string): Promise<{ error?: string }> {
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select('id, status, customer_id, shipping_address')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!order) return { error: 'Order not found.' }

  const cancellable = ['pending', 'pending_verification', 'pending_bank_transfer']
  if (!cancellable.includes(order.status)) {
    return { error: 'Only unpaid orders can be cancelled.' }
  }

  // For authenticated orders verify ownership; guests can cancel by knowing the UUID
  if (order.customer_id) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== order.customer_id) return { error: 'Not authorised.' }
  }

  const shipping = order.shipping_address as Record<string, string> | null
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const deletedByEmail = user?.email ?? shipping?.email ?? 'guest'

  const { error } = await admin
    .from('orders')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_role: 'customer',
      deleted_by_email: deletedByEmail,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  return {}
}

// Backfills customer_id on any guest orders placed with the signed-in user's email.
// Called before querying orders so previous guest purchases show up immediately after signup.
export async function claimGuestOrders() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return

  const admin = createAdminClient()
  await admin
    .from('orders')
    .update({ customer_id: user.id })
    .is('customer_id', null)
    .filter('shipping_address->>email', 'eq', user.email)
    .not('status', 'in', '("pending_verification","payment_failed")')
}

export async function getMyOrders() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('orders')
    .select('id, status, total, items, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ── Bank Transfer ─────────────────────────────────────────────────────────
// Creates an order immediately (no payment gateway redirect).
// Order stays as pending_bank_transfer until admin manually confirms the transfer.
export async function createBankTransferOrder(sessionId: string): Promise<
  | { orderId: string; orderNumber: string; bankDetails: { bankName: string; accountNumber: string; accountName: string } }
  | { error: string }
> {
  const admin = createAdminClient()

  const { data: session, error: sessionErr } = await admin
    .from('checkout_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionErr || !session) return { error: 'Session not found or expired.' }

  type SessionItem = {
    productId: string; slug: string; name: string; price: number
    quantity: number; thumbnail: string | null; selectedVariants: Array<{ groupName: string; value: string }> | null
  }
  const cartItems = (session.cart_items ?? []) as SessionItem[]
  const shipping = session.shipping as Record<string, string>

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      customer_id: session.customer_id ?? null,
      status: 'pending_bank_transfer',
      total: session.total,
      shipping_fee: session.shipping_fee,
      subtotal: session.subtotal,
      items: cartItems,
      shipping_address: shipping,
      delivery_rate_id: session.delivery_rate_id ?? null,
      delivery_label: session.delivery_label ?? null,
      coupon_code: (session as Record<string, unknown>).coupon_code as string ?? null,
      discount_amount: Number((session as Record<string, unknown>).discount_amount ?? 0),
      order_channel: 'store',
      payment_metadata: { provider: 'bank_transfer' },
    })
    .select('id')
    .single()

  if (orderErr) return { error: orderErr.message }

  await admin.from('checkout_sessions').delete().eq('id', sessionId)

  const bankDetails = {
    bankName: 'UBA',
    accountNumber: '1028049723',
    accountName: 'Ecclesia Hub',
  }

  const orderNumber = order.id.slice(0, 8).toUpperCase()
  const emailItems = cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, thumbnail: i.thumbnail ?? undefined }))

  // Tell the customer their bank transfer order is placed and awaiting payment
  sendOrderConfirmation(shipping.email, {
    orderNumber,
    customerName: `${shipping.firstName} ${shipping.lastName}`,
    items: emailItems,
    subtotal: session.subtotal as number,
    shipping: session.shipping_fee as number,
    total: session.total as number,
    shippingAddress: { firstName: shipping.firstName, lastName: shipping.lastName, phone: shipping.phone, address: shipping.address, city: shipping.city, state: shipping.state },
  }).catch((err) => console.error('[bank-transfer] order email failed:', err?.message))

  // Notify admin of the new bank transfer order
  sendAdminOrderNotification({
    orderNumber,
    orderId: order.id,
    customerName: `${shipping.firstName} ${shipping.lastName}`,
    customerEmail: shipping.email,
    customerPhone: shipping.phone,
    total: session.total as number,
    paymentMethod: 'bank_transfer',
    status: 'pending_bank_transfer',
    items: emailItems,
    address: shipping.address,
    city: shipping.city,
    state: shipping.state,
    event: 'new_order',
  }).catch(() => {})

  return { orderId: order.id, orderNumber, bankDetails }
}
