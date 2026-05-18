'use server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function uploadMedia(
  formData: FormData,
  folder = 'general'
): Promise<{ url?: string; id?: string; error?: string }> {
  const file = formData.get('file') as File | null
  if (!file || !file.size) return { error: 'No file provided' }
  if (!file.type.startsWith('image/')) return { error: 'Only image files allowed' }
  if (file.size > 10 * 1024 * 1024) return { error: 'File exceeds 10 MB' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.byteLength,
    })
  )

  const base = R2_PUBLIC_URL.replace(/\/$/, '')
  const url = `${base}/${key}`

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('media_assets')
    .insert({ url, key, name: file.name, size: file.size, mime_type: file.type, folder })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { url, id: data.id }
}

export async function deleteMedia(id: string, key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))

  const admin = createAdminClient()
  const { error } = await admin.from('media_assets').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/media')
}

export async function getMediaAssets(folder?: string) {
  const admin = createAdminClient()
  let query = admin
    .from('media_assets')
    .select('id, url, key, name, size, mime_type, folder, created_at')
    .order('created_at', { ascending: false })

  if (folder) query = query.eq('folder', folder)
  const { data } = await query
  return data ?? []
}
