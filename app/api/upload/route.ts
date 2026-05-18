import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'
import { createAdminClient } from '@/lib/supabase/admin'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file || !file.size) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: CORS_HEADERS })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400, headers: CORS_HEADERS })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400, headers: CORS_HEADERS })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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

  // Record in media library (non-blocking — don't fail upload if this fails)
  try {
    const admin = createAdminClient()
    await admin.from('media_assets').insert({
      url, key, name: file.name, size: file.size, mime_type: file.type, folder: 'products',
    })
  } catch {}

  return NextResponse.json({ url }, { headers: CORS_HEADERS })
}
