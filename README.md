# TidyUp — House Cleaning App

A Windows desktop app for assigning daily cleaning tasks, tracking energy-point
task difficulty, checking in on energy/available time, and visualizing your
house as an interactive top-down floor plan that glows calm when clean and red
when dirty. Built with Electron + React + TypeScript, synced live across
devices via Firebase.

## One-time setup: Firebase project

This app needs a free Firebase project for accounts and live sync.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project (Google Analytics is not needed — you can skip it).
2. In the project, click **Build → Authentication → Get started**, then enable the **Email/Password** sign-in provider.
3. Click **Build → Firestore Database → Create database**. Choose a location near you and start in **locked mode** (sometimes labeled "production mode") — we paste in our own rules next, so the wide-open "test mode" isn't needed.
4. Once created, go to the Firestore **Rules** tab and replace the contents with the rules in [`firestore.rules`](firestore.rules) in this repo, then **Publish**.
5. Go to **Project settings** (gear icon) → scroll to **Your apps** → click the **Web** icon (`</>`) to register a new web app (nickname doesn't matter, no hosting needed).
6. Copy the `firebaseConfig` values shown and paste them into a new `.env` file in this project's root (copy `.env.example` to `.env` first):

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

7. Restart the dev server if it was already running.

Each household member repeats step 6 (same `.env` values, since everyone shares the same Firebase project) on their own machine, then creates their own account in-app and either creates a household or joins one with an invite code.

## Development

```bash
npm install
npm run dev
```

This launches Vite and the Electron window together with hot reload.

## Building the Windows installer

```bash
npm run package:win
```

Produces an installer under `release/`.
