'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export default function SuccessToast({ message }: { message: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('saved') === '1') {
      setShow(true)
      const p = new URLSearchParams(searchParams.toString())
      p.delete('saved')
      router.replace(pathname + (p.size ? '?' + p.toString() : ''), { scroll: false })
      const t = setTimeout(() => setShow(false), 4500)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl transition-all duration-300 ease-out whitespace-nowrap ${
        show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <span className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </span>
      {message}
      <button
        onClick={() => setShow(false)}
        className="ml-1 text-white/40 hover:text-white transition-colors leading-none text-base"
      >
        ×
      </button>
    </div>
  )
}
