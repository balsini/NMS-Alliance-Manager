---
title: TODO
description: Features and work that are still missing
---

# TODO

Things that are still missing. Remove an item once it is done.

## T-x4lihk: Complete the user guide

`src/app/guide/page.tsx` (the in-app guide) and `docs/manuale-utente.md` (the Italian user manual for the simple view).

- The "Pagina per pagina" section has only one-line descriptions for each page. Add examples and detail, like the Stazioni, Missioni and Pianeti sections have.
- Admin and moderator features are not covered: the Utenti page (approving, blocking and deleting accounts, changing roles), offline players, the Excel export of stations, alliance branding, and turning the simple view on or off.
- Keep the in-app guide and `docs/manuale-utente.md` consistent, in both Italian and English.

## T-v68hfw: Finish the test suite

Vitest is set up (`npm test`, `npm run test:coverage`) and covers the pure logic in `src/lib/` (about 20% of it). The `CI` workflow runs the tests and `npm run audit:prod` on pull requests. What is still missing:

- Unit tests for the modules that read or write storage: friend code and profile validation and conflicts (`access-store.ts`) and stored-data migrations (`store.ts`). The read paths are already exercised by `src/lib/test-data.test.ts`, which loads `fixtures/test-data/` through the real readers in a temporary folder (`NMS_DATA_DIR`); the writes, the conflicts and the migrations are still untested.
- Tests for `planet-addresses.ts` and `system-name.ts`, with `nms-core` mocked (the vendored code itself is not tested).
- API route tests covering the authorization rules: pending, blocked and approved members; user, moderator and admin roles; the simple-view downgrade; the local login rules (the fixed accounts of the test set cannot edit profiles, the development accounts can); and the specialty-specific rules for creating missions. These need `getCurrentMember` mocked and should use the local `data/` backend in a temporary directory.
- Run lint and build in CI too, not only the tests and the audit.

## T-e7flz1: Format the whole project with Prettier

Prettier is configured (`prettier.config.mjs`, `npm run format`), but only the newest files and `src/components/guide/` are formatted. About 100 other files still differ.

- Run `npm run format` once, in a separate commit that contains no other change.
- Add `npm run format:check` to the `CI` workflow, and then drop the "format only the files you edit" note from `AGENTS.md` and the README.
- Decide whether to also format the Markdown files and `src/styles/`, which are ignored now.
