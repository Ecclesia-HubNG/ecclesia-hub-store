'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updatePassword } from '@/lib/actions/settings'
import { PasswordInput } from './PasswordInput'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-[#4A0F1C] hover:bg-[#6B1A2A] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
    >
      {pending ? 'Updating…' : 'Update password'}
    </button>
  )
}

export function ChangePasswordForm() {
  const [state, action] = useFormState(updatePassword, null)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-xl px-4 py-3">
          Password updated successfully.
        </p>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New password</label>
        <PasswordInput name="password" autoComplete="new-password" placeholder="Min. 8 characters" showRules />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm password</label>
        <PasswordInput name="confirm" autoComplete="new-password" placeholder="Repeat password" />
      </div>

      <Submit />
    </form>
  )
}
