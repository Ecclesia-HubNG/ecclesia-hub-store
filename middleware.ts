import { type NextRequest, NextResponse } from 'next/server'
import { updateSession, updateSessionWithAdminCheck } from '@/lib/supabase/middleware'
import { ratelimit } from '@/lib/redis'

const ADMIN_PUBLIC_PATHS = [
  '/admin/login',
  '/admin/register',
  '/admin/forgot-password',
  '/admin/reset-password',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  // Never run session refresh on the auth callback — it can corrupt the PKCE
  // code_verifier cookie when stale session cookies are present, causing
  // exchangeCodeForSession to fail with AuthPKCECodeVerifierMissingError.
  if (pathname === '/auth/callback') {
    return NextResponse.next()
  }

  // Rate limit all API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
    const { success, limit, remaining, reset } = await ratelimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  if (pathname.startsWith('/admin')) {
    // Auth pages are public — just refresh the session cookie, no role check
    if (ADMIN_PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      return await updateSession(request)
    }

    // All other /admin pages require an authenticated staff user
    return await updateSessionWithAdminCheck(request)
  }

  // Refresh session for all store routes so OAuth cookies propagate correctly
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
