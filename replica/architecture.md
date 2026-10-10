# Architecture: Torchlight

Torchlight already exists, so this is the replica-architect checklist run as an **audit** of
the architecture as built, not a plan for a rebuild. Schema facts come from the live Supabase
project (`duidhsevhpcppmszdlaj`), read-only, on 2026-10-10. Code facts are from `41c2b04`+.

## Stack

| layer | choice | notes |
| --- | --- | --- |
| web | Next.js 16.2 (App Router) + React 19 + TypeScript | Newer than most docs: auth runs in `src/proxy.ts`, not `middleware.ts` (see `AGENTS.md`). |
| styling | Tailwind 4 + shadcn/ui on Base UI ("lyra") | Tokens in `src/app/globals.css`, see `replica/design/`. |
| dice | three.js 0.130 + cannon-es physics, framer-motion | Honours reduced motion. |
| database | Supabase Postgres 17, sa-east-1, free plan | One database, no services around it. |
| auth | Supabase Auth, Discord OAuth only | Role comes from the `allowed_discord_ids` table, never from the token. |
| realtime | Supabase Realtime (postgres_changes on 7 tables) + a presence channel | |
| files | Supabase Storage bucket `avatars` | Public read, owner write, 5 MB. |
| integrations | Discord webhook (outbound only) via `POST /api/discord` | |
| jobs | none | Nothing needs one: torch time is computed from timestamps, not ticked by a cron. |
| payments, email | none | Private group, not needed. |
| hosting | Vercel | Preview per branch. |
| tests | Playwright in `e2e/` | Added in PR #95. |

**Verdict:** this is almost exactly the stack the skill recommends by default. No changes
recommended.

## Schema

Tables: **10**. Access rules: **row level security on every table**, through `SECURITY DEFINER`
helpers (`is_gm`, `is_session_member`, `is_session_gm`, `auth_discord_id`). Verified in
`replica/test-plan.md` (DB-1 to DB-3). Source: `supabase/migrations/001` to `018`.

| table | owner | relations (on delete) | rows | realtime |
| --- | --- | --- | --- | --- |
| allowed_discord_ids | (the allowlist itself) | parent of 5 tables, all `no action` | few | no |
| characters | `user_id` | `session_id` → sessions (set null). 45 columns, 10 of them jsonb | 5 | yes |
| sessions | `gm_id` | | 1 | yes |
| session_members | `user_id` | session (cascade), character (cascade) | few | yes |
| session_events | via session | session (cascade), character (set null). Append-only log | ~380 | yes |
| encounters | via session | session (cascade) | 2 | yes |
| encounter_actors | via encounter | encounter (cascade). `ref_id` points at a character or NPC, no FK | few | yes |
| npcs | `gm_id` (**no FK**) | `session_id` → sessions (set null) | 1 | no |
| handouts | `gm_id` | | few | no |
| scenes | `gm_id` | `npc_ids uuid[]` (no FK, arrays can't have one) | few | yes |

### The skill's checklist

| check | result |
| --- | --- |
| uuid primary keys | Yes. The allowlist keys on the Discord ID, which is right for it. |
| `created_at` | Yes, every table. |
| `updated_at` | **None.** That matters for the race below. |
| owner column on user data | Yes. |
| `on delete` decided | Yes for sessions and encounters (cascade / set null). Allowlist references are `no action`: you can't remove a player from the allowlist while they own characters. |
| index on every FK | 11 of 13. Missing: `npcs.session_id`, `session_events.character_id`. Harmless at this size. |
| check constraints on status fields | Yes: event kind and visibility, encounter status, actor source, role. None on `characters` (level 1 to 20, stats 3 to 18). |
| `timestamptz` | Yes, all 15 time columns. |
| money as integers | gold / silver / copper are integer columns. Fine for a game. |

Loose references the app has to tolerate: deleting an NPC leaves its id inside `scenes.npc_ids`
and `encounter_actors.ref_id`. Deleting a character leaves `encounter_actors.ref_id` pointing nowhere.

### Drift between the repo and production

Migrations are applied by hand (`DEPLOY.md`), and Supabase's own history lists only `001`.
Every object in `002` to `018` was compared against the live database:

- **`013_campaign_roster.sql` had never been applied.** `/home` fell back quietly, so nothing
  errored, but players saw only their own characters instead of the whole party.
  **Applied on 2026-10-10** through `apply_migration`, so it is now in Supabase's history.
  Verified as the `authenticated` role: an allowlisted player gets all 5 characters (one flagged
  as theirs) while still reading only their own full row; an unlisted user gets 0; `anon` can't
  call it.
- Everything else is present. (007's original NPC policy is missing on purpose: 014 replaced it.)
- `supabase/schema_snapshot.sql` stops at migration 004. Bootstrapping a new project from it
  would produce a broken app.

## API

### Pages and route handlers

| route | does | who | flow |
| --- | --- | --- | --- |
| `GET /` | landing; logged in → `/home` | anyone | F01 |
| `GET /login` | Discord sign-in | anyone | F01 |
| `GET /auth/callback` | swaps the OAuth code for a session | anyone | F01 |
| `GET /home` | party roster (`campaign_roster`, with fallback) | allowlisted | F01 |
| `GET /character-creator` | 10-step wizard, inserts a character | allowlisted | F02 |
| `GET /sheet/[id]` | the sheet; most play happens here | owner, GM | F03 to F05, F08 |
| `GET /sheet/[id]/edit` | edit wizard | owner, GM | F02 |
| `GET /gm` | session, prep and NPC tabs | GM role | F06, F07 |
| `POST /api/discord` | relays events and recaps to the Discord webhook, sanitised | signed-in, allowlisted | F04, F06 |

`src/proxy.ts` gates every route except `/`, `/login`, `/auth` and static files (fixed in PR #95).

### Database calls from the browser (supabase-js, guarded by RLS)

| target | operations | flows |
| --- | --- | --- |
| characters | select, insert, update, delete | F02, F04, F05, F06, F08 |
| sessions | select, insert, update | F06 |
| session_members | select, delete | F03, F06 |
| session_events | select, insert | F04, F06 |
| encounters, encounter_actors | select, insert, update, delete | F06 |
| npcs, scenes, handouts | full CRUD, own GM only | F07 |
| `rpc join_session`, `leave_session`, `character_session` | join by code, leave, find a character's table | F03 |
| `rpc set_initiative` | a player sets their own initiative | F06 |
| `rpc campaign_roster` | roster with owner names | F01 |
| storage `avatars` | upload, public URL | F02 |

### Realtime, webhooks, jobs

- Channels: `character:{id}`, `session:{id}`, `session-row`, `feed:{session}`, `encounter:{id}`, `presence:{session}`.
- Webhooks in: none of your own (Discord OAuth goes through Supabase). Out: the Discord webhook.
- Jobs: none.

## The parts that bite

- **Identity came from user-editable data. Fixed 2026-10-10 (BUG-004).** `auth_discord_id()`,
  `src/proxy.ts` and the server pages read the Discord ID from `user_metadata`, which Supabase
  documents as user-editable. Both now read the Discord identity row in `auth.identities`:
  migration 019 (applied and verified in production) and `src/lib/discordId.ts` (PR #95).
- **Lost updates (races). Fixed 2026-10-10 (BUG-006).** GM and player both wrote absolute
  values from their own copy, so the later save erased the earlier one. Migration 021 adds a
  `version` bumped on every save; GM actions recompute from the fresh row and retry
  (`src/lib/characterWrite.ts`), and the sheet's saves are rejected visibly instead of
  overwriting (`src/lib/characterSaver.ts`). Remaining window: a sheet click in the same frame a
  realtime update arrives (about 16 ms).
- **Clocks. Fixed 2026-10-10 (BUG-005).** Torches were lit on the bare device clock but read on
  the table clock, so pauses froze new torches, advanced turns pre-burned them, and putting one
  out gave minutes back. Every light function now takes the time explicitly, and all of them use
  the table clock on server time (`src/lib/serverClock.ts`, `GET /api/time`, `useTableNow`).
  Still open: joining a table whose clock is shifted moves a torch lit outside it by that shift.
- **Idempotency.** Rolls are an append-only log, so a double click really is two rolls. Correct.
  The Discord relay doesn't retry a `429` or `5xx`, so a busy table can lose Discord messages
  (Discord allows about 30 a minute per webhook). Low impact: the in-app log is the source of truth.
- **Realtime reconnects.** To check: after a dropped connection, the sheet and GM panel may not
  refetch, and could show stale data until reload.
- **Growth.** `session_events` grows forever. Fine for years at this size.
- **Files. Fixed (migration 020).** The avatars bucket now accepts images only.
- **Removing a player.** Blocked by the `no action` foreign keys while they own rows. Decide what
  "revoke access" should do.
- **Migrations by hand.** Drift already happened (013, now fixed). 013, 019, 020 and 021 went in
  through `apply_migration` and are in Supabase's history; keep doing that or use the CLI.
- **Supabase advisors.** After migration 020 no `SECURITY DEFINER` function is callable by
  `anon`. 11 remain callable by signed-in users, by design: the RLS helpers and the app's RPCs.
  The mutable `search_path` warning is fixed (019).

## What to do next

The skill's build order (vertical slice, then must-haves, should-haves, could-haves) is already
done: every row in `replica/features.csv` exists in the app. So this is a priority list instead.

Done on 2026-10-10: migration 013 applied; Discord ID read from `auth.identities` (019);
lost-update fix (021); database hygiene (020); torch clock on server and table time; rolls
announced to screen readers. See `replica/build-log.md`.

1. **Retire `schema_snapshot.sql`** (or regenerate it from 001 to 021).
2. **Realtime reconnects:** refetch the sheet and the GM panel when a channel reconnects.
3. **Type scale** and the sub-10px text (`replica/design/components.md`).
