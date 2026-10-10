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

- **Identity comes from user-editable data (high priority).** `auth_discord_id()`, which every
  RLS policy and helper uses, reads the Discord ID from `user_metadata` in the JWT. So do
  `src/proxy.ts` and the server pages (`user.user_metadata.provider_id`). Supabase documents that
  `user_metadata` can be changed by the signed-in user through `auth.updateUser()`, and warns
  against using it for authorization. The role is safe (it comes from the allowlist table), but
  *which Discord ID you are* is read from a field the user controls. Not tested here.
  Fix: read the ID from `auth.identities` (server-controlled), in SQL
  (`where user_id = auth.uid() and provider = 'discord'`) and in the app
  (`user.identities`). For all 6 current Discord users the two values already match, so
  the switch locks nobody out. The same rewrite clears the advisor's mutable `search_path` warning.

- **Lost updates (races).** The GM panel saves a player's whole `equipment` list (to douse a
  torch) and whole `conditions` list, built from the GM's last-seen copy. HP, luck and XP are
  saved as absolute values the same way. If a player changes the same thing in the same moment,
  one change silently disappears. Saves only send the changed column, so different fields never
  clash; the window is the realtime delay, so this is rare. Fix: small RPCs that change one thing
  inside the row (`adjust_hp(delta)`, `toggle_condition`, `douse_light`), or a version column and
  `update ... where version = seen`.
- **Clocks.** Torch time is derived from `litAt` plus the table clock (pause and shift). No cron,
  and it survives closed tabs. Good design. But each device uses its own `Date.now()`, so a phone
  whose clock is 2 minutes off shows a different torch than the GM. Fix: read the server time
  once on load (the response `Date` header is enough) and apply the offset in `tableNow()`.
- **Idempotency.** Rolls are an append-only log, so a double click really is two rolls. Correct.
  The Discord relay doesn't retry a `429` or `5xx`, so a busy table can lose Discord messages
  (Discord allows about 30 a minute per webhook). Low impact: the in-app log is the source of truth.
- **Realtime reconnects.** To check: after a dropped connection, the sheet and GM panel may not
  refetch, and could show stale data until reload.
- **Growth.** `session_events` grows forever. Fine for years at this size.
- **Files.** The avatars bucket allows any file type server-side; only the browser checks for
  images. Set `allowed_mime_types` to image types.
- **Removing a player.** Blocked by the `no action` foreign keys while they own rows. Decide what
  "revoke access" should do.
- **Migrations by hand.** Drift already happened (013, now fixed). Apply through the Supabase CLI or
  `apply_migration`, so the history is recorded.
- **Supabase advisors.** 9 `SECURITY DEFINER` functions can be called by signed-in users (5 of them also
  anonymously), and `auth_discord_id()` has a mutable `search_path`.
- Not relevant here: payments, email deliverability, search, offline, multi-tenancy, GDPR.

## What to do next

The skill's build order (vertical slice, then must-haves, should-haves, could-haves) is already
done: every row in `replica/features.csv` exists in the app. So this is a priority list instead.

1. ~~Apply migration 013~~ Done 2026-10-10.
1. **Read the Discord ID from `auth.identities`**, not `user_metadata`, in `auth_discord_id()`,
   `src/proxy.ts` and the server pages. One migration and a small code change; see above.
2. **Close the lost-update race** with three small RPCs (`adjust_hp`, `toggle_condition`, `douse_light`).
3. **Database hygiene, one migration:** image-only avatars, fixed `search_path` on
   `auth_discord_id`, revoke anonymous execute on the helpers, the two missing FK indexes, and
   level / stat checks on `characters`.
4. **Retire `schema_snapshot.sql`** (or regenerate it from 001 to 018) and start recording migrations.
5. **Server time offset** for the torch clock.
6. **Type scale** and the sub-10px text (`replica/design/components.md`).
