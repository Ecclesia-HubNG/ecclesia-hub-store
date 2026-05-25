import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'image/avif': ['avif'],
}

const ALLOWED_FOLDERS = ['products', 'brands', 'categories', 'homepage', 'featured', 'general']

export async function POST(req: NextRequest) {
  // Require an authenticated admin session
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = user.app_metadata?.role ?? ''
  if (!['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folderParam = (formData.get('folder') as string | null) ?? 'products'
  const folder = ALLOWED_FOLDERS.includes(folderParam) ? folderParam : 'products'

  if (!file || !file.size) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Server-side size check
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 413 })
  }

  // Validate MIME type
  const allowedExts = ALLOWED_TYPES[file.type]
  if (!allowedExts) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.' }, { status: 400 })
  }

  // Validate extension matches the declared MIME type
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  if (!allowedExts.includes(ext)) {
    return NextResponse.json({ error: 'File extension does not match its type.' }, { status: 400 })
  }

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

  try {
    const admin = createAdminClient()
    await admin.from('media_assets').insert({
      url, key, name: file.name, size: file.size, mime_type: file.type, folder,
    })
  } catch {}

  return NextResponse.json({ url })
}
