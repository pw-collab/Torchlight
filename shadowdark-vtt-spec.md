# Shadowdark VTT — Project Spec for Claude Code

## What we’re building

A multiplayer web app that works as a Shadowdark RPG companion tool.
No game canvas or grid. Focused on: interactive character sheet, automated rules, dice roller, and real-time GM view — all integrated with Discord.

-----

## Tech stack

|Layer       |Choice                         |
|------------|-------------------------------|
|Frontend    |Next.js (App Router)           |
|UI          |Tailwind CSS + shadcn/ui       |
|Backend / DB|Supabase (Auth + Realtime + DB)|
|Deploy      |Vercel                         |
|Integrations|Discord OAuth + Webhooks       |

-----

## Auth — Discord OAuth via Supabase

- Login is Discord OAuth only. No email, no password.
- After OAuth, middleware checks `allowed_discord_ids` table in Supabase.
- If Discord ID is not in the table → deny access with a clear error message.
- Role (`player` or `gm`) is set per Discord ID in the table.
- GM manages allowlist via Supabase dashboard (no in-app UI needed).

```sql
-- allowed_discord_ids table
discord_id  TEXT PRIMARY KEY
role        TEXT CHECK (role IN ('player', 'gm'))
added_at    TIMESTAMPTZ DEFAULT now()
```

-----

## Database schema

```sql
-- sessions
id          UUID PRIMARY KEY
gm_id       TEXT REFERENCES allowed_discord_ids(discord_id)
name        TEXT
active      BOOLEAN DEFAULT true

-- characters
id              UUID PRIMARY KEY
user_id         TEXT REFERENCES allowed_discord_ids(discord_id)
session_id      UUID REFERENCES sessions(id)
name            TEXT
class_id        TEXT      -- references /data/classes index
ancestry_id     TEXT      -- references /data/ancestries index
level           INT DEFAULT 1
str             INT
dex             INT
con             INT
int             INT
wis             INT
cha             INT
hp_max          INT
hp_current      INT
ac              INT       -- auto-calculated, stored for realtime sync
luck_tokens     INT
equipment       JSONB     -- array of { item_id, slots }
spells          JSONB     -- array of spell_ids
torch_end_at    TIMESTAMPTZ
```

-----

## File structure

```
/src
  /app
    /login                    ← Discord OAuth entry point
    /character-creator        ← 7-step wizard
    /sheet                    ← Player view (protected)
    /gm                       ← GM panel (protected, role=gm)

  /components
    /sheet
      StatBlock.tsx           ← STR/DEX/CON/INT/WIS/CHA + modifier display
      CombatStats.tsx         ← HP (editable), AC (auto), Speed
      SlotTracker.tsx         ← max = Math.max(STR, 10)
      LuckTokens.tsx          ← increment/decrement, feeds into rolls
      TorchTimer.tsx          ← real-time countdown, webhook triggers
      DiceRoller.tsx          ← die select + modifier + DC input → result
      Equipment.tsx           ← item list with slot consumption
      Spells.tsx              ← conditional on class

    /creator
      StepAncestry.tsx
      StepClass.tsx
      StepStats.tsx           ← 3d6 × 6, re-roll rule applied here
      StepHP.tsx
      StepEquipment.tsx
      StepSpells.tsx          ← only renders for spellcasting classes
      StepReview.tsx

    /gm
      PlayerCard.tsx          ← compact: HP, AC, Luck, Torch status
      SessionPanel.tsx        ← grid of PlayerCards, expandable to full sheet (read-only)

  /data
    /classes
      index.ts                ← exports Class[] array
      warrior.ts
      thief.ts
      wizard.ts
      priest.ts
      ranger.ts
    /ancestries
      index.ts                ← exports Ancestry[] array
      human.ts
      elf.ts
      dwarf.ts
      halfling.ts
    /equipment
      index.ts                ← exports Item[] array
      /weapons
        sword.ts
        dagger.ts
        ...
      /armor
        leather.ts
        chainmail.ts
        ...
      /gear
        torch.ts
        rope.ts
        ...
    /spells
      index.ts
      /wizard
      /priest

  /types
    class.types.ts
    ancestry.types.ts
    equipment.types.ts
    character.types.ts
    discord.types.ts

  /lib
    supabase.ts               ← client + server instances
    discord.ts                ← webhook dispatcher (single exit point)
    dice.ts                   ← roll engine
    slots.ts                  ← slot calculation
    reroll.ts                 ← re-roll eligibility rule

  /hooks
    useCharacter.ts           ← Supabase Realtime sync
    useTorch.ts               ← countdown + webhook triggers
    useSlots.ts               ← reactive slot tracker

  /middleware.ts              ← allowlist check after OAuth
```

-----

## Type contracts

```ts
// /types/class.types.ts
interface Class {
  id: string
  name: string
  hitDie: number
  armorTraining: ArmorType[]
  weaponTraining: WeaponType[]
  spellcasting?: {
    stat: Stat
    spellsPerDay: number[]    // indexed by level
  }
  talents: Talent[]
  startingGear: ItemId[]      // fixed per class, no choices
}

// /types/ancestry.types.ts
interface Ancestry {
  id: string
  name: string
  traits: Trait[]
}

// /types/equipment.types.ts
interface Item {
  id: string
  name: string
  slots: number               // most = 1, two-handed = 2
  type: 'weapon' | 'armor' | 'gear'
  properties?: Record<string, unknown>
}

// /types/character.types.ts
interface Character {
  id: string
  name: string
  classId: string
  ancestryId: string
  level: number
  stats: Record<Stat, number>
  hpMax: number
  hpCurrent: number
  ac: number
  luckTokens: number
  equipment: { itemId: string; slots: number }[]
  spells: string[]
  torchEndAt: string | null
}
```

-----

## Core logic

### Modifier calculation

```ts
// dice.ts
export function modifier(stat: number): number {
  return Math.floor((stat - 10) / 2)
}
```

### Slot tracker

```ts
// slots.ts
export function maxSlots(str: number): number {
  return Math.max(str, 10)
}

export function usedSlots(equipment: { slots: number }[]): number {
  return equipment.reduce((sum, item) => sum + item.slots, 0)
}
```

### Re-roll eligibility

```ts
// reroll.ts
// Shadowdark rule: player can re-roll all stats if no single stat exceeds 14
export function canReroll(stats: number[]): boolean {
  return !stats.some(s => s > 14)
}
```

### AC calculation

AC depends on equipped armor + relevant modifier. Each armor item in `/data/equipment/armor/` carries its base AC and whether DEX modifier applies.

-----

## Discord webhook dispatcher

Single function in `/lib/discord.ts`. All events go through here — no direct webhook calls from components.

```ts
type DiscordEvent =
  | { type: 'roll';          player: string; die: string; result: number; modifier: number; total: number; dc: number; success: boolean }
  | { type: 'torch_lit';     player: string; minutesLeft: number }
  | { type: 'torch_warning'; player: string; minutesLeft: number }
  | { type: 'torch_out';     player: string }
  | { type: 'hp_change';     player: string; from: number; to: number; delta: number }
  | { type: 'player_down';   player: string }
  | { type: 'luck_used';     player: string; remaining: number }
  | { type: 'session_start'; gm: string }

export async function sendToDiscord(event: DiscordEvent): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  const message = formatEvent(event)
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  })
}
```

### Message format examples

```
🎲 [Aldric] Ataque — d20+3 → 17   SUCESSO vs DC 14
🕯️ [Aldric] Tocha acesa — 60min restantes
⚠️ [Aldric] Tocha quase apagando — 8min restantes
🌑 [Aldric] Tocha apagou
❤️ [Aldric] HP 12 → 7 (−5)
💀 [Aldric] Caiu — 0 HP
🍀 [Aldric] Luck Token usado — restam 2
⚔️ Sessão iniciada pelo GM
```

Webhook URL is a single global channel. One Discord channel receives all events from all players.

-----

## Torch timer behavior

- Player clicks “Acender tocha” → `torch_end_at = now() + 60 minutes`
- `useTorch` hook calculates countdown client-side from timestamp
- Supabase Realtime syncs `torch_end_at` to GM view
- Webhook fires on: lit, <10 min warning, expired
- Extinguish button resets `torch_end_at` to `null`

-----

## Character Creator Wizard — step flow

```
Step 1: Nome + Ancestria
  → renders ancestry traits inline

Step 2: Classe
  → renders hit die, armor/weapon training, class abilities

Step 3: Rolar atributos
  → rolls 3d6 per stat (6 stats)
  → canReroll() checked after each roll set
  → re-roll button visible only if canReroll() === true
  → modifiers displayed immediately

Step 4: HP inicial
  → rolls class hitDie + CON modifier
  → minimum 1 enforced

Step 5: Equipment
  → auto-populated from class.startingGear
  → slot tracker live as items are listed
  → no player choices (fixed per class)

Step 6: Spells
  → skipped if class has no spellcasting
  → spell list filtered by class

Step 7: Review
  → full character preview before saving
  → on confirm: INSERT into characters table
```

-----

## GM View behavior

- GM sees all characters belonging to the active session
- Each PlayerCard shows: name, HP bar, AC, Luck tokens, Torch status
- Click on card → expands to full character sheet (read-only)
- Realtime updates via Supabase subscription on `characters` table
- No dice result feed (rolls go to Discord only, not visible in GM panel)

-----

## Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DISCORD_WEBHOOK_URL
NEXTAUTH_SECRET              ← if using next-auth alongside Supabase Auth
```

-----

## What’s explicitly out of scope

- Grid / game canvas
- Roll history or session log in-app
- In-app chat
- Spell automation / combat tracking
- Multiple simultaneous sessions
- Self-registration (allowlist only)
- Discord bot / slash commands (webhook only)
- Character deletion or archiving UI (handle via Supabase dashboard)