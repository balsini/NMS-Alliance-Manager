# AGENTS.md

Guidance for AI coding agents working in this repository.

## Commands

```bash
npm install
npm run dev     # Next.js dev server (Turbopack) on http://localhost:3000
npm run lint    # ESLint
npm run build   # Production build (also runs the TypeScript type check)
```

There is no test suite. Verify changes with `npm run lint` and `npm run build`.

Local auth needs `.env.local` (see `.env.example`). The quick option is `LOCAL_AUTH=true`: the login screen then offers fixed development accounts (`src/lib/local-auth.ts`: admin, moderator, and one normal user per specialty), each pre-approved with a complete profile, no Google variables are needed, and storage is forced to `data/`. `isLocalAuthEnabled()` ignores the flag when `NODE_ENV=production` or `VERCEL` is set, so it never affects a build or deploy. For real Google login, set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL=http://localhost:3000/api/auth`, `ALLIANCE_ADMIN_EMAIL`. If any of these is missing (and local mode is off), pages render the login screen listing what's missing; the list comes from `getMissingAuthConfiguration()`. The configured admin email is auto-approved.

## Architecture

Next.js 16 App Router + React 19 + TypeScript, Auth.js v5 (Google OAuth), Tailwind v4 plus hand-written CSS in `src/styles/`. The app coordinates a No Man's Sky alliance: missions, discovered stations, planets, members, messages, help requests, leaderboard.

### Persistence: JSON files, local or Vercel Blob

There is no database. Each domain has a `*-store.ts` module in `src/lib/` (`store.ts` for missions, `access-store.ts` for members and alliance settings, `stations-store.ts`, `almanac-store.ts`, `private-messages-store.ts`, `planet-system-status-store.ts`). Each one reads and writes a whole JSON document:
- `getBlobAuthOptions()` (`src/lib/blob-config.ts`) decides the backend. It returns Blob options when `NMS_STORE_ID`/`BLOB_STORE_ID` (OIDC on Vercel) or `NMS_READ_WRITE_TOKEN`/`BLOB_READ_WRITE_TOKEN` is set, and otherwise returns `null`, which means the local filesystem under `data/` (gitignored). On Vercel without a store it throws, so production never writes to the Function's filesystem.
- Blob files live under `alliance-manager/*.json`, are `access: "private"`, and are written with `allowOverwrite: true` (read-modify-write, with no locking).
- Read functions run **migrations on read**. For example, `store.ts` turns legacy email/name fields into member `publicId` references and normalizes status/priority, then writes the result back when it changes anything. When you change a stored shape, add the migration here; don't assume existing data matches the new types.
- Derived fields (owner/assignee names, etc.) are stripped before writing. `serializeMission` (`src/lib/mission-view.ts`) resolves them again from members when responding.

### Auth and authorization

- `src/auth.ts` configures Auth.js (Google, plus a `local` credentials provider when `LOCAL_AUTH` is active). Server code calls `getCurrentMember()` (`src/lib/authorization.ts`), which also **registers the member on first login** (`registerMember`). It returns `null` for offline, blocked or pending members unless the caller passes `allowPending`/`allowBlocked`.
- Roles are `user < moderator < admin`, checked with `hasRole(member, "moderator")`. Membership status is `pending | approved | blocked`; operational endpoints require `approved`.
- **Simple view:** when an admin or moderator enables `simpleView`, `getCurrentMember` downgrades `role` to `"user"` (the real role is kept in `displayRole`), so the server enforces user-level permissions too.
- Every API route handler (`src/app/api/**/route.ts`) does its own session and role checks (`runtime = "nodejs"`, `dynamic = "force-dynamic"`). Mission creation has specialty-specific rules (Ranger/Explorer/Builder) in `src/app/api/missions/route.ts`.
- "Offline members" are profiles that moderators create for players without a Google login (`offline-members.ts`, `createOfflineMember`).

### Pages

Each `src/app/<section>/page.tsx` is a thin server component. It loads access data, handles missing config, the login screen and pending approval, then renders a client component from `src/components/pages/` (e.g. `MissionDashboard`). Client components fetch from `/api/*`. `/` redirects to `/stations`. UI is built from cards in `src/components/cards/`, which have `simple` and `extended` variants. `src/app/guide/` is a user guide that renders live example components.

### NMS domain

- Missions model and validation: `src/lib/missions.ts`. Member types and friend-code validation: `src/lib/member-types.ts`. Demo seed: `src/lib/seed.ts`.
- System addresses are 12 hex glyphs plus a galaxy index (0–255) (`galaxies.ts`, `planet-addresses.ts`, `components/shared/portal-address-field.tsx`). Glyph images are in `public/glyphs/`.
- Addresses are verified against the external NMS Almanac API (`almanac-lookup.ts`, limited to 500 requests/hour). Responses are cached permanently by portal code and galaxy through `almanac-store.ts`. A 404 or an unavailable API must not block saving. `systemVerified` is reset when the address or galaxy changes.
- `src/lib/nms-core/` is vendored MIT JS (pinned upstream commit), loaded client-side to compute planet count and star type. Don't edit it casually.
- Everything about files and development is written in English: code comments, test names, scripts, config and workflow files, commit messages and developer docs. Only user-facing text (UI strings and `docs/manuale-utente.md`) is Italian.

### i18n

- Italian is the primary language and English is also supported. The locale is chosen client-side (browser language, then a selector stored in the browser), and URLs never change.
- `src/lib/translations.ts` merges the catalogs in `src/lib/translations/` (`en.ts`, `it.ts`, which is grouped by namespace). **Canonical keys are English strings.** A missing translation falls back to the key. Italian strings that are still used as keys in older components are mapped back automatically, and `aliases` in `it.ts` holds only extra legacy variants. Some keys are dotted ids (e.g. `missions.only_create_and_assign_your_specialty`).
- Client components use `useLocale()` (`components/providers/locale-provider.tsx`). Server code uses `translate()`. API error messages are often Italian strings or translation keys that the client translates.
- `docs/manuale-utente.md` is the Italian user manual for the simple view. Update it when user-facing behaviour changes.

## Concerns and TODO tracking

- `CONCERNS.md`: when you change code and notice something outside the task that looks wrong (a likely bug, a race, inconsistent docs, dead code, a security smell), don't fix it silently. Add an entry so it can be reviewed later. Each entry gets a short title, the file and line, what looks wrong and why, and the date. Before adding an entry, check that the concern isn't already listed.
- `TODO.md`: features and work that are still missing. Add an item when you find a gap.
- **IDs:** each entry heading starts with a unique ID made of a type prefix (`C-` for concerns, `T-` for TODOs) and 6 random lowercase alphanumeric characters, e.g. `## C-uu5uon: Title`. Generate the characters with `LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 6` instead of making them up, because invented "random" strings repeat. Before using an ID, check that it doesn't appear in either file or in history (`git log --all --grep <id>`). IDs are never reused, even after an entry is removed. Refer to other entries by ID.
- **Commits:** a commit that addresses an entry references its ID in a trailer at the end of the message: `Fixes: C-uu5uon` when it resolves the entry, `Refs: T-v68hfw` for partial progress. Use one trailer per ID. In the same commit, remove a resolved entry from its file, or update it to show what remains.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
