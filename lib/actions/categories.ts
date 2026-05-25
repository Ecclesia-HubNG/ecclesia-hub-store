'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function parseForm(formData: FormData) {
  const name = formData.get('name') as string
  const slug = ((formData.get('slug') as string) || '').trim()
  const parentId = (formData.get('parent_id') as string) || null
  return {
    name,
    slug: slug || slugify(name),
    description: (formData.get('description') as string) || null,
    image: (formData.get('image') as string) || null,
    is_featured: formData.get('is_featured') === 'on',
    parent_id: parentId || null,
  }
}

export async function createCategory(_: unknown, formData: FormData) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('categories').insert(parseForm(formData)).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath('/admin/categories/new')
  return { success: true as const, id: data.id }
}

export async function updateCategory(id: string, _: unknown, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('categories').update(parseForm(formData)).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath('/', 'page')
  revalidatePath('/home', 'page')
  return { success: true as const }
}

export async function deleteCategory(formData: FormData) {
  const supabase = createAdminClient()
  await supabase.from('categories').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/categories')
}

export async function createCategoryInline(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  const supabase = createAdminClient()
  const base = slugify(name)
  const slug = `${base}-${Date.now()}`
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), slug })
    .select('id, name')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  return data
}
