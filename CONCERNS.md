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
