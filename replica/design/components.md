# Design system: Torchlight

Date: 2026-10-10. Build: `41c2b04`. Theme: dark only (`<html class="dark">`, no toggle).

- **Source of truth:** `src/app/globals.css` (the `:root` and `.dark` blocks, and `@theme inline`,
  which maps every token into Tailwind as `bg-card`, `text-muted-foreground` and so on).
  `src/app/style-lyra.css` holds the shadcn "lyra" component styles (`.cn-*`).
- **Snapshot for checks:** `replica/design/tokens.json` (dark values as hex) and
  `replica/design/contrast.py` (from the replica pack).

```bash
python3 replica/design/contrast.py replica/design/tokens.json
```

Nothing here needed rebuilding: tokens, the Tailwind mapping and an accessible primitive set
(shadcn on Base UI) already exist. This file records the system and what fails.

## Foundations

| | value |
| --- | --- |
| Fonts | Bricolage Grotesque (headings, numerals, buttons; weight fixed at 800), Libre Franklin (body and small-caps labels). Both open source, from Google Fonts. |
| Corners | `--radius: 0`. Every corner is square, on purpose. |
| Spacing | Tailwind 4px base. Most used: 8px, 10px, 4px, 6px, 12px, 16px. |
| Shadows | sm / md / lg black drops, plus `glow-candle` (red) and `glow-blood` for hover. |
| Motion | `--ease-ritual` cubic-bezier(.4,0,.2,1); press 90ms, base 400ms, slow 700ms; about 20 named keyframes. All killed by the global `prefers-reduced-motion` rule, and the dice honour it too. |
| Layers | z-index scale from `--z-sheet-float` 50 up to `--z-vignette` 9999. |
| Icons | Hugeicons (free set). |

### Colour roles (dark)

| role | hex | job |
| --- | --- | --- |
| background | `#090b0c` | page |
| card / popover / sidebar | `#161b1d` | panels, menus, nav bar |
| muted | `#22292b` | quiet fills |
| secondary | `#27272a` | gold-ruled dark buttons, inputs on the sheet |
| foreground | `#f9fbfb` | text |
| muted-foreground | `#9ca8ab` | labels, secondary text (the most used text colour: 155 uses) |
| primary / accent | `#9f0712` | the red action fill |
| primary-foreground | `#fef2f2` | text on red |
| sidebar-primary | `#9f0712` (= primary) | active tab fill |
| destructive | `#ff6467` | errors, damage |
| torch | `#fb9e31` | a burning light source (same in both themes) |
| border | white 10% | panel rules (decorative) |
| input | white 15% | selected-state fills, empty pips (and control fills at 30%) |
| input-border | white 36% | edges of inputs and outlined controls |
| primary-text | `#e4574e` | red used as text or a thin outline |
| ring | `#d0d6d8` | focus |

## Contrast report (WCAG AA)

**Now 25 pairs, 0 failing.** The first check found 7 failures; all were fixed in the tokens
on 2026-10-10. Before and after: `contrast-fixes.png` (rendered from the app's compiled CSS).

| what | where it shows | before | after | fix |
| --- | --- | --- | --- | --- |
| red text on card / background | **Hollow buttons** (12 uses: Inventory "Add", dice roller, GM prompt composer, handouts), link hover, AppShell back arrow | 2.08 / 2.36 | 4.78 / 5.42 | new `--primary-text` `oklch(0.64 0.177 26.9)` = `#e4574e`; `--primary` stays the fill |
| active tab label | sheet bottom nav, desktop tab rail, dock buttons, creator and edit step strips | 3.48 | 7.64 | `--sidebar-primary` now `var(--primary)` (was the brighter `#fb2c36`) |
| control borders | every input, select, outlined button, tab, picker card (34 class uses) | 1.49 to 1.58 | 3.22 to 3.33 | new `--input-border` white 36%; `--input` stays at 15% because 25+ selected-state fills and empty luck pips use it |
| focus vs unfocused border | any focused control | 2.38 | 3.55 | `--ring` raised to the `--chart-1` grey; without it, brighter borders would have made focus harder to see |
| faded helper text | creator narrative step | 4.17 | 7.12 | dropped the `/70` modifier |
| faded placeholder | floating vitals note field | 2.22 | 6.10 | dropped the `/40` modifier |

Passing throughout: body text 14.2 to 19:1, muted labels 6.1 to 8.1:1, text on red buttons
7.6:1, destructive 5.3 to 6.8:1, torch 8.3 to 9.4:1.

Still open, not part of this fix: about 25 selected states pair a `border-[var(--primary)]`
edge with an `--input` fill. The dark red edge reads 2.1:1 on card, but the fill change also
marks the selection, so the state is still visible.

## Other findings

1. **No type scale.** Inline `fontSize` uses 23 different values. About 80 uses are below 10px,
   down to 6px. Tailwind's `text-xs` (12px) is the most common class. For an app read on a
   phone across a table, a floor of 10px for uppercase labels and 12px for anything else is
   the minimum. Proposed 7-step scale in `tokens.json` → `type_proposed`.
2. **Twelve breakpoints.** CSS uses 400, 420, 480, 640, 767, 900, 1000, 1024, 1100, 1440 and 1536px,
   plus Tailwind's sm, md and lg. Three or four would cover it: 640, 1024, 1440.
3. **Roll toasts are silent to screen readers.** `RollToasts`, `TableToasts` and `RollCard`
   have no `aria-live` or `role="status"`, so a roll result is never announced.
4. **Touch targets.** Default buttons are 32px tall, `sm` 28px, `xs` and `icon-xs` 24px. That meets
   WCAG AA's 24px minimum but sits well under the 44px usually advised for phones.
5. **Focus ring** is 1px at 50% opacity. The border switching to the now-brighter `ring` colour
   is what makes focus visible; a 2px ring would be stronger still.

## Components

Screen IDs are from `replica/recon.md`.

```
Button  (src/components/ui/button.tsx + .cn-button in style-lyra.css)
  variants  default (solid red), secondary (dark, gold rule), outline, ghost,
            destructive, hollow (red outline), link
  sizes     xs 24px, sm 28px, default 32px, lg 36px; icon 24 / 28 / 32 / 36 square
  type      Bricolage, uppercase, tracking .08em, text-xs (default and lg set text-sm / text-base)
  states    default, hover, active (1px sink, or .tactile scale .96), focus-visible
            (border to ring + 1px ring at 50%; ring is a light grey, 3.5:1 against the unfocused border), disabled (50% opacity, no pointer),
            aria-invalid (destructive ring)
  a11y      real <button> (Base UI). Hollow text 4.8:1 (was 2.1:1, fixed).
  used on   everywhere
```

```
Input / Textarea / NumInput / NativeSelect
  size      32px tall, px 10, text-xs
  tokens    border input-border, fill input/30 (dark), focus border ring, invalid destructive
  states    default, focus-visible, disabled (fill input/80), aria-invalid
  a11y      NumInput has aria-label and arrow-key handling. Border 3.3:1 (was 1.6:1, fixed).
  used on   S04, S05b, S08, S11, S13
```

```
Tabs (shadcn, Base UI)  + TabBar (sheet bottom nav) + TabRail (desktop side rail)
  TabBar    fixed bottom, 48px tall, sidebar fill, 2px top rule, safe-area padding;
            trailing slot holds the dice button
  states    inactive muted-foreground, hover foreground, active sidebar-primary fill
  a11y      real tablist and tabs; nav has aria-label; TabRail marks aria-current.
            Active label 7.6:1 (was 3.5:1, fixed).
  used on   S05 (TabBar, TabRail), S11-S13 (GM tabs), S04 (step strip)
```

```
Dialog / Sheet / Drawer / AlertDialog
  base      Base UI dialog: focus trap, Escape closes, focus returns to the trigger
  tokens    popover fill, z modal 101 over backdrop 100
  used on   CharacterEditModal, NPCCreatorModal, BestiaryImportModal, BookViewerModal (S05, S08, S13)
```

```
Popover / DropdownMenu / ContextMenu / RollModeMenu
  tokens    popover fill, popover-foreground, z popover 141
  states    open, item hover / highlighted, disabled item
  used on   S05 (roll modes: normal, advantage, disadvantage), S11, S13
```

```
Roll toasts  (RollToasts, TableToasts, RollCard)
  look      card stack, slide in from the right (320ms), crit flash, fumble pulse
  states    own roll, table roll, critical, fumble, rerolled
  a11y      MISSING: no live region, results not announced
  used on   S05, S06, S07, S11
```

```
Cards  (GlyphCard, CardPicker, RosterCard, NPCCard, PlayerCard)
  look      card fill, 1 or 2px border rule, square; .card-lift on hover, .card-flip for details
  states    default, hover lift, selected, locked (creator), collapsed / expanded (NPC, player),
            defeated (encounter)
  used on   S03, S04, S08, S11, S13
```

```
Chips and badges  (DetailChip, ConditionChips, Badge, TableBadge)
  look      small uppercase labels, Libre Franklin, tracking .12-.16em, often 7-10px inline
  states    default, removable (conditions), active
  note      the main source of sub-10px text
  used on   S05a, S11
```

```
Meters  (XPBar, FortuneBar, Progress, TorchStatus, FloatingTorch, FloatingVitals)
  look      primary over chart-2 track; torch colour and halo animation while lit
  states    full, low, empty / out (torch), level-up ready (XP)
  a11y      FloatingTorch has an aria-label; decorative flame aria-hidden
  used on   S05, S06, S09
```

```
Dice  (DiceStage, DiceScene, DiceOverlay, ResultBurst, DieIcon, DieGlyph)
  look      three.js + cannon-es physics, sound, result burst
  states    idle, rolling, settled, critical, fumble
  a11y      honours prefers-reduced-motion (no physics, no burst); result needs announcing (see toasts)
  used on   S05, S11
```

```
Headings  (OrnateTitle, SectionHeading)
  type      Bricolage 800, uppercase, letter-spacing for hierarchy (weight is fixed)
  used on   all themed pages
```

```
shadcn primitives not listed above (~40 in src/components/ui)
  accordion, alert, avatar, breadcrumb, checkbox, collapsible, combobox, field, hover-card,
  item, kbd, menubar, pagination, progress, radio-group, scroll-area, select, separator,
  sidebar, skeleton, slider, spinner, switch, table, toggle, toggle-group, tooltip and others.
  All inherit the tokens above, so the input and ring fixes reach them too.
```

## Not done from the skill

- **Step 4, a `/design` page showing every primitive.** Not built: it would ship a new route to
  production, and it sits behind login, so it could not be screenshotted here. Worth doing
  once a test login exists.
- **Swapping brand colours and fonts.** The skill does this for clones. Torchlight is your own
  brand, so it stays.
