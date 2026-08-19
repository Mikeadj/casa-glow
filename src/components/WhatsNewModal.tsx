import type { ReleaseNotes } from '../lib/whatsNew'
import PixelEmoji from './PixelEmoji'

export default function WhatsNewModal({
  notes,
  onDismiss,
}: {
  notes: ReleaseNotes
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-ink-900 border border-brass-600/40 rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center gap-2.5">
          <PixelEmoji emoji="🎉" size={26} resolution={7} />
          <h2 className="text-lg font-semibold text-ink-100">{notes.title}</h2>
        </div>
        <ul className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {notes.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-300">
              <span className="text-brass-400 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onDismiss}
          className="w-full rounded-lg bg-brass-600 hover:bg-brass-700 text-white text-sm font-medium py-2.5 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
