---
title: Concerns
description: Things noticed during code changes that look wrong or risky and need a closer look
---

# Concerns

Things noticed during code changes that look wrong or risky and need a closer look. Remove an entry once it has been resolved or ruled out.

## C-uu5uon: Blob writes overwrite the whole document with no concurrency check (2026-10-11)

`src/lib/store.ts:153`, `src/lib/access-store.ts:116`, `src/lib/stations-store.ts:152`, `src/lib/private-messages-store.ts:165`, `src/lib/planet-system-status-store.ts:75`, `src/lib/almanac-store.ts:53`

Every store reads the full JSON, modifies it in memory and writes it back with `allowOverwrite: true`. Two concurrent requests (e.g. two members claiming missions at the same time) can lose one of the updates. Check whether the Blob SDK supports conditional writes (ETag / `ifMatch`) or whether a lock or retry is needed.

## C-kl5mdm: Migration on read writes during GET requests (2026-10-11)

`src/lib/store.ts:114`

`readMissions()` writes back to storage whenever legacy values are found. Plain reads therefore cause writes, and concurrent GETs can race with each other or with a real update (see C-uu5uon).

## C-b1h4i5: Missing missions blob falls back to demo seed data (2026-10-11)

`src/lib/store.ts:122`

If the Blob `get` returns nothing (or a 304), `readMissions()` returns `initialMissions` from `seed.ts`. In production, a missing or misconfigured blob would show demo missions instead of an error. The next write would then persist the seed data. Check that this is intended.

## C-qto0bo: Docs disagree on accepted mission address formats (2026-10-11)

`.github/copilot-instructions.md:5` vs `README.md` ("Indirizzi dei sistemi")

The Copilot instructions allow either an 8-glyph system code or a 12-glyph portal address. The README only mentions the 12-glyph portal address plus a galaxy index. Check what `isMissionInput` in `src/lib/missions.ts` actually accepts and align the docs.

## C-1yjcy9: Missions for "Explorers and Builders" are read back as "all" (2026-10-12)

`src/lib/store.ts:112`

`migrateMissions()` only keeps `builder`, `ranger`, `explorer`, `other` and `all` as `targetSpecialty` and turns every other value into `all`. `explorer_builder` is a valid specialty (`missionSpecialties` in `src/lib/missions.ts`, and `isMissionInput` accepts it), so a mission created for Explorers and Builders is saved correctly but read back as `all`, which changes who can see and take it. Check whether this is intended; if not, add `explorer_builder` to the accepted values.

## C-qb2awt: Local file stores write directly, so concurrent requests can corrupt the file (2026-10-12)

`src/lib/store.ts:175`, `src/lib/stations-store.ts:188`, `src/lib/private-messages-store.ts:189`, `src/lib/planet-system-status-store.ts:83`

With the local backend (`data/`) these stores call `writeFile(localPath, ...)` directly. Two overlapping writes can leave a file with leftover text after the closing brace, and every later read then fails with `SyntaxError: Unexpected non-whitespace character after JSON`. This already happened to `almanac.json` when many planet thumbnails were requested at once; `almanac-store.ts` now writes a temporary file and renames it, and runs its read-modify-write cycles one at a time, and `access-store.ts` already writes through a temporary file. Apply the same to the other four (a shared helper in `src/lib/` would avoid repeating it). It is a local-development problem; production uses Blob (see C-uu5uon).
