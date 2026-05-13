'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signIn } from '@/lib/actions/auth'
import { AuthLayout } from '@/components/admin/AuthLayout'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-[#4A0F1C] hover:bg-[#6B1A2A] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Signing in…' : 'Sign In'}
    </button>
  )
}

export default function AdminLoginPage() {
  const [state, action] = useFormState(signIn, null)

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to manage your store, products, and orders."
      steps={['Sign in to your account', 'Manage products & categories', 'Process orders']}
      activeStep={0}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Enter your credentials to access the admin portal.
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Link
              href="/admin/forgot-password"
              className="text-xs text-[#6B1A2A] dark:text-[#D4849A] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6B1A2A] focus:border-transparent transition-shadow"
          />
        </div>

        <div className="pt-1">
          <SubmitButton />
        </div>
      </form>

      <p className="text-center text-sm text-gray-400 dark:text-gray-600 mt-6">
        Don&apos;t have an account?{' '}
        <Link
          href="/admin/register"
          className="text-[#6B1A2A] dark:text-[#D4849A] font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
