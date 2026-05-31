/** @type {import('next').NextConfig} */

const supabaseHost = 'paiongqpgggxgfiacspt.supabase.co'
const r2Host = 'pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for its hydration scripts
      "script-src 'self' 'unsafe-inline'",
      // Tailwind + Next.js inject inline styles
      "style-src 'self' 'unsafe-inline'",
      // Allow images from any HTTPS source — product images can come from any URL
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      // Supabase API + realtime
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.flutterwave.com https://checkout.flutterwave.com`,
      // Flutterwave checkout uses iframes for 3DS and bank auth flows
      "frame-src 'self' https://checkout.flutterwave.com https://*.flutterwave.com",
      // Remove X-Frame-Options conflict — frame-src handles it
      "object-src 'none'",
      "base-uri 'self'",
      // Allow Flutterwave's hosted checkout to post back
      "form-action 'self' https://checkout.flutterwave.com https://*.flutterwave.com",
    ].join('; '),
  },
]

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: r2Host,
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
