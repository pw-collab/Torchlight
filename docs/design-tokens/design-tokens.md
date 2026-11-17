# Torchlight design tokens

Dark theme only. The app renders `<html class="dark">` and has no light mode.

Source of truth: `src/app/globals.css` (`.dark` block, type utilities, `@theme inline`). Machine readable copy: `design-tokens.json` (W3C DTCG format, aliases as `{path}`).

## Colour: palette

Names come from the Figma theme (Playground, collection Theme, mode Dark). Change values here first, everything else points at them.

| Token | Hex | Role |
|---|---|---|
| `--bg-sunken` | `#110d0b` | The page behind everything |
| `--bg-base` | `#1c1512` | Panels |
| `--bg-raised` | `#2a201c` | Blocks on a panel: HP, attributes, the dock |
| `--bg-panel` | `#372b27` | What floats: popovers, menus |
| `--ember` | `#df7653` | The action colour, and the light |
| `--ember-foreground` | `#1b1513` |  |
| `--spirit` | `#48b8d2` | The counterweight: turns, secondary actions |
| `--spirit-foreground` | `#131a1b` |  |
| `--border-outline` | `#53433c` | Panel frames and dividers |
| `--border-frame` | `#110d0b` | The ink line around controls |
| `--border-control` | `#8f796a` | Edge of a control, 3:1 or better |
| `--class` | `#df7653` | Identity tag: class |
| `--class-foreground` | `#34140a` |  |
| `--archetype` | `#9f815d` | Identity tag: archetype |
| `--archetype-foreground` | `#201a13` |  |
| `--ancestry` | `#8fb4c0` | Identity tag: ancestry |
| `--ancestry-foreground` | `#182e34` |  |
| `--spell` | `#b59fd6` | Spells, on the grimoire's cards |
| `--spell-foreground` | `#221a2e` |  |

## Colour: shadcn roles

Tailwind classes use these (`bg-card`, `text-muted-foreground`). "Points at" shows the alias in the CSS.

| Token | Resolved | Points at | Role |
|---|---|---|---|
| `--background` | `#110d0b` | `--bg-sunken` | Page |
| `--foreground` | `#ecdbb8` |  | Default text |
| `--card` | `#1c1512` | `--bg-base` | Panel surface |
| `--card-foreground` | `#ecd9b7` |  |  |
| `--popover` | `#372b27` | `--bg-panel` | Floating surfaces |
| `--popover-foreground` | `#ecdbb8` | `--foreground` |  |
| `--primary` | `#df7653` | `--ember` | Fill for main actions |
| `--primary-foreground` | `#1b1513` | `--ember-foreground` |  |
| `--secondary` | `#2d221f` |  | Quiet surface |
| `--secondary-foreground` | `#ecdbb8` | `--foreground` |  |
| `--muted` | `#2d221f` |  | Subdued surface |
| `--muted-foreground` | `#b0a18f` |  | Dim labels |
| `--accent` | `#6e564e` |  | Highlighted item (Figma "card") |
| `--accent-foreground` | `#ecd9b7` |  |  |
| `--destructive` | `#ff6467` |  | Danger |
| `--border` | `#53433c` | `--border-outline` | Rules |
| `--input` | `rgb(242 162 136 / 15%)` |  | Selected-state fill (15% alpha) |
| `--ring` | `#ecdbb8` | `--foreground` | Focus ring |
| `--chart-1` | `#d9c7a3` |  | Also used as the gold highlight in glows and rules |
| `--chart-2` | `#b0a18f` |  |  |
| `--chart-3` | `#6e564e` |  |  |
| `--chart-4` | `#53433c` |  |  |
| `--chart-5` | `#2d221f` |  |  |
| `--sidebar` | `#1c1512` | `--bg-base` | Nav surface |
| `--sidebar-foreground` | `#ecdbb8` | `--foreground` |  |
| `--sidebar-primary` | `#df7653` | `--ember` |  |
| `--sidebar-primary-foreground` | `#1b1513` | `--ember-foreground` |  |
| `--sidebar-accent` | `#2d221f` | `--muted` |  |
| `--sidebar-accent-foreground` | `#ecdbb8` | `--foreground` |  |
| `--sidebar-border` | `#53433c` | `--border-outline` |  |
| `--sidebar-ring` | `#8f796a` | `--border-control` |  |
| `--torch` | `#df7653` | `--ember` | Light source that is burning |
| `--primary-text` | `#df7653` | `--ember` | Ember used as text (AA on dark surfaces) |
| `--input-border` | `#8f796a` | `--border-control` | Edge of a control |

Note: `--input` has 15% alpha. It is a selected-state fill, not a border. The control edge is `--input-border` (`--border-control`).

## Fonts

| Token | Value | Use |
|---|---|---|
| `--font-heading` | `'Germania One', Georgia, serif` | Titles from 16px up. Single weight, size is the hierarchy lever. |
| `--font-numeral` | `'Germania One', Georgia, serif` | Inked numerals: modifiers, HP, AC |
| `--font-body` | `'Libre Franklin', sans-serif` | Running text (variable 100-900) |
| `--font-mono` | `'Libre Franklin', sans-serif` | Labels and metadata under 16px. Not a monospace. |
| `--font-stat` | `'Bricolage Grotesque', sans-serif` | Clock and nav readouts (wght 500-800, opsz 12-96) |

Loaded from Google Fonts in `src/app/layout.tsx`. `font-synthesis-weight: none` stops the browser from faking a bold on Germania One.

## Type scale (`type-*` utilities)

| Utility | Family | Size | Line | Weight | Extra |
|---|---|---|---|---|---|
| `type-display-xl` | heading | 48px | 1.2 | normal |  |
| `type-display-lg` | numeral | 28px | 1 | normal |  |
| `type-display-md` | heading | 24px | 1.2 | normal |  |
| `type-display-sm` | heading | 18px | 1.2 | normal |  |
| `type-title` | heading | 16px | 1.2 | normal | textTransform uppercase |
| `type-button` | mono | 16px | 1.2 | 700 | textTransform uppercase |
| `type-tag` | mono | 14px | 1.3 | 600 |  |
| `type-body` | body | 12px | 1.5 | normal |  |
| `type-caption` | mono | 10px | 1.2 | normal |  |
| `type-label` | mono | 10px | 1.5 | normal | letterSpacing 0.12em, textTransform uppercase |
| `type-clock` | stat | 14px | inherit | 700 | letterSpacing 0.08em |
| `type-nav` | stat | 12px | inherit | 500 | letterSpacing 0.11em, textTransform uppercase |

## Radius

`--radius: 0`. Square corners everywhere. `--radius-sm` to `--radius-4xl` are multiples of it, so they are all 0.

## Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | `0 2px 6px rgba(0,0,0,0.35)` |
| `--shadow-md` | `0 4px 14px rgba(0,0,0,0.45)` |
| `--shadow-lg` | `0 8px 28px rgba(0,0,0,0.55)` |
| `--glow-candle` | `0 0 12px color-mix(in oklch, var(--primary), transparent 60%)` |
| `--glow-blood` | `0 0 8px color-mix(in oklch, var(--destructive), transparent 50%)` |
| `--glow-blood-soft` | `0 0 10px color-mix(in oklch, var(--destructive), transparent 75%)` |
| `--glow-gold` | `0 0 8px color-mix(in oklch, var(--chart-1), transparent 55%)` |

## Z-index

| Token | Value |
|---|---|
| `--z-sheet-float` | 50 |
| `--z-vitals` | 85 |
| `--z-torch` | 90 |
| `--z-toast` | 95 |
| `--z-modal-backdrop` | 100 |
| `--z-modal` | 101 |
| `--z-seal` | 120 |
| `--z-popover-backdrop` | 140 |
| `--z-popover` | 141 |
| `--z-grain` | 9998 |
| `--z-vignette` | 9999 |

## Motion

| Token | Value |
|---|---|
| `--ease-ritual` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| press (inline in `.tactile`) | `90ms` |
| `--duration-base` | `400ms` |
| `--duration-slow` | `700ms` |

About 20 named keyframes also live in `globals.css` (`inkSpread`, `candleFlicker`, `critFlash`, `torchHalo`...). They are not tokens. `prefers-reduced-motion` shortens all of them.

## Layout and breakpoints

These are literals in CSS, not variables.

| Name | Value |
|---|---|
| Grid | 12 columns, 6 on phones (640px and below) |
| Gutter | 24px (12px on phones) |
| Page margin | 48px (16px padding on phones) |
| Content max | 1440px (1760px on `/home`) |
| Header | 72px |
| Breakpoints used | 400, 420, 640, 767, 900, 1000, 1100, 1440, 1536 (plus 480 and 1024 in a few spots) |
| Safe area | `--safe-top/right/bottom/left` from `env(safe-area-inset-*)` |

## Heads up: `replica/design/tokens.json` is out of date

- Its `font.heading` says Bricolage Grotesque. The CSS now uses **Germania One** for headings and Bricolage only for `--font-stat`.
- It is missing `--spell`, `--spell-foreground`, `--chart-1` to `--chart-5`, `--ember`, most `--sidebar-*`, `--border`, and the `--bg-sunken/base/panel` and `--border-outline/frame/control` names.
- Its `type_proposed` scale was never adopted. The real scale is the `type-*` utilities above.
- Its `input-on-card`, `destructive-10-on-card` and `border-on-background` are computed blends for the contrast script, not CSS tokens.
- All hex values that exist in both files match.
