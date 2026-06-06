'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type ShippingLocation = {
  id: string
  branch_id: string
  name: string
  price: number
  is_active: boolean
  created_at: string
}

export type ShippingBranch = {
  id: string
  state_id: string
  name: string
  is_active: boolean
  created_at: string
  locations: ShippingLocation[]
}

export type ShippingState = {
  id: string
  name: string
  is_active: boolean
  created_at: string
  branches: ShippingBranch[]
}

// ── Public: used at checkout ──────────────────────────────────────────────────
// Returns only active states that have at least one active branch with locations.

export async function getActiveShippingTree(): Promise<ShippingState[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('shipping_states')
    .select(`
      id, name, is_active, created_at,
      shipping_branches (
        id, state_id, name, is_active, created_at,
        shipping_locations ( id, branch_id, name, price, is_active, created_at )
      )
    `)
    .eq('is_active', true)
    .order('name')

  if (!data) return []

  type RawState = ShippingState & {
    shipping_branches: Array<ShippingBranch & { shipping_locations: ShippingLocation[] }>
  }

  return (data as unknown as RawState[])
    .map(s => ({
      ...s,
      branches: (s.shipping_branches ?? [])
        .filter(b => b.is_active)
        .map(b => ({
          ...b,
          locations: (b.shipping_locations ?? []).filter(l => l.is_active),
        }))
        .filter(b => b.locations.length > 0),
    }))
    .filter(s => s.branches.length > 0)
}

// ── Admin: full tree including inactive ───────────────────────────────────────

export async function adminGetShippingTree(): Promise<ShippingState[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('shipping_states')
    .select(`
      id, name, is_active, created_at,
      shipping_branches (
        id, state_id, name, is_active, created_at,
        shipping_locations ( id, branch_id, name, price, is_active, created_at )
      )
    `)
    .order('name')

  if (!data) return []

  type RawState = ShippingState & {
    shipping_branches: Array<ShippingBranch & { shipping_locations: ShippingLocation[] }>
  }

  return (data as unknown as RawState[]).map(s => ({
    ...s,
    branches: (s.shipping_branches ?? []).map(b => ({
      ...b,
      locations: b.shipping_locations ?? [],
    })),
  }))
}

// ── States ────────────────────────────────────────────────────────────────────

export async function createState(
  name: string,
): Promise<{ id: string; name: string; is_active: boolean; created_at: string } | { error: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shipping_states')
    .insert({ name: name.trim() })
    .select('id, name, is_active, created_at')
    .single()
  if (error) return { error: error.message }
  return data
}

export async function updateState(
  id: string,
  updates: Partial<{ name: string; is_active: boolean }>,
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('shipping_states').update(updates).eq('id', id)
  return error ? { error: error.message } : {}
}

export async function deleteState(id: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('shipping_states').delete().eq('id', id)
  return error ? { error: error.message } : {}
}

// ── Branches ──────────────────────────────────────────────────────────────────

export async function createBranch(
  stateId: string,
  name: string,
): Promise<{ id: string; state_id: string; name: string; is_active: boolean; created_at: string } | { error: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shipping_branches')
    .insert({ state_id: stateId, name: name.trim() })
    .select('id, state_id, name, is_active, created_at')
    .single()
  if (error) return { error: error.message }
  return data
}

export async function updateBranch(
  id: string,
  updates: Partial<{ name: string; is_active: boolean }>,
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('shipping_branches').update(updates).eq('id', id)
  return error ? { error: error.message } : {}
}

export async function deleteBranch(id: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('shipping_branches').delete().eq('id', id)
  return error ? { error: error.message } : {}
}

// ── Locations ─────────────────────────────────────────────────────────────────

export async function createLocation(
  branchId: string,
  name: string,
  price: number,
): Promise<{ id: string; branch_id: string; name: string; price: number; is_active: boolean; created_at: string } | { error: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shipping_locations')
    .insert({ branch_id: branchId, name: name.trim(), price })
    .select('id, branch_id, name, price, is_active, created_at')
    .single()
  if (error) return { error: error.message }
  return data
}

export async function updateLocation(
  id: string,
  updates: Partial<{ name: string; price: number; is_active: boolean }>,
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('shipping_locations').update(updates).eq('id', id)
  return error ? { error: error.message } : {}
}

export async function deleteLocation(id: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('shipping_locations').delete().eq('id', id)
  return error ? { error: error.message } : {}
}
