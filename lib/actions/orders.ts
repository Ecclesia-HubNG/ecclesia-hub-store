'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendOrderShipped, sendOrderConfirmation } from '@/lib/email'

export async function updateOrderStatus(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string

  const { data: order } = await supabase
    .from('orders')
    .select('items, shipping_address, tracking_number, carrier, total, subtotal, shipping_fee')
    .eq('id', id)
    .single()

  await supabase.from('orders').update({ status }).eq('id', id)

  const addr = order?.shipping_address
  const orderNumber = id.slice(0, 8).toUpperCase()
  const customerName = addr ? `${addr.firstName ?? ''} ${addr.lastName ?? ''}`.trim() : ''
  const items = (order?.items ?? [] as any[]).map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price ?? 0, thumbnail: i.thumbnail, variant: i.variant }))

  if (addr?.email) {
    if (status === 'paid' || status === 'processing') {
      sendOrderConfirmation(addr.email, {
        orderNumber,
        customerName,
        items,
        subtotal: order?.subtotal ?? order?.total ?? 0,
        shipping: order?.shipping_fee ?? 0,
        total: order?.total ?? 0,
        shippingAddress: addr,
      }).catch(() => {})
    }

    if (status === 'shipped') {
      sendOrderShipped(addr.email, {
        orderNumber,
        customerName,
        trackingNumber: order?.tracking_number ?? undefined,
        carrier: order?.carrier ?? undefined,
        items: items.map((i: { name: string; quantity: number }) => ({ name: i.name, quantity: i.quantity })),
        shippingAddress: addr,
      }).catch(() => {})
    }

    if (status === 'delivered') {
      sendOrderConfirmation(addr.email, {
        orderNumber,
        customerName,
        items,
        subtotal: order?.subtotal ?? order?.total ?? 0,
        shipping: order?.shipping_fee ?? 0,
        total: order?.total ?? 0,
        shippingAddress: addr,
      }).catch(() => {})
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath('/admin')
}

export async function updateOrderTracking(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  const tracking_number = (formData.get('tracking_number') as string) || null
  const carrier = (formData.get('carrier') as string) || null
  const admin_notes = (formData.get('admin_notes') as string) || null
  await supabase.from('orders').update({ tracking_number, carrier, admin_notes }).eq('id', id)
  revalidatePath(`/admin/orders/${id}`)
}

export async function bulkUpdateOrderStatus(ids: string[], status: string) {
  const supabase = createClient()
  await supabase.from('orders').update({ status }).in('id', ids)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}
