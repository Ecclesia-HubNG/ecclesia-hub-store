import { type NextRequest, NextResponse } from 'next/server'

// ── Constants ──────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// @supabase/auth-js default storageKey constant — what createBrowserClient uses
// when no cookieOptions.name is provided.
const STORAGE_KEY  = 'supabase.auth.token'
const VERIFIER_KEY = `${STORAGE_KEY}-code-verifier`
const MAX_AGE      = 400 * 24 * 60 * 60   // ~400 days
const COOKIE_OPTS  = { path: '/', sameSite: 'lax' as const, httpOnly: false, maxAge: MAX_AGE }
const REMOVE_OPTS  = { path: '/', sameSite: 'lax' as const, httpOnly: false, maxAge: 0 }

// ── Helpers ────────────────────────────────────────────────────────────────
// Decode the base64url string that @supabase/ssr stores in cookies.
// Cookie value format: "base64-<base64url(UTF-8 string)>"
function decodeSsrCookie(raw: string): string | null {
  const encoded = raw.startsWith('base64-') ? raw.slice(7) : raw
  try {
    // Convert URL-safe base64 → standard base64 → bytes → UTF-8 string
    const standard = encoded.replace(/-/g, '+').replace(/_/g, '/')
    return Buffer.from(standard, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

// Encode a string in @supabase/ssr cookie format.
function encodeSsrCookie(value: string): string {
  const b64 = Buffer.from(value, 'utf-8').toString('base64')
  const b64url = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `base64-${b64url}`
}

// Read a possibly-chunked @supabase/ssr cookie value from the request.
function readSsrCookie(
  cookies: { name: string; value: string }[],
  key: string,
): string | null {
  // Try plain key first (no chunking)
  const plain = cookies.find((c) => c.name === key)
  if (plain?.value) return decodeSsrCookie(plain.value)

  // Reassemble chunks: key.0 + key.1 + …
  const chunks: string[] = []
  for (let i = 0; ; i++) {
    const chunk = cookies.find((c) => c.name === `${key}.${i}`)
    if (!chunk?.value) break
    chunks.push(chunk.value)
  }
  if (chunks.length === 0) return null
  return decodeSsrCookie(chunks.join(''))
}

// Write a session object as an @supabase/ssr-compatible cookie on a response.
// Typical sessions are < 3 KB so we don't bother chunking.
function writeSessionCookie(res: NextResponse, session: unknown): void {
  res.cookies.set(STORAGE_KEY, encodeSsrCookie(JSON.stringify(session)), COOKIE_OPTS)
  // Clear any stale chunks from a previous chunked session
  for (let i = 0; i < 5; i++) {
    res.cookies.set(`${STORAGE_KEY}.${i}`, '', REMOVE_OPTS)
  }
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code      = searchParams.get('code')
  const next      = searchParams.get('next') ?? '/account/orders'
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type')

  const fail = (msg = 'Could not sign you in. Please try again.') => {
    const u = new URL('/account', origin)
    u.searchParams.set('error', msg)
    return NextResponse.redirect(u)
  }

  // ── Email OTP / magic-link flow (token_hash) ────────────────────────────
  if (tokenHash && type) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ token_hash: tokenHash, type }),
    })
    if (!res.ok) return fail()
    const session = await res.json()
    const redirect = NextResponse.redirect(`${origin}${next}`)
    writeSessionCookie(redirect, session)
    return redirect
  }

  // ── OAuth PKCE flow (code) ──────────────────────────────────────────────
  if (!code) return NextResponse.redirect(`${origin}/account`)

  const allCookies = request.cookies.getAll()
  const verifierEncoded = readSsrCookie(allCookies, VERIFIER_KEY)

  if (!verifierEncoded) {
    return fail('Session data missing. Please try signing in again.')
  }

  // auth-js wraps every storage write in JSON.stringify, so decode that layer
  let storedVerifier: string
  try {
    storedVerifier = JSON.parse(verifierEncoded)
  } catch {
    return fail()
  }

  // Stored value is "codeVerifier" or "codeVerifier/recovery"
  const codeVerifier = storedVerifier.split('/')[0]
  if (!codeVerifier) return fail()

  // Exchange the Supabase auth code for a session
  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier }),
  })

  if (!tokenRes.ok) {
    console.error('[auth/callback] PKCE exchange failed:', await tokenRes.text().catch(() => ''))
    return fail()
  }

  const session = await tokenRes.json()

  const redirect = NextResponse.redirect(`${origin}${next}`)
  writeSessionCookie(redirect, session)

  // Remove the consumed code-verifier cookie
  redirect.cookies.set(VERIFIER_KEY, '', REMOVE_OPTS)
  for (let i = 0; i < 5; i++) {
    redirect.cookies.set(`${VERIFIER_KEY}.${i}`, '', REMOVE_OPTS)
  }

  return redirect
}
