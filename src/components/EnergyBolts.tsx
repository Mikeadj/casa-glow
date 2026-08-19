import PixelEmoji from './PixelEmoji'

export default function EnergyBolts({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      {Array.from({ length: count }, (_, i) => (
        <PixelEmoji key={i} emoji="⚡" size={12} resolution={5} />
      ))}
    </span>
  )
}
