interface Props {
  emoji: string
  /** Displayed size in CSS px. */
  size?: number
  /** No longer used — kept so existing call sites don't need to change. */
  resolution?: number
  className?: string
}

/** Renders an emoji glyph at full native resolution, sized to fit inline
 * alongside surrounding text/icons. */
export default function PixelEmoji({ emoji, size = 24, className }: Props) {
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}
    >
      {emoji}
    </span>
  )
}
