'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { forgotPassword } from '@/lib/actions/auth'
import { AuthLayout } from '@/components/admin/AuthLayout'
import Turnstile from '@/components/Turnstile'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-[#4A0F1C] hover:bg-[#6B1A2A] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Sending…' : 'Send Reset Link'}
    </button>
  )
}

export default function ForgotPasswordPage() {
  const [state, action] = useFormState(forgotPassword, null)

  if (state?.success) {
    return (
      <AuthLayout
        title="Reset Password"
        subtitle="We'll send you a link to reset your admin password."
        steps={['Enter your email', 'Check your inbox', 'Set new password']}
        activeStep={1}
      >
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-[#E8C4CB]/30 dark:bg-[#4A0F1C]/40 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#6B1A2A] dark:text-[#D4849A]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your inbox</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            If an account exists for <strong className="text-gray-700 dark:text-gray-300">{state.email}</strong>, you'll receive a reset link shortly.
          </p>
          <Link
            href="/admin/login"
            className="inline-block mt-6 text-sm text-[#6B1A2A] dark:text-[#D4849A] font-medium hover:underline"
          >
            ← Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="We'll send you a link to reset your admin password."
      steps={['Enter your email', 'Check your inbox', 'Set new password']}
      activeStep={0}
    >
      <div className="mb-8">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to sign in
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form action={action} className="space-y-4">
        {state?.error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="admin@example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6B1A2A] focus:border-transparent transition-shadow"
          />
        </div>

        <Turnstile className="pt-1" />

        <div className="pt-1">
          <SubmitButton />
        </div>
      </form>
    </AuthLayout>
  )
}
