// Bump this whenever there's a release worth surfacing — the "what's new"
// popup shows once per bump, the first time the app opens after updating.
export const CURRENT_RELEASE = 'beta-5.3'

export interface ReleaseNotes {
  version: string
  title: string
  items: string[]
}

export const LATEST_RELEASE_NOTES: ReleaseNotes = {
  version: CURRENT_RELEASE,
  title: "What's new in Beta-5.3",
  items: [
    'Swapped the broom for a sparkling star as the app logo.',
    'Real app icon: a rounded square with a thick white border and a "CG" monogram, replacing the default Electron icon in the taskbar and installer.',
  ],
}

/** Kept for reference, no longer shown once beta-5.3 has been seen. */
export const PREVIOUS_RELEASE_NOTES: ReleaseNotes = {
  version: 'beta-5.2',
  title: "What's new in Beta-5.2",
  items: [
    'Fixed a bug where completing an on-demand task ("do whenever") deleted it permanently. It now just marks it done and drops it from suggestions — a new "Needed again" button brings it back whenever you actually need to redo it.',
    'Renamed the confusing "One-time" label on the add-task form to "On-demand", matching what it actually does.',
  ],
}
