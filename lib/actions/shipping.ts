'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ShippingZone = {
  id: string
  country: string
  state: string
  area: string | null
  price: number
  is_active: boolean
  created_at: string
}

// Public: fetch all active zones (for checkout)
export async function getShippingZones(): Promise<ShippingZone[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('shipping_zones')
    .select('*')
    .eq('is_active', true)
    .order('state')
    .order('area', { nullsFirst: true })
  return (data ?? []) as ShippingZone[]
}

// Returns unique states that have zones
export async function getShippingStates(): Promise<string[]> {
  const zones = await getShippingZones()
  return [...new Set(zones.map(z => z.state))].sort()
}

// Returns areas for a given state (empty = only state-level zone)
export async function getAreasForState(state: string): Promise<{ area: string | null; price: number }[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('shipping_zones')
    .select('area, price')
    .eq('state', state)
    .eq('is_active', true)
    .order('area', { nullsFirst: true })
  return (data ?? []) as { area: string | null; price: number }[]
}

// Admin: get all zones
export async function adminGetShippingZones(): Promise<ShippingZone[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('shipping_zones')
    .select('*')
    .order('country')
    .order('state')
    .order('area', { nullsFirst: true })
  return (data ?? []) as ShippingZone[]
}

// Admin: create zone
export async function createShippingZone(data: {
  country: string
  state: string
  area: string | null
  price: number
}) {
  if (!data.state.trim()) return { error: 'State is required' }
  if (data.price < 0) return { error: 'Price cannot be negative' }
  const supabase = createAdminClient()
  const { error } = await supabase.from('shipping_zones').insert({
    country: data.country.trim() || 'Nigeria',
    state: data.state.trim(),
    area: data.area?.trim() || null,
    price: data.price,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/shipping')
  return { success: true as const }
}

// Admin: update zone
export async function updateShippingZone(id: string, data: {
  country: string
  state: string
  area: string | null
  price: number
  is_active: boolean
}) {
  if (!data.state.trim()) return { error: 'State is required' }
  if (data.price < 0) return { error: 'Price cannot be negative' }
  const supabase = createAdminClient()
  const { error } = await supabase.from('shipping_zones').update({
    country: data.country.trim() || 'Nigeria',
    state: data.state.trim(),
    area: data.area?.trim() || null,
    price: data.price,
    is_active: data.is_active,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/shipping')
  return { success: true as const }
}

// Admin: delete zone
export async function deleteShippingZone(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('shipping_zones').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/shipping')
  return { success: true as const }
}

// Admin: toggle active
export async function toggleShippingZone(id: string, is_active: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('shipping_zones').update({ is_active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/shipping')
  return { success: true as const }
}
