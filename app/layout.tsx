import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Ecclesia Hub — Premium Skincare',
  description: 'Premium skincare delivered to your door.',
  openGraph: {
    title: 'Ecclesia Hub — Premium Skincare',
    description: 'Premium skincare delivered to your door.',
    siteName: 'Ecclesia Hub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ecclesia Hub — Premium Skincare',
    description: 'Premium skincare delivered to your door.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  )
}
