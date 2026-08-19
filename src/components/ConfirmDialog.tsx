export default function ConfirmDialog({
  message,
  confirmLabel = 'Yes, do it',
  onConfirm,
  onCancel,
}: {
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-ink-900 border border-ink-700 rounded-2xl p-5 max-w-sm w-full space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-ink-100">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-calm-600 hover:bg-calm-700 text-white text-sm font-medium py-2 transition-colors"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-ink-700 text-ink-300 text-sm py-2 hover:bg-ink-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
