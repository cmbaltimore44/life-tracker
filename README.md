# Life Tracker

A personal life tracker — tasks, routines, projects, and a book/quote library — a plain HTML/CSS/JS web app (no build step, no framework) that syncs your data across devices via [Supabase](https://supabase.com).

Live at <https://life-tracker-hq.vercel.app>.

## Features

- **Board**: three columns (To Do, In Progress, Done), drag and drop between them; categories with colors; due dates with overdue/soon-due highlighting; priority levels, notes, search, and filtering.
- **Routines**: a second tab for daily habits, grouped into Morning / Afternoon / Evening checklists, with streak tracking.
- Light/dark mode toggle, styled in a warm cream/charcoal palette with an orange accent.
- Sign in with a one-time email code (no password). Your data lives in Supabase and follows you between your computer and phone.

## One-time setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com/dashboard).
2. In the SQL Editor, run the schema in [`supabase/schema.sql`](supabase/schema.sql) — this creates the `categories`, `tasks`, `routines`, and `routine_completions` tables with Row Level Security so each signed-in user only ever sees their own rows.
3. In Settings → API, copy your **Project URL** and **anon public key**.
4. Paste them into `js/supabaseClient.js` (`SUPABASE_URL` / `SUPABASE_ANON_KEY`). The anon key is meant to be public — RLS is what actually protects the data, not the key.
5. Email auth (with OTP codes) is on by default — nothing else to configure.

## Running locally

No install step — it's static files.

```bash
npm run dev
```

Opens the app via `npx serve .`. On first sign-in on a new device, enter your email, then the 6-digit code Supabase emails you.

## Deploying (Vercel)

This is a static site — no serverless functions needed, since the browser talks to Supabase directly.

```bash
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

Visit the deployed URL from your phone's browser and sign in with the same email to see the same data. Consider using "Add to Home Screen" on your phone for an app-like icon (the `manifest.webmanifest` in this repo supports it).

## Project structure

| Path | Purpose |
|---|---|
| `index.html` | Sidebar shell, auth screen, board view, routines view, modals |
| `style.css` | Theme variables (light/dark), layout, and component styling |
| `js/app.js` | Entry point: auth gate, hash-based router, focus/visibility refresh |
| `js/supabaseClient.js` | Supabase client init — put your project URL/anon key here |
| `js/auth.js` | Email OTP sign-in/out |
| `js/theme.js` | Light/dark theme toggle |
| `js/migrate.js` | One-time import of old localStorage data into Supabase |
| `js/data/*.js` | CRUD calls to Supabase for tasks, categories, routines, completions |
| `js/views/board.js` | Board rendering, task/category modals, drag-and-drop |
| `js/views/routines.js` | Routines checklist rendering, streaks, drag-and-drop |
| `supabase/schema.sql` | Database schema + Row Level Security policies |
| `build/icon.icns`, `build/icon.png` | App icon, reused as the favicon / home-screen icon |

## Changing the app icon

`build/icon.icns` and `build/icon.png` are generated from `scripts/icon-source.html`, a plain HTML/CSS/SVG file. To tweak the design:

1. Edit `scripts/icon-source.html`.
2. Re-render it to a 1024×1024 PNG (this pulls Electron on-demand via `npx`, since it's no longer an installed dependency):
   ```bash
   npx electron scripts/generate-icon.js
   ```
3. Rebuild the `.icns` and PNG from that master image:
   ```bash
   cd build
   rm -rf icon.iconset
   mkdir icon.iconset
   sips -z 16 16 icon-source.png     --out icon.iconset/icon_16x16.png
   sips -z 32 32 icon-source.png     --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32 icon-source.png     --out icon.iconset/icon_32x32.png
   sips -z 64 64 icon-source.png     --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128 icon-source.png   --out icon.iconset/icon_128x128.png
   sips -z 256 256 icon-source.png   --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256 icon-source.png   --out icon.iconset/icon_256x256.png
   sips -z 512 512 icon-source.png   --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512 icon-source.png   --out icon.iconset/icon_512x512.png
   cp icon-source.png icon.iconset/icon_512x512@2x.png
   iconutil -c icns icon.iconset -o icon.icns
   sips -s format png icon.icns --out icon.png && sips -z 512 512 icon.png --out icon.png
   rm -rf icon.iconset icon-source.png
   cd ..
   ```
