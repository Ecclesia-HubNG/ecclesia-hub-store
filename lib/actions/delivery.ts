'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function revalidate() {
  revalidatePath('/admin/shipping/delivery-type')
}

// ── Public (storefront) ───────────────────────────────────────────────────────
export async function getActiveDeliveryOptions() {
  const supabase = createAdminClient()

  const [{ data: types }, { data: zones }, { data: rates }] = await Promise.all([
    supabase.from('delivery_types').select('id, name, description').eq('is_active', true).order('sort_order').order('created_at'),
    supabase.from('delivery_zones').select('id, type_id, name, description').eq('is_active', true).order('sort_order').order('created_at'),
    supabase.from('delivery_rates').select('id, zone_id, name, areas, price, estimated_days').eq('is_active', true).order('sort_order').order('created_at'),
  ])

  return (types ?? []).map(t => ({
    ...t,
    zones: (zones ?? [])
      .filter(z => z.type_id === t.id)
      .map(z => ({
        ...z,
        rates: (rates ?? []).filter(r => r.zone_id === z.id),
      })),
  }))
}

// ── Read ──────────────────────────────────────────────────────────────────────
export async function getDeliveryData() {
  const supabase = createAdminClient()

  const [{ data: types }, { data: zones }, { data: rates }, { data: channels }] =
    await Promise.all([
      supabase.from('delivery_types').select('*').order('sort_order').order('created_at'),
      supabase.from('delivery_zones').select('*').order('sort_order').order('created_at'),
      supabase.from('delivery_rates').select('*').order('sort_order').order('created_at'),
      supabase.from('delivery_channels').select('*').order('sort_order').order('created_at'),
    ])

  const typesWithChildren = (types ?? []).map(t => ({
    ...t,
    zones: (zones ?? [])
      .filter(z => z.type_id === t.id)
      .map(z => ({
        ...z,
        rates: (rates ?? []).filter(r => r.zone_id === z.id),
      })),
  }))

  return { types: typesWithChildren, channels: channels ?? [] }
}

// ── Delivery Types ────────────────────────────────────────────────────────────
export async function createDeliveryType(name: string, description: string) {
  if (!name.trim()) return { error: 'Name is required.' }
  const supabase = createAdminClient()
  const { data: last } = await supabase.from('delivery_types').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const { error } = await supabase.from('delivery_types').insert({ name: name.trim(), description: description.trim() || null, sort_order: (last?.sort_order ?? -1) + 1 })
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}

export async function updateDeliveryType(id: string, name: string, description: string, isActive: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('delivery_types').update({ name: name.trim(), description: description.trim() || null, is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}

export async function deleteDeliveryType(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('delivery_types').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}

// ── Delivery Zones ────────────────────────────────────────────────────────────
export async function createDeliveryZone(typeId: string, name: string, description: string) {
  if (!name.trim()) return { error: 'Name is required.' }
  const supabase = createAdminClient()
  const { data: last } = await supabase.from('delivery_zones').select('sort_order').eq('type_id', typeId).order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const { error, data } = await supabase.from('delivery_zones').insert({ type_id: typeId, name: name.trim(), description: description.trim() || null, sort_order: (last?.sort_order ?? -1) + 1 }).select().single()
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const, zone: data }
}

export async function updateDeliveryZone(id: string, name: string, description: string, isActive: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('delivery_zones').update({ name: name.trim(), description: description.trim() || null, is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}

export async function deleteDeliveryZone(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('delivery_zones').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}

// ── Delivery Rates ────────────────────────────────────────────────────────────
export async function createDeliveryRate(
  zoneId: string,
  name: string,
  areas: string[],
  price: number,
  estimatedDays: string,
) {
  if (!name.trim()) return { error: 'Name is required.' }
  if (price < 0) return { error: 'Price cannot be negative.' }
  const supabase = createAdminClient()
  const { data: last } = await supabase.from('delivery_rates').select('sort_order').eq('zone_id', zoneId).order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const { error, data } = await supabase.from('delivery_rates').insert({
    zone_id: zoneId,
    name: name.trim(),
    areas: areas.map(a => a.trim()).filter(Boolean),
    price,
    estimated_days: estimatedDays.trim() || null,
    sort_order: (last?.sort_order ?? -1) + 1,
  }).select().single()
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const, rate: data }
}

export async function updateDeliveryRate(
  id: string,
  name: string,
  areas: string[],
  price: number,
  estimatedDays: string,
  isActive: boolean,
) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('delivery_rates').update({
    name: name.trim(),
    areas: areas.map(a => a.trim()).filter(Boolean),
    price,
    estimated_days: estimatedDays.trim() || null,
    is_active: isActive,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}

export async function deleteDeliveryRate(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('delivery_rates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}

// ── Delivery Channels ─────────────────────────────────────────────────────────
export async function createDeliveryChannel(name: string, description: string, contact: string) {
  if (!name.trim()) return { error: 'Name is required.' }
  const supabase = createAdminClient()
  const { data: last } = await supabase.from('delivery_channels').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const { error, data } = await supabase.from('delivery_channels').insert({
    name: name.trim(),
    description: description.trim() || null,
    contact: contact.trim() || null,
    sort_order: (last?.sort_order ?? -1) + 1,
  }).select().single()
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const, channel: data }
}

export async function updateDeliveryChannel(id: string, name: string, description: string, contact: string, isActive: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('delivery_channels').update({ name: name.trim(), description: description.trim() || null, contact: contact.trim() || null, is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}

export async function deleteDeliveryChannel(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('delivery_channels').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidate()
  return { success: true as const }
}
