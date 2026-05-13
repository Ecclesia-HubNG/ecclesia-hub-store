'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { AuthLayout } from '@/components/admin/AuthLayout'
import { PasswordInput } from '@/components/admin/PasswordInput'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-[#4A0F1C] hover:bg-[#6B1A2A] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating account…' : 'Create Account'}
    </button>
  )
}

export default function AdminRegisterPage() {
  const [state, action] = useFormState(signUp, null)

  if (state?.success) {
    return (
      <AuthLayout
        title="Get Started"
        subtitle="Create your admin account to manage the Ecclesia Hub store."
        steps={['Create your account', 'Verify your email', 'Start managing']}
        activeStep={1}
      >
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            We sent a confirmation link to <strong className="text-gray-700 dark:text-gray-300">{state.email}</strong>. Click it to activate your account.
          </p>
          <Link
            href="/admin/login"
            className="inline-block mt-6 text-sm text-[#6B1A2A] dark:text-[#D4849A] font-medium hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Get Started"
      subtitle="Create your admin account to manage the Ecclesia Hub store."
      steps={['Create your account', 'Verify your email', 'Start managing']}
      activeStep={0}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Fill in your details to get started.
        </p>
      </div>

      <form action={action} className="space-y-4">
        {state?.error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              First name
            </label>
            <input
              name="first_name"
              type="text"
              autoComplete="given-name"
              required
              placeholder="John"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6B1A2A] focus:border-transparent transition-shadow"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Last name
            </label>
            <input
              name="last_name"
              type="text"
              autoComplete="family-name"
              required
              placeholder="Doe"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6B1A2A] focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6B1A2A] focus:border-transparent transition-shadow"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            showRules
          />
        </div>

        <div className="pt-1">
          <SubmitButton />
        </div>
      </form>

      <p className="text-center text-sm text-gray-400 dark:text-gray-600 mt-6">
        Already have an account?{' '}
        <Link
          href="/admin/login"
          className="text-[#6B1A2A] dark:text-[#D4849A] font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
