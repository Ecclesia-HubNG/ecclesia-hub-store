'use client'

import { useState, useTransition, useRef } from 'react'
import { uploadEmailAsset } from '@/lib/actions/upload'
import RichTextEditor from '@/components/admin/RichTextEditor'

// ── Live preview ──────────────────────────────────────────────────────────────
function NewsletterPreview({
  subject, bodyHtml, issueNumber, headerImage,
}: {
  subject: string
  bodyHtml: string
  issueNumber: string
  headerImage: string
}) {
  const date = new Date().toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ backgroundColor: '#f0f0f0', padding: '20px 12px', fontFamily: 'Georgia, serif', borderRadius: 12, minHeight: 400 }}>
      {/* Meta */}
      <p style={{ textAlign: 'center', fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px', fontFamily: 'Arial, sans-serif' }}>
        {date}{issueNumber ? ` · Issue #${issueNumber}` : ''}
      </p>

      {/* Brand header */}
      <div style={{ backgroundColor: '#4A0F1C', borderRadius: '10px 10px 0 0', padding: '20px 28px', textAlign: 'center' }}>
        <p style={{ color: '#fff', fontSize: 18, margin: '0 0 2px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>Ecclesia Hub</p>
        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>Newsletter</p>
      </div>

      {/* Header image */}
      {headerImage && (
        <div style={{ backgroundColor: '#fff', padding: '14px 28px 0' }}>
          <img src={headerImage} style={{ width: '100%', borderRadius: 6, objectFit: 'cover', maxHeight: 140, display: 'block' }} alt="" />
        </div>
      )}

      {/* Subject */}
      <div style={{ backgroundColor: '#fff', padding: '20px 28px 6px' }}>
        <p style={{ fontSize: 17, color: subject ? '#111' : '#bbb', margin: '0 0 10px', fontWeight: 700, lineHeight: 1.3 }}>
          {subject || 'Your subject line…'}
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0 0 14px' }} />
      </div>

      {/* Body */}
      <div style={{ backgroundColor: '#fff', padding: '0 28px 28px', borderRadius: '0 0 10px 10px' }}>
        {bodyHtml
          ? <div style={{ fontSize: 13, color: '#333', lineHeight: 1.85 }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          : <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.85, margin: 0 }}>Your newsletter content will appear here…</p>
        }
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '18px 0 14px' }} />
        <p style={{ fontSize: 12, color: '#888', margin: 0, fontFamily: 'Arial, sans-serif' }}>— The Ecclesia Hub Team</p>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '14px 0 0' }}>
        <p style={{ color: '#aaa', fontSize: 10, margin: '0 0 2px', fontFamily: 'Arial, sans-serif' }}>Ecclesia Hub · Lagos, Nigeria</p>
        <p style={{ color: '#aaa', fontSize: 10, margin: 0, fontFamily: 'Arial, sans-serif' }}>
          <span style={{ color: '#6B1A2A' }}>Shop now</span>
          {' · Unsubscribe · Contact'}
        </p>
      </div>
    </div>
  )
}

// ── Main composer ─────────────────────────────────────────────────────────────
export default function NewsletterComposer({
  totalCustomers,
  totalSubscribers,
}: {
  totalCustomers: number
  totalSubscribers: number
}) {
  const [subject, setSubject] = useState('')
  const [issueNumber, setIssueNumber] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [headerImage, setHeaderImage] = useState('')
  const [sendTo, setSendTo] = useState<'subscribers' | 'customers'>('subscribers')
  const [result, setResult] = useState<{ sent?: number; failed?: number; error?: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadEmailAsset(fd)
      if (res.error) throw new Error(res.error)
      setHeaderImage(res.url!)
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSend() {
    if (!subject.trim()) { setResult({ error: 'Subject line is required.' }); return }
    if (!bodyHtml.trim()) { setResult({ error: 'Newsletter content is required.' }); return }
    setResult(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'newsletter',
            sendTo,
            subject,
            bodyHtml,
            issueNumber: issueNumber ? Number(issueNumber) : undefined,
            headerImage: headerImage || undefined,
          }),
        })
        const data = await res.json().catch(() => ({ error: `Server returned an unexpected response (status ${res.status}).` }))
        setResult(data)
        if (data.success) { setSubject(''); setBodyHtml(''); setIssueNumber(''); setHeaderImage('') }
      } catch (err: any) {
        setResult({ error: err?.message || 'Network error — could not reach the server.' })
      }
    })
  }

  const recipientCount = sendTo === 'subscribers' ? totalSubscribers : totalCustomers
  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Newsletter</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Compose and preview your newsletter before sending</p>
      </div>

      {result && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${result.error ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'}`}>
          {result.error ? `Error: ${result.error}` : `✓ Sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}${result.failed ? ` (${result.failed} failed)` : ''}`}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ── Left: form ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
          {/* Subject + issue */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Subject line <span className="text-red-400">*</span></label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. What's new at Ecclesia Hub" className={inputCls} />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Issue #</label>
              <input type="number" value={issueNumber} onChange={e => setIssueNumber(e.target.value)} placeholder="12" className={inputCls} />
            </div>
          </div>

          {/* Header image */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Header image <span className="text-gray-400 font-normal">(optional)</span></label>
            {headerImage ? (
              <div className="relative">
                <img src={headerImage} alt="" className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                <button
                  type="button"
                  onClick={() => setHeaderImage('')}
                  className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center gap-2 w-full h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 hover:border-[#4A0F1C]/40 hover:text-[#4A0F1C] dark:hover:text-[#D4849A] transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                {uploading ? 'Uploading…' : 'Upload header image'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Content <span className="text-red-400">*</span></label>
            <RichTextEditor onChange={setBodyHtml} placeholder="Write your newsletter content here…" minHeight={260} />
          </div>

          {/* Send to */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Send to</label>
            <div className="flex gap-2.5">
              {([['subscribers', `Subscribers`, totalSubscribers], ['customers', `All Customers`, totalCustomers]] as const).map(([val, label, count]) => (
                <label key={val} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border cursor-pointer transition-colors ${sendTo === val ? 'border-[#4A0F1C]/40 bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <input type="radio" name="nlSendTo" value={val} checked={sendTo === val} onChange={() => setSendTo(val)} className="sr-only" />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${sendTo === val ? 'border-[#4A0F1C]' : 'border-gray-300 dark:border-gray-600'}`}>
                    {sendTo === val && <span className="w-1.5 h-1.5 rounded-full bg-[#4A0F1C]" />}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="text-xs text-gray-400">({count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Send button */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400">
              Sending to <strong className="text-gray-600 dark:text-gray-300">{recipientCount} {sendTo === 'subscribers' ? 'subscriber' : 'customer'}{recipientCount !== 1 ? 's' : ''}</strong>
            </p>
            <button
              type="button"
              onClick={handleSend}
              disabled={pending || !subject.trim() || !bodyHtml.trim() || recipientCount === 0}
              className="px-5 py-2.5 text-sm font-semibold bg-[#4A0F1C] hover:bg-[#3A0B15] text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              {pending ? 'Sending…' : 'Send Newsletter →'}
            </button>
          </div>
        </div>

        {/* ── Right: preview ── */}
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email Preview</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">— what recipients will see</span>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="ml-2 text-xs text-gray-400 font-mono truncate">Newsletter · {subject || 'No subject'}</span>
            </div>
            <div className="overflow-y-auto max-h-[700px]">
              <NewsletterPreview
                subject={subject}
                bodyHtml={bodyHtml}
                issueNumber={issueNumber}
                headerImage={headerImage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
