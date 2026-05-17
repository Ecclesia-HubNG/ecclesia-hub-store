'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadEmailAsset(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  const admin = createAdminClient()

  // Auto-create the bucket if it doesn't exist yet
  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.find(b => b.name === 'email-assets')) {
    const { error: createErr } = await admin.storage.createBucket('email-assets', { public: true })
    if (createErr) return { error: `Could not create storage bucket: ${createErr.message}` }
  }

  const bytes = await file.arrayBuffer()
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `${Date.now()}.${ext}`

  const { data, error } = await admin.storage
    .from('email-assets')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = admin.storage.from('email-assets').getPublicUrl(data.path)
  return { url: publicUrl }
}
