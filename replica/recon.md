# Recon map: Torchlight (web)

Scope: the whole app. Torchlight is your own codebase, so this map is built from
the source code, the Supabase migrations and the project docs, not from public pages.
For: the Torchlight team (pw-collab), as a baseline to plan, rebuild or extend from.
Date: 2026-10-10

## Sources

| # | source | path | notes |
| --- | --- | --- | --- |
| 1 | app routes | `src/app/` | every screen below maps to one route |
| 2 | database | `supabase/migrations/001` to `018` | data model, RLS, RPCs |
| 3 | project spec | `shadowdark-vtt-spec.md` | original intent: Shadowdark companion, Discord-first |
| 4 | feature plan | `docs/plano-features-gameplay.md` | gameplay QoL and GM mode roadmap |
| 5 | deploy notes | `DEPLOY.md` | Supabase + Vercel + Discord setup |
| 6 | rules data | `src/data/` | 17 classes, 10 ancestries, spells, items, talents |

## Core loop

A player opens their Shadowdark character sheet at the table, rolls dice on it,
and the GM sees every roll, HP change and torch tick live in one session view.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Landing | `/` | logged-out entry, redirects to S03 when logged in | Discord login button | logged out |
| S02 | Login | `/login` (+ `/auth/callback`) | Discord OAuth, allowlist check | login button, error text | default, `no_discord_id`, not allowlisted |
| S03 | Campaign roster | `/home` | see the whole cast, own characters first, jump to sheet or GM view | RosterCard, GM link | empty, filled, GM vs player |
| S04 | Character creator | `/character-creator` | 10-step wizard to build a level 1 character | Step tabs, CardPicker, StepStats ... StepReview | per-step incomplete/complete, blocked tabs |
| S05 | Character sheet | `/sheet/[id]` | play the character; 4 tabs below | TabBar/TabRail, FloatingVitals, FloatingTorch, DiceOverlay, RollToasts, TurnBanner | own vs others' sheet, in session vs solo, mobile |
| S05a | Sheet: Atributos | S05 tab `stats` | stats, attacks, combat bonuses, class, talents, conditions | StatBlock, AttacksMenu, CombatBonuses, ClassPanel, TalentsPanel, ConditionChips | filled |
| S05b | Sheet: Inventario | S05 tab `inventory` | slot inventory, light sources, currency | InventoryView, Equipment, CurrencyPanel, TorchStatus | empty, over-slots |
| S05c | Sheet: Grimorio | S05 tab `spells` | known spells, casting | Spells | non-caster, caster |
| S05d | Sheet: Historia | S05 tab `backstory` | backstory, notes, handouts received | BackstoryView, HandoutShelf | empty, filled |
| S06 | Table mode | toggle inside S05 | big numbers to read across the table on a phone | TableMode, TableBadge | on/off |
| S07 | Roll history | panel inside S05 | past rolls with reroll | RollHistory, RollCard | empty, filled |
| S08 | Edit character | `/sheet/[id]/edit` | change an existing character via a wizard | CharacterEditWizard, CharacterEditModal, AvatarUpload | default |
| S09 | Progression | panel in S05 | levels 1 to 20, XP, level-up choices | ProgressionPanel, LevelTrack, LevelCard, XPBar | level-up ready, locked |
| S10 | Sheet not found | `/sheet/[id]` bad id | 404 | not-found | n/a |
| S11 | GM: Session tab | `/gm` tab `session` | run the live table: players, feed, clock, encounter | SessionPanel, PlayerCard, SessionFeed, DungeonClockBar, EncounterPanel, PromptComposer, HandoutDrawer, SessionRecap | no session, live, paused, ended |
| S12 | GM: Preparo (scenes) | `/gm` tab `scenes` | prep scenes with NPCs and notes, start them | ScenesPanel | empty, filled, played |
| S13 | GM: NPCs | `/gm` tab `npcs` | bestiary: create, tag, favorite, import | NPCCard, NPCListItem, NPCCreatorModal, BestiaryImportModal, BestiaryToolbar, NpcTagEditor | empty, filtered |

## Flows

```
F01 Player signs in
    S01 -> S02 (Discord) -> S03
    happy path clicks: 2 (+ Discord consent)
    edge: Discord ID not allowlisted, no provider id, wrong OAuth redirect URI (DEPLOY.md)

F02 Player creates a character
    S03 -> S04 stats -> class -> archetype -> origin -> hp -> talents -> equipment -> spells* -> narrative -> review -> S05
    happy path clicks: ~12 plus choices inside each step
    edge: non-caster skips spells; human gets 2 talent rolls; later tabs blocked until earlier ones are complete

F03 Player joins the table
    S05 -> enter table code -> in session (TableBadge shows)
    edge: bad code, already in another session, GM closed the session

F04 Player rolls in play
    S05a attack or stat -> roll mode (adv/dis) -> 3D dice -> toast -> GM feed + Discord webhook
    happy path clicks: 1 to 2
    edge: reroll (luck), solo roll not in session, Discord webhook missing

F05 Torch and light
    S05b light a torch -> real-time countdown -> GM dungeon clock can pause/shift
    edge: session paused, torch runs out

F06 GM runs a session
    S03 -> S11 create session (code) -> players join -> watch feed -> run encounter (initiative, HP, conditions) -> send prompt/handout -> recap -> Discord
    edge: close other sessions, pause, end

F07 GM preps
    S13 build or import NPCs -> S12 build scene with NPCs -> start scene -> S11

F08 Level up
    S05 XP reaches threshold -> S09 choose rewards -> sheet updates
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| shadcn/ui base set | ~55 primitives in `src/components/ui` | standard | all |
| Dice stage (three + cannon-es) | d4 to d20, adv/dis | rolling, result burst, sound | S05, S11 |
| RollCard / RollToasts / TableToasts | own roll, table roll | new, fading | S05, S11 |
| Card pickers (GlyphCard, CardOrigin, DetailChip) | class, ancestry, archetype, talent | selected, locked | S04, S08 |
| Floating vitals / torch | HP, torch timer | low HP, out of light | S05 |
| Tab bar / tab rail | mobile bar, desktop rail | active | S05 |
| PlayerCard / NPCCard | collapsed, expanded | defeated, conditions | S11, S13 |
| Modals | NPC creator, bestiary import, edit character, book viewer | open/closed | S05, S13 |
| OrnateTitle / SectionHeading | | | all themed pages |

## Inferred data model

Read straight from migrations, so confidence is high across the board.

```
AllowedDiscordId  discord_id (pk), role (player | gm), added_at
Session           id, gm_id, name, active, code, ended_at, paused_at, clock_shift_seconds
SessionMember     session_id, character_id, user_id, player_name, joined_at
SessionEvent      id, session_id, actor_name, character_id, kind (roll, session, ...), payload (json), visibility
Character         id, user_id, session_id, name, class_id, ancestry_id, archetype, level, str..cha,
                  hp_max, hp_current, ac, luck_tokens, equipment (json), spells (json), torch_end_at,
                  technique states, backstory fields, level progress, conditions, notes, avatar, player_name
Npc               id, gm_id, session_id, name, npc_type, stats, hp, ac, attacks, features, tags[], favorite
Encounter         id, session_id, name, round, active_actor_id, status, ended_at
EncounterActor    id, encounter_id, source (character | npc), ref_id, hp, ac, atk_bonus, damage_die,
                  initiative, conditions, defeated, sort_key
Handout           id, gm_id, title, content
Scene             id, gm_id, title, gm_note, npc_ids[], played_at, sort_key
Rules data        classes, ancestries, archetypes, spells, items, talents, conditions: static TS/JSON, not DB
```

Relationships: AllowedDiscordId 1-n Character; Session 1-n SessionMember n-1 Character;
Session 1-n SessionEvent; Session 1-n Encounter 1-n EncounterActor (-> Character or Npc);
GM 1-n Npc, Handout, Scene; Scene n-n Npc (by id array).

Key RPCs: `join_session`, `leave_session`, `campaign_roster`, `set_initiative`,
`close_other_sessions`, `generate_session_code`, `is_gm`, `is_session_gm`.

## Feature matrix

See `features.csv`. Must: 14, should: 12, could: 6, skip: 2.

## Out of scope (cannot or should not be cloned)

- Shadowdark rules text and art: the app embeds rules data (classes, spells, items) from a
  licensed game. A public rebuild needs the Shadowdark third-party license or original content.
- Discord itself: the app depends on a Discord server and webhook channel ("Rolagens SD").

## Size

Screens 13 (+4 sheet tabs), flows 8, entities 10 + static rules data.
Hard parts: realtime session sync (presence, feed, encounter), 3D physics dice,
rules engine (slots, light, rest, progression 1 to 20, talents, techniques).
Size: L (a quarter) to rebuild from scratch.

## Notes from the recon (worth a look)

- `DEPLOY.md` says migrations are applied by hand. Make sure prod has `014_npcs_rls_fix.sql`,
  which closes an NPC data leak between GMs.
- `docs/plano-features-gameplay.md` describes the session as "dead"; migrations 015 to 018
  look like they built it since. That doc may be stale.
- `README.md` is still the create-next-app default.
