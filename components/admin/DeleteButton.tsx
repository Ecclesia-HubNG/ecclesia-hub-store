'use client'

export function DeleteButton({
  id,
  action,
  label = 'Delete',
  confirm: confirmMsg = 'Are you sure?',
}: {
  id: string
  action: (formData: FormData) => Promise<void>
  label?: string
  confirm?: string
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={e => { if (!window.confirm(confirmMsg)) e.preventDefault() }}
        className="text-sm text-red-400 hover:text-red-600 transition-colors"
      >
        {label}
      </button>
    </form>
  )
}
