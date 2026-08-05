'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

let scriptPromise: Promise<void> | null = null
function loadScript() {
  if (!scriptPromise) {
    scriptPromise = new Promise(resolve => {
      if (window.turnstile) return resolve()
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export type TurnstileHandle = {
  // Turnstile tokens are single-use — siteverify rejects a token the second
  // time it's sent. Callers MUST reset the widget after any failed submit
  // (wrong password, stock error, payment failure, etc.) so the next retry
  // gets a fresh token instead of silently failing verification.
  reset: () => void
}

// Renders the Cloudflare Turnstile widget. When placed inside a <form>, it
// auto-injects a hidden `cf-turnstile-response` input that's included in
// FormData on submit. Pass `onVerify` for forms that manage their own state
// instead of reading FormData (e.g. checkout).
const Turnstile = forwardRef<TurnstileHandle, { className?: string; onVerify?: (token: string) => void }>(
  function Turnstile({ className, onVerify }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetId = useRef<string | null>(null)

    useImperativeHandle(ref, () => ({
      reset() {
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
      },
    }))

    useEffect(() => {
      let cancelled = false
      loadScript().then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          callback: onVerify,
        })
      })
      return () => {
        cancelled = true
        if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <div ref={containerRef} className={className} />
  }
)

export default Turnstile
