'use server'
import { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
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

  // Record in media_assets — non-blocking, R2 upload already succeeded
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('media_assets')
      .upsert({ url, key, name: file.name, size: file.size, mime_type: file.type, folder }, { onConflict: 'key' })
      .select('id')
      .single()
    return { url, id: data?.id }
  } catch {
    // DB record failed but file is safely on R2 — still return the URL
    return { url }
  }
}

export async function deleteMedia(id: string, key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))

  // id === key means the item exists only in R2, not in the DB
  if (id !== key) {
    const admin = createAdminClient()
    const { error } = await admin.from('media_assets').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
  revalidatePath('/admin/media')
}

export async function getMediaAssets(folder?: string) {
  const base = R2_PUBLIC_URL.replace(/\/$/, '')
  const admin = createAdminClient()

  // Pull DB records and R2 object listing in parallel
  const [{ data: dbRows }, r2List] = await Promise.all([
    admin
      .from('media_assets')
      .select('id, url, key, name, size, mime_type, folder, created_at')
      .order('created_at', { ascending: false }),
    r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, MaxKeys: 1000 })),
  ])

  const dbByKey = new Map((dbRows ?? []).map(r => [r.key, r]))

  // Build merged list: DB record if exists, otherwise synthesise from R2 object
  const merged = (r2List.Contents ?? [])
    .filter(obj => obj.Key && /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(obj.Key))
    .map(obj => {
      const key = obj.Key!
      if (dbByKey.has(key)) return dbByKey.get(key)!
      const segments = key.split('/')
      return {
        id: key,          // use key as id for R2-only items
        url: `${base}/${key}`,
        key,
        name: segments[segments.length - 1],
        size: obj.Size ?? null,
        mime_type: null,
        folder: segments.length > 1 ? segments[0] : 'general',
        created_at: obj.LastModified?.toISOString() ?? new Date().toISOString(),
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (folder) return merged.filter(a => a.folder === folder)
  return merged
}
