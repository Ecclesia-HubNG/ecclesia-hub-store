'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
    image: (formData.get('image') as string) || null,
  }
}

export async function createCategory(_: unknown, formData: FormData) {
  const supabase = createClient()
  const { error } = await supabase.from('categories').insert(parseForm(formData))
  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function updateCategory(id: string, _: unknown, formData: FormData) {
  const supabase = createClient()
  const { error } = await supabase.from('categories').update(parseForm(formData)).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function deleteCategory(formData: FormData) {
  const supabase = createClient()
  await supabase.from('categories').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/categories')
}

export async function createCategoryInline(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  const supabase = createClient()
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
