// Verifies a Cloudflare Turnstile token server-side. Used for flows that
// don't go through Supabase Auth (which has its own native captchaToken
// support) — currently just checkout.
export async function verifyTurnstile(token: FormDataEntryValue | null, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // not configured — don't block
  if (!token || typeof token !== 'string') return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}
