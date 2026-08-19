export default function ProgressBar({
  fraction,
  color,
  className = '',
}: {
  fraction: number
  color?: string
  className?: string
}) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100)
  return (
    <div className={`h-1.5 rounded-full bg-ink-800 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${pct}%`, backgroundColor: color ?? 'var(--color-calm-500)' }}
      />
    </div>
  )
}
