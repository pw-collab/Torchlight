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
| sidebar-primary | `#fb2c36` | active tab fill |
| destructive | `#ff6467` | errors, damage |
| torch | `#fb9e31` | a burning light source (same in both themes) |
| border | white 10% | panel rules (decorative) |
| input | white 15% | input and control borders |
| ring | `#67787c` | focus |

## Contrast report (WCAG AA)

24 pairs checked, **7 fail**. Fix in the tokens, not per component.

| pair | ratio | needs | where it shows |
| --- | --- | --- | --- |
| `primary` text on card | 2.08 | 4.5 | **Hollow buttons** (12 uses: Inventory "Add", dice roller, GM prompt composer, handouts), link hover |
| `primary` text on background | 2.36 | 4.5 | same, on the page background |
| `sidebar-primary-foreground` on `sidebar-primary` | 3.48 | 4.5 | **Active tab label** in the sheet's bottom nav (11px mobile, 15px desktop) |
| `muted-foreground` 70% on card | 4.17 | 4.5 | helper text in the creator's narrative step (also only 10px) |
| `muted-foreground` 40% on secondary | 2.22 | 4.5 | placeholder in the floating vitals note field |
| `input` border on card | 1.58 | 3.0 | every text input, select and outlined control: hard to see where the field is |
| `input` border on background | 1.49 | 3.0 | same, on the page background |

Passing, for reference: body text 16.7 to 19:1, muted labels 6.1 to 8.1:1, text on red buttons
7.6:1, destructive 6.0 to 6.8:1, torch 8.3 to 9.4:1, focus ring 3.8 to 4.3:1.

Values that would pass (computed, not applied):

- **Input borders:** raise `--input` from white 15% to **34%** (3:1 on both surfaces).
- **Hollow buttons:** a separate red for text, e.g. `oklch(0.64 0.177 26.9)` = `#e4574e` (4.78:1 on card),
  or reuse `destructive` `#ff6467` (6.0:1).
- **Active tab:** either the darker brand red `primary` as the fill (7.6:1 with the same text), or keep
  the bright red and use dark text.
- **The two faded texts:** drop the opacity modifier; plain `muted-foreground` passes (6.1:1 and up).

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
5. **Focus ring** is 1px at 50% opacity. It still passes, because the border also switches
   to the full `ring` colour on focus, but it is faint.

## Components

Screen IDs are from `replica/recon.md`.

```
Button  (src/components/ui/button.tsx + .cn-button in style-lyra.css)
  variants  default (solid red), secondary (dark, gold rule), outline, ghost,
            destructive, hollow (red outline), link
  sizes     xs 24px, sm 28px, default 32px, lg 36px; icon 24 / 28 / 32 / 36 square
  type      Bricolage, uppercase, tracking .08em, text-xs (default and lg set text-sm / text-base)
  states    default, hover, active (1px sink, or .tactile scale .96), focus-visible
            (border to ring + 1px ring at 50%), disabled (50% opacity, no pointer),
            aria-invalid (destructive ring)
  a11y      real <button> (Base UI). FAILS: hollow text 2.1:1.
  used on   everywhere
```

```
Input / Textarea / NumInput / NativeSelect
  size      32px tall, px 10, text-xs
  tokens    border input, fill input/30 (dark), focus border ring, invalid destructive
  states    default, focus-visible, disabled (fill input/80), aria-invalid
  a11y      NumInput has aria-label and arrow-key handling. FAILS: border 1.6:1.
  used on   S04, S05b, S08, S11, S13
```

```
Tabs (shadcn, Base UI)  + TabBar (sheet bottom nav) + TabRail (desktop side rail)
  TabBar    fixed bottom, 48px tall, sidebar fill, 2px top rule, safe-area padding;
            trailing slot holds the dice button
  states    inactive muted-foreground, hover foreground, active sidebar-primary fill
  a11y      real tablist and tabs; nav has aria-label; TabRail marks aria-current.
            FAILS: active label 3.5:1.
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
