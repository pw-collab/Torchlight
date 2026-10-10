# Test plan: Torchlight

Build: f2de196 + fixes on this branch  Date: 2026-10-10  Env: local production build, no Supabase keys

Run the automated cases with `npm run test:e2e` (Playwright, specs in `e2e/`).

**Limit of this run:** this environment has no Supabase project or Discord login, so
nothing behind login could be driven. Those cases are written below and marked
`blocked` until a local Supabase with seed data (or test credentials) exists.

## Results

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | sign in | happy | open `/` | title and "Login com Discord" link | e2e | pass |
| F01-H2 | sign in | happy | open `/login` | 200 | e2e | pass |
| F01-H3 | sign in | happy | load `/skull-icon.png` logged out | image, 200 | e2e | pass (guards the BUG-001 fix) |
| F01-N1 | sign in | negative: logged out | open `/home`, `/gm`, `/character-creator`, `/sheet/x`, `/sheet/x/edit` | redirect to `/login` | e2e | pass after fix (was fail on `/character-creator`, BUG-001) |
| F01-N2 | sign in | negative: logged out | POST `/api/discord` | refused (401 or redirect) | e2e | pass |
| F01-A1 | sign in | a11y | axe scan on `/` | no critical or serious issues | e2e | pass |
| F01-N3 | sign in | negative: Discord user not on allowlist | log in with an unlisted account, read any table | zero rows, `is_gm()` false | db | pass (DB-layer, see below) |
| F01-N4 | sign in | negative: player opens `/gm` | app-level gate in `src/proxy.ts` | redirect to `/home` | manual | still needs a real player login; DB layer confirms a player gets no GM powers |
| F04-H1 | rolling | happy | `d20`, `1d6+2`, `2d6 + 1`, `3d6-1`, `D20` | a number | e2e | pass |
| F04-E1 | rolling | edge: every catalogue weapon | roll damage for each weapon in `src/data/inventory/items.ts` | a number | e2e | pass after fix (was NaN, BUG-002) |
| F04-E2 | rolling | edge: versatile weapon | roll `1d8/1d10` 50 times | 1 to 8 | e2e | pass after fix (BUG-002) |
| F04-E3 | rolling | edge: flat damage | Blowgun `1` | always 1 | e2e | pass after fix (was 1 to 20, BUG-003) |
| F04-N1 | rolling | negative: odd formulas | `2d6+1d4`, `1d8+STR`, `abc` | never NaN | e2e | pass after fix (BUG-002) |

## Written, not yet run (need login)

| case | flow | type | expected |
| --- | --- | --- | --- |
| F02-H1 | create character | happy: all 10 steps | character saved, lands on its sheet |
| F02-E1 | create character | edge: refresh mid-wizard, back button | no crash; clear whether progress is kept |
| F02-E2 | create character | edge: human ancestry | 2 talent rolls |
| F02-E3 | create character | edge: non-caster | spells step skipped |
| F02-E4 | create character | edge: very long name, emoji, accents | saved and shown intact |
| F02-E5 | create character | edge: double click "finish" | exactly one character |
| F03-H1 | join table | happy: valid code | badge shows, GM sees player |
| F03-N1 | join table | negative: wrong code | clear error |
| F03-E1 | join table | edge: GM ends session | player leaves table state |
| F04-H2 | rolling | happy: attack with adv/dis from sheet | 3D dice, toast, GM feed, Discord message |
| F04-E4 | rolling | edge: two tabs at once | both see same history |
| F05-H1 | torch | happy: light torch | counts down 60 min |
| F05-E1 | torch | edge: GM pauses clock | torch stops; resumes with same minutes |
| F05-E2 | torch | edge: close tab 10 min | torch shows 10 min less |
| F06-H1 | GM session | happy: start, encounter, recap | recap posted to Discord |
| F06-N1 | GM session | negative: second GM's data | NPCs, scenes, handouts of other GM invisible (needs migration 014) |
| F07-H1 | GM prep | happy: create NPC, scene, start | scene opens in session tab |
| F08-H1 | level up | happy: XP to threshold | rewards selectable, level increases |
| ALL-E1 | every screen | edge: 375px mobile width, keyboard only | usable, no horizontal scroll |

## Database security layer (verified 2026-10-10 against the live project)

Checked by evaluating row-level security the way Postgres does: as the `authenticated`
role with the request JWT claims set to a given identity. No app server involved.

| check | setup | expected | result |
| --- | --- | --- | --- |
| DB-1 | signed-in user NOT on the allowlist reads `characters`, `npcs`, `sessions` | 0 rows each | pass: 0, 0, 0 |
| DB-2 | same user puts `"role":"gm"` in their own user_metadata, calls `is_gm()` | false (role comes from the allowlist table, not metadata) | pass: false |
| DB-3 | user who IS on the allowlist as `gm` calls `is_gm()` and reads `characters` | true, sees all | pass: true, 5 characters |

So even if the app-level login gate (BUG-001) ever regresses again, the database still
refuses an unlisted account and a self-declared role. BUG-001 is defence in depth, not the
only lock. The NPC fix (migration 014) is confirmed applied: `npcs` has policy
`npcs_manage_own_gm`, so one GM cannot read another GM's monsters.

Open advisories worth a look (from Supabase's own linter, none a user can exploit today):
- 9 `SECURITY DEFINER` RPCs are callable by signed-in users, 5 of them also anonymously. They
  are gated inside, but worth confirming each checks the caller.
- `auth_discord_id()` has a mutable `search_path`.
- Leaked-password protection is off (minor; the app uses Discord OAuth, not passwords).

## Other checks run

- `npx tsc --noEmit`: pass.
- `npm run build`: pass.
- `npx eslint`: 17 errors, 9 warnings, all in code this run did not touch (13 `no-explicit-any`, 2 unescaped entities, 2 React hook rules). Not bugs a user sees; listed in `bugs.md` under "to check".
