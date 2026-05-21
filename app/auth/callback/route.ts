import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account/orders'

  if (code) {
    // Build the redirect response first, then write session cookies directly onto it
    const redirectTo = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectTo.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) return redirectTo

    // Exchange failed — redirect back to sign-in with error
    const errorUrl = new URL('/account', origin)
    errorUrl.searchParams.set('error', 'Could not sign you in. Please try again.')
    return NextResponse.redirect(errorUrl)
  }

  // Email OTP / magic link flow uses token_hash
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (tokenHash && type) {
    const redirectTo = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectTo.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
    return redirectTo
  }

  return NextResponse.redirect(`${origin}/account`)
}
