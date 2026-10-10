# Build log: Torchlight

replica-build rebuilds a clone screen by screen. Torchlight is the original and every screen and
feature in `replica/recon.md` already exists, so this run built the open items from the test,
design and architecture audits instead, against the skill's definition of done. The `clone`
column in `features.csv` is for clones and was left alone.

| item | date | status | what it took | missing / harder than expected |
| --- | --- | --- | --- | --- |
| Roll announcements | 2026-10-10 | done | `LiveAnnouncer`, `rollSpeech`, wired into the sheet, the GM page and GM-action notices; 4 tests | Criticals and fumbles turned out to be colour-only on the card; now said in words. Not checked with a real screen reader. |
| Torch clock | 2026-10-10 | done | `serverClock`, `GET /api/time`, `useTableNow`; every light function takes the time explicitly; 5 tests | Bigger than it looked: found 3 real bugs where lighting and reading used different clocks (BUG-005). Torches lit outside a table and then carried into a shifted one still jump by the shift. |
| Database cleanup | 2026-10-10 | done, live | migration 020: image-only avatars, 2 indexes, 4 loose checks, helpers revoked from anon | Bounds were set from the app's own limits and checked against every row first. |
| Lost edits | 2026-10-10 | done; database live, app in PR #95 | migration 021 (version + trigger), `characterWrite` for the GM, `characterSaver` for the sheet, conflict notice, log only saved changes; 9 tests | The sheet side needed care: quick clicks, our own realtime echo and queued saves after a miss each could have caused false conflicts. Remaining window: a click in the same frame a realtime update lands. |

## Checks, every item

- [x] `tsc --noEmit` clean; lint adds no errors over `main`'s baseline
- [x] `next build` passes; full Playwright suite: 40 passed
- [x] Production checked after each migration: a player, the GM and anon (test plan DB-9 to DB-11)
- [ ] Logged-in click-through at 390px and 1440px, keyboard only. Not possible here (no login);
      the PR asks for it.

## Production changes

- 2026-10-10 `020_hygiene`, `021_character_version` applied through `apply_migration`. The first
  attempt at 021 timed out on its `DROP TRIGGER IF EXISTS` line and wrote nothing; it went in with
  `CREATE OR REPLACE TRIGGER` instead, which the repo file now uses too.

Next: `/replica-test` again once a test login exists, for the logged-in flows.
