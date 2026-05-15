'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function parseForm(formData: FormData) {
  const name = formData.get('name') as string
  const slug = ((formData.get('slug') as string) || '').trim()
  return {
    name,
    slug: slug || slugify(name),
    description: (formData.get('description') as string) || null,
    logo:        (formData.get('logo') as string) || null,
    website:     (formData.get('website') as string) || null,
    is_featured: formData.get('is_featured') === 'on',
  }
}

export async function createBrand(_: unknown, formData: FormData) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('brands').insert(parseForm(formData)).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/admin/brands')
  revalidatePath('/admin/brands/new')
  return { success: true as const, id: data.id }
}

export async function updateBrand(id: string, _: unknown, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('brands').update(parseForm(formData)).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/brands')
  return { success: true as const }
}

export async function deleteBrand(formData: FormData) {
  const supabase = createAdminClient()
  await supabase.from('brands').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/brands')
}

export async function createBrandInline(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  const supabase = createAdminClient()
  const base = slugify(name)
  const slug = `${base}-${Date.now()}`
  const { data, error } = await supabase
    .from('brands')
    .insert({ name: name.trim(), slug })
    .select('id, name')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/brands')
  return data
}
