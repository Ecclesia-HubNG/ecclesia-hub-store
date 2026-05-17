'use client'

import { useTransition } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
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

function GoogleButton() {
  const [loading, startTransition] = useTransition()

  function handleGoogle() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin/products`,
        },
      })
    })
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/>
        </svg>
      )}
      {loading ? 'Redirecting…' : 'Continue with Google'}
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

      <GoogleButton />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
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
