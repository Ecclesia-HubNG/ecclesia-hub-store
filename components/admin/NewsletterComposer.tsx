'use client'

import { useState, useTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NewsletterComposer({
  totalCustomers,
  totalSubscribers,
}: {
  totalCustomers: number
  totalSubscribers: number
}) {
  const [subject, setSubject] = useState('')
  const [issueNumber, setIssueNumber] = useState('')
  const [body, setBody] = useState('')
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
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `newsletter/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('email-assets').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('email-assets').getPublicUrl(data.path)
      setHeaderImage(publicUrl)
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'newsletter',
          sendTo,
          subject,
          body,
          issueNumber: issueNumber ? Number(issueNumber) : undefined,
          headerImage: headerImage || undefined,
        }),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) { setSubject(''); setBody(''); setIssueNumber(''); setHeaderImage('') }
    })
  }

  const recipientCount = sendTo === 'subscribers' ? totalSubscribers : totalCustomers
  const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Newsletter</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Compose and send your newsletter</p>
      </div>

      {result && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${result.error ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'}`}>
          {result.error ? `Error: ${result.error}` : `✓ Sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}${result.failed ? ` (${result.failed} failed)` : ''}`}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-2xl">
        <div className="space-y-5">
          {/* Subject + issue */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Subject line <span className="text-red-400">*</span></label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. What's new at Ecclesia Hub this week" className={inputCls} />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Issue #</label>
              <input type="number" value={issueNumber} onChange={e => setIssueNumber(e.target.value)} placeholder="12" className={inputCls} />
            </div>
          </div>

          {/* Header image */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Header image (optional)</label>
            {headerImage ? (
              <div className="relative">
                <img src={headerImage} alt="" className="w-full h-36 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
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
                className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 hover:border-[#4A0F1C]/40 hover:text-[#4A0F1C] dark:hover:text-[#D4849A] transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                {uploading ? 'Uploading…' : 'Upload image'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Body <span className="text-red-400">*</span></label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={'Write your newsletter content here.\n\nEach blank line creates a new paragraph in the email.\n\nTip: Keep it personal and concise.'}
              rows={12}
              className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
            />
            <p className="text-xs text-gray-400 mt-1.5">Each blank line creates a new paragraph.</p>
          </div>

          {/* Send to */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Send to</label>
            <div className="flex gap-3">
              {([['subscribers', `Subscribers (${totalSubscribers})`], ['customers', `All Customers (${totalCustomers})`]] as const).map(([val, label]) => (
                <label key={val} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${sendTo === val ? 'border-[#4A0F1C]/40 bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <input type="radio" name="sendTo" value={val} checked={sendTo === val} onChange={() => setSendTo(val)} className="sr-only" />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${sendTo === val ? 'border-[#4A0F1C]' : 'border-gray-300 dark:border-gray-600'}`}>
                    {sendTo === val && <span className="w-1.5 h-1.5 rounded-full bg-[#4A0F1C]" />}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Send button */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              Sending to <strong className="text-gray-600 dark:text-gray-300">{recipientCount} {sendTo === 'subscribers' ? 'subscriber' : 'customer'}{recipientCount !== 1 ? 's' : ''}</strong>
            </p>
            <button
              type="button"
              onClick={handleSend}
              disabled={pending || !subject.trim() || !body.trim() || recipientCount === 0}
              className="px-5 py-2.5 text-sm font-semibold bg-[#4A0F1C] hover:bg-[#3A0B15] text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              {pending ? 'Sending…' : 'Send Newsletter →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
