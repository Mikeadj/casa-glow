// Bump this whenever there's a release worth surfacing — the "what's new"
// popup shows once per bump, the first time the app opens after updating.
export const CURRENT_RELEASE = 'beta-5.4'

export interface ReleaseNotes {
  version: string
  title: string
  items: string[]
}

export const LATEST_RELEASE_NOTES: ReleaseNotes = {
  version: CURRENT_RELEASE,
  title: "What's new in Beta-5.4",
  items: [
    "Auto-updates: from here on, Casa Glow checks for new versions on launch and installs them quietly in the background — just close and reopen the app to pick up the latest release, no more manual downloads.",
  ],
}

/** Kept for reference, no longer shown once beta-5.4 has been seen. */
export const PREVIOUS_RELEASE_NOTES: ReleaseNotes = {
  version: 'beta-5.3',
  title: "What's new in Beta-5.3",
  items: [
    'Swapped the broom for a sparkling star as the app logo.',
    'Real app icon: a rounded square with a thick white border and a "CG" monogram, replacing the default Electron icon in the taskbar and installer.',
  ],
}
