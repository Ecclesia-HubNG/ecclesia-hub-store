import { type NextRequest, NextResponse } from 'next/server'
import { updateSession, updateSessionWithAdminCheck } from '@/lib/supabase/middleware'

const ADMIN_PUBLIC_PATHS = [
  '/admin/login',
  '/admin/register',
  '/admin/forgot-password',
  '/admin/reset-password',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase env vars — skipping session update')
      return NextResponse.next()
    }

    // Auth pages are public — just refresh the session cookie, no role check
    if (ADMIN_PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      return await updateSession(request)
    }

    // All other /admin pages require an authenticated user with role = 'admin'
    return await updateSessionWithAdminCheck(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
