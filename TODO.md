# TODO

Things that are still missing. Remove an item once it is done.

## T-x4lihk: Complete the user guide

`src/app/guide/page.tsx` (the in-app guide) and `docs/manuale-utente.md` (the Italian user manual for the simple view).

- The "Pagina per pagina" section has only one-line descriptions for each page. Add examples and detail, like the Stazioni, Missioni and Pianeti sections have.
- Admin and moderator features are not covered: the Utenti page (approving, blocking and deleting accounts, changing roles), offline players, the Excel export of stations, alliance branding, and turning the simple view on or off.
- Keep the in-app guide and `docs/manuale-utente.md` consistent, in both Italian and English.

## T-v68hfw: Add a test suite

There are no automated tests. Today, `npm run lint` and `npm run build` are the only checks.

- Pick a test runner (e.g. Vitest) and add an `npm test` script.
- Unit tests for the pure logic in `src/lib/`: mission validation (`missions.ts`), friend code and profile validation (`member-types.ts`, `access-store.ts`), portal address and galaxy handling (`planet-addresses.ts`, `galaxies.ts`), stored-data migrations (`store.ts`), and translation fallback (`translations.ts`).
- API route tests covering the authorization rules: pending, blocked and approved members; user, moderator and admin roles; the simple-view downgrade; and the specialty-specific rules for creating missions. These need `getCurrentMember` mocked and should use the local `data/` backend in a temporary directory.
- Run lint, build and tests in CI.
