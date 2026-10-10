# Bugs: Torchlight

Run: 2026-10-10, build f2de196. Only reproduced bugs are listed. Each fix has a test in `e2e/`.

### BUG-001: Login gate in the proxy never runs

- Severity: S2 (security; S1 if the database rules were also weak, see note)
- Flow / case: F01 / F01-N1, F01-N3, F01-N4
- Screen: all
- Build: f2de196  Browser: Chromium via Playwright 1.56, curl

Steps
1. Log out.
2. Open `/character-creator`.

Expected: redirect to `/login`.
Actual: the page loads (200).
Evidence: `e2e/f01-sign-in.spec.ts` "logged out /character-creator goes to /login" failed before the fix.
Cause: `src/proxy.ts` treats `'/'` in `PUBLIC_PATHS` as a prefix, and every path starts with `/`.
So the proxy returns early for every request. That also skips the Discord allowlist check
and the "players can't open `/gm`" check. Other pages only looked safe because each one
checks for a user by itself.
Note: the database rules (RLS) still check the allowlist for most data, which is why this is
S2 and not S1. Someone with a real login should still confirm F01-N3 and F01-N4.
Status: fixed on branch `claude/serene-heisenberg-6gjk4w` (`/` now matches only itself; image and sound files in `public/` stay open so the login page still shows its icon).

### BUG-002: Versatile weapons roll "NaN" damage

- Severity: S2
- Flow / case: F04 / F04-E1, F04-E2, F04-N1
- Screen: S05b inventory, "Dmg" button
- Build: f2de196

Steps
1. Give a character a Bastard Sword, Greataxe, Morningstar or Pickaxe.
2. Press "Dmg".

Expected: a damage number.
Actual: `NaN`. `rollFormula('1d8/1d10')` returns `total: NaN`.
Same for GM NPC damage written like `2d6+1d4` or `1d8+STR`.
Evidence: `e2e/f04-dice.spec.ts` F04-E1 failed on "Bastard Sword (1d8/1d10)".
Cause: `rollFormula` in `src/lib/dice.ts` only read one `NdM±K` term. Anything else fell back
to `rollDie`, which did `parseInt` on the wrong text.
Status: fixed on branch. Versatile weapons now roll the one-handed die (first value);
compound formulas add every term. There's no two-handed choice yet; see "to check".

### BUG-003: Blowgun damage rolls 1 to 20 instead of 1

- Severity: S3
- Flow / case: F04 / F04-E3
- Screen: S05b inventory

Steps: roll damage for a Blowgun (`damageDie: '1'`).
Expected: 1. Actual: a d20 roll, because a formula with no `d` fell back to d20.
Status: fixed on branch.

## To check (not reproduced)

- Versatile weapons: should the sheet offer the two-handed die (1d10) when wielded with both hands? Game design call.
- `npm run lint` has 17 pre-existing errors (mostly `any` in `src/types/character.types.ts`). If CI ever runs lint, it will fail.
- Production should have `supabase/migrations/014_npcs_rls_fix.sql` applied (see `DEPLOY.md`).
- Everything behind login is untested. Next step: a local Supabase with seed users so F02 to F08 can be automated.
