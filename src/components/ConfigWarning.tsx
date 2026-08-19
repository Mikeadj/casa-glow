import PixelEmoji from './PixelEmoji'

export default function ConfigWarning() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-3">
          <PixelEmoji emoji="🔧" size={44} resolution={8} />
        </div>
        <h1 className="text-xl font-semibold text-ink-100">Firebase isn't configured yet</h1>
        <p className="text-ink-300 text-sm mt-3 leading-relaxed">
          Create a <code className="text-calm-300">.env</code> file in the project root with your
          Firebase project's config values (see <code className="text-calm-300">.env.example</code>
          {' '}and <code className="text-calm-300">README.md</code>), then restart the app.
        </p>
      </div>
    </div>
  )
}
