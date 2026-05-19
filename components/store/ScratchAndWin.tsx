'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { checkScratchEligibility } from '@/lib/actions/scratch'

const PRIZES = [
  { label: '10% OFF', code: 'SCRATCH10', description: '10% off your next order', color: '#D4849A' },
  { label: '₦500 OFF', code: 'SAVE500', description: 'Save ₦500 on orders above ₦5,000', color: '#F59E0B' },
  { label: 'FREE DELIVERY', code: 'FREESHIP', description: 'Free shipping on your next order', color: '#34D399' },
  { label: '5% CASHBACK', code: 'CASH5', description: '5% cashback on your order', color: '#60A5FA' },
  { label: 'TRY AGAIN', code: null, description: 'Better luck next time! Come back tomorrow.', color: '#9CA3AF' },
  { label: 'TRY AGAIN', code: null, description: 'Better luck next time! Come back tomorrow.', color: '#9CA3AF' },
]

const SCRATCH_KEY = 'eh_scratch_date'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function ScratchAndWin() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)

  const [prize] = useState(() => PRIZES[Math.floor(Math.random() * PRIZES.length)])
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [pct, setPct] = useState(0)
  const [eligibility, setEligibility] = useState<{ eligible: boolean; reason: string | null; minAmount: number } | null>(null)

  // Check eligibility + already played
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAlreadyPlayed(localStorage.getItem(SCRATCH_KEY) === todayStr())
    }
    checkScratchEligibility().then(setEligibility)
  }, [])

  // Draw silver scratch overlay
  useEffect(() => {
    if (alreadyPlayed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Silver gradient overlay
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, '#C8C8C8')
    grad.addColorStop(0.5, '#E8E8E8')
    grad.addColorStop(1, '#B8B8B8')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Subtle shimmer lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 18) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i - 20, canvas.height)
      ctx.stroke()
    }

    // Instruction text
    ctx.fillStyle = 'rgba(80,80,80,0.7)'
    ctx.font = 'bold 15px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(100,100,100,0.6)'
    ctx.fillText('Swipe to reveal your prize', canvas.width / 2, canvas.height / 2 + 12)
  }, [alreadyPlayed])

  const checkCoverage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let transparent = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) transparent++
    }
    const coverage = Math.round((transparent / (canvas.width * canvas.height)) * 100)
    setPct(coverage)
    if (coverage >= 60 && !revealed) {
      setRevealed(true)
      localStorage.setItem(SCRATCH_KEY, todayStr())
    }
  }, [revealed])

  const scratchAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 28, 0, Math.PI * 2)
    ctx.fill()
    checkCoverage()
  }, [checkCoverage])

  const getXY = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy }
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  function copyCode() {
    if (!prize.code) return
    navigator.clipboard.writeText(prize.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="w-full px-3 md:px-5 pb-16">
      <div className="relative rounded-3xl overflow-hidden bg-[#4A0F1C]">

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#7B1D30]/50 blur-3xl" />
          <div className="absolute right-0 -bottom-16 w-64 h-64 rounded-full bg-[#2A0810]/80 blur-2xl" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative z-10 grid md:grid-cols-2 gap-0 items-center">

          {/* ── Left: copy ── */}
          <div className="px-8 md:px-14 py-12 md:py-16 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-px bg-[#D4849A]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4849A]">Daily reward</span>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                Scratch &amp;
              </h2>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                Win a Prize
              </h2>
            </div>

            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              One free scratch card every day. Reveal your prize and use the code at checkout — no minimum spend required.
            </p>

            {/* Steps */}
            <div className="space-y-3">
              {[
                'Scratch the card by swiping',
                'See what you\'ve won',
                'Copy the code & use at checkout',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/10 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-white/70">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: scratch card ── */}
          <div className="flex items-center justify-center px-8 md:px-14 pb-12 md:py-16">
            <div className="w-full max-w-sm">

              {/* Loading */}
              {!eligibility && (
                <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-8 flex items-center justify-center h-48">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                </div>
              )}

              {/* Not logged in */}
              {eligibility?.reason === 'login' && (
                <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                    <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Sign in to play</p>
                    <p className="text-white/50 text-sm">Create an account and make a purchase to unlock your daily scratch card.</p>
                  </div>
                  <Link href="/auth" className="inline-flex px-6 py-2.5 bg-white text-[#4A0F1C] text-sm font-bold rounded-full hover:bg-gray-100 transition-colors">
                    Sign in
                  </Link>
                </div>
              )}

              {/* No qualifying order */}
              {eligibility?.reason === 'no_order' && (
                <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#D4849A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Unlock your scratch card</p>
                    <p className="text-white/50 text-sm">
                      Make a purchase of <span className="text-[#D4849A] font-semibold">₦{eligibility.minAmount.toLocaleString('en')}+</span> to earn a daily scratch card.
                    </p>
                  </div>
                  <Link href="/shop" className="inline-flex px-6 py-2.5 bg-white text-[#4A0F1C] text-sm font-bold rounded-full hover:bg-gray-100 transition-colors">
                    Shop now
                  </Link>
                </div>
              )}

              {/* Already played today */}
              {eligibility?.eligible && alreadyPlayed && (
                <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-8 text-center space-y-3">
                  <p className="text-white font-bold text-lg">Come back tomorrow</p>
                  <p className="text-white/50 text-sm">You've already scratched today. A new card unlocks at midnight.</p>
                  <Link href="/shop" className="inline-flex mt-2 px-6 py-2.5 bg-white text-[#4A0F1C] text-sm font-bold rounded-full hover:bg-gray-100 transition-colors">
                    Keep shopping
                  </Link>
                </div>
              )}

              {/* Eligible + not played — show scratch card */}
              {eligibility?.eligible && !alreadyPlayed && (
                <div className="bg-white/[0.07] border border-white/10 rounded-2xl overflow-hidden">

                  {/* Prize behind the scratch layer */}
                  <div className="relative">
                    {/* Prize display (visible underneath) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 bg-white/5">
                      <span className="text-4xl font-black" style={{ color: prize.color }}>{prize.label}</span>
                      <p className="text-white/70 text-xs text-center">{prize.description}</p>
                    </div>

                    {/* Canvas scratch layer on top */}
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={180}
                      className={`relative z-10 w-full touch-none cursor-crosshair ${revealed ? 'opacity-0 pointer-events-none' : ''} transition-opacity duration-500`}
                      onMouseDown={e => { isDrawing.current = true; const p = getXY(e); scratchAt(p.x, p.y) }}
                      onMouseMove={e => { if (!isDrawing.current) return; const p = getXY(e); scratchAt(p.x, p.y) }}
                      onMouseUp={() => { isDrawing.current = false }}
                      onMouseLeave={() => { isDrawing.current = false }}
                      onTouchStart={e => { isDrawing.current = true; const p = getXY(e); scratchAt(p.x, p.y) }}
                      onTouchMove={e => { e.preventDefault(); if (!isDrawing.current) return; const p = getXY(e); scratchAt(p.x, p.y) }}
                      onTouchEnd={() => { isDrawing.current = false }}
                    />

                  </div>

                  {/* Progress + action */}
                  <div className="px-5 py-4 border-t border-white/10">
                    {!revealed ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] text-white/40">
                          <span>Scratch progress</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D4849A] rounded-full transition-all duration-150"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : prize.code ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 font-mono text-white font-bold text-sm tracking-wider">
                          {prize.code}
                        </div>
                        <button
                          onClick={copyCode}
                          className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            copied ? 'bg-green-500 text-white' : 'bg-white text-[#4A0F1C] hover:bg-gray-100'
                          }`}
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-white/50 text-sm py-1">No prize this time — try again tomorrow!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
