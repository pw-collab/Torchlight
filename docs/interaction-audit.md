# Interaction audit: Torchlight

Date: 2026-11-08 · Base: `main` at 6b137a7 · Scope: whole app (login, roster, creator, sheet, edit wizard, GM screen)

## How this was done

This audit was done by reading the code. There are no Supabase keys in this environment, so nothing behind login could be clicked through. Every finding below comes from the source, with file references. The checks follow Saffer's trigger, rules, feedback, loops model and Cooper's ideas on posture and excise. The main question for each write to the database was: **when this fails, what does the person see?**

## Posture

| Surface | Posture | What that asks for |
|---|---|---|
| Character sheet | Sovereign (open for a whole session) | Dense, calm, feedback that doesn't get in the way, no interruptions |
| GM screen | Sovereign, under time pressure (the table is waiting) | No blocking dialogs mid-combat, fast undo, clear failures |
| Creator, edit wizard | Transient, but long (10 steps) | Never lose work, always say why you're blocked |
| Roster, login | Transient | Obvious, forgiving |

Most of the app already gets this right. The sheet has a save stamp ("Selado"), a conflict stamp, live announcements for rolls, and well-labelled HP controls. The gaps are almost all in one place: **what happens when a write fails.**

## The main pattern: failed writes looked like they worked

Nearly every Supabase write either ignored the error or only logged it to the console. That meant a refused write (offline, timeout, RLS) looked exactly like one that worked, or failed without a word:

- The list item disappeared, then came back on the next visit (NPC, scene, handout deletes).
- The wizard moved on, or left the page, and the changes were gone (edit wizard "Selar Alterações").
- The sheet quickly snapped back to the stored value. The player's HP change was undone with no message.
- The button turned back on and nothing else happened (creator "Selar o Registro" after 10 steps).

There was no shared way to show a failure. The only error messages in the app were in the NPC creator modal and the avatar upload.

## Findings, ranked

Severity: **High** = work is lost or a false state is shown. **Medium** = confusing, but recoverable. **Low** = polish.

| # | Sev | Where | Finding | Status |
|---|---|---|---|---|
| 1 | High | `hooks/useCharacter.ts`, `sheet/CharacterSheetClient.tsx` | A refused sheet save showed no message. The saver reloads the stored row, so the change just disappears. | **Fixed** |
| 2 | High | `character-creator/page.tsx` | The final save failing only did `console.error`. The button turned back on with no message. | **Fixed** |
| 3 | High | `character-creator/page.tsx` | 10 steps lived only in React state. A refresh, a phone killing the tab, "← Sair" or the bounce to login all wiped every roll and choice. A refresh also let you re-roll your stats. | **Fixed** |
| 4 | High | `sheet/[id]/edit/CharacterEditWizard.tsx` | `saveAll` went back to the sheet even when the write failed, dropping every edit. Step saves and level-ups ignored errors. | **Fixed** |
| 5 | High | `gm/GMPageClient.tsx` | NPC delete removed the card even when the database refused. Favourite and tag changes were optimistic with no rollback. | **Fixed** |
| 6 | High | `gm/GMPageClient.tsx` | Ending a session cleared the panel even when the update failed, hiding a table that was still open with a valid code. | **Fixed** |
| 7 | High | `gm/ScenesPanel.tsx`, `gm/HandoutDrawer.tsx` | Scene and handout deletes removed the item locally no matter what happened. Saves failed silently. | **Fixed** (deletes, saves, scene played toggle) |
| 8 | Medium | `home/CampaignRosterClient.tsx` | A failed character delete did nothing visible. The person had already confirmed, so it looked like the app ignored them. | **Fixed** |
| 9 | Medium | `character-creator/page.tsx` | "Próximo" was disabled with no reason given. You had to guess what was missing. | **Fixed** |
| 10 | Medium | 7 places | Native `window.confirm` dialogs. They are unstyled, block everything, and on the GM table ("Tirar da trilha") they stop the flow mid-combat. Most of these actions could be undone instead. | Open (see below) |
| 11 | Medium | `hooks/useEncounterControls.ts`, `ScenesPanel.startScene` | Encounter writes (start, add foes, edit, remove actor) ignore errors. `busy` is not reset in a `finally`, so if something throws, the controls stay disabled. | Open |
| 12 | Medium | `CharacterEditWizard.tsx` | The edit wizard writes straight to `characters` and skips the version-checked saver from BUG-006. It can silently overwrite a GM change made while the wizard was open. | Open |
| 13 | Low | `src/app/**` | Only the sheet has a `not-found.tsx`. There is no `error.tsx` anywhere, so an unexpected throw shows the default Next.js error screen, out of theme and with no way back. | Open |
| 14 | Low | `GMPageClient.endSession` | The "session ended" event is logged before the update. If the update fails, the log says the session ended but it is still open. | Open (the panel now stays honest; the log line still lies) |

## What changed

### A shared failure notice

`src/components/shared/FailNotice.tsx`: one hook (`useFailNotice`) and one component. How it works:

- **Trigger:** a write that the database refused.
- **Rules:** it says what was lost and what to do next ("Confira a conexão e tente de novo"). A new failure replaces the old one. It does not fade away on a timer, because a lost change matters more than the second or two a toast would give.
- **Feedback:** a bordered card in the destructive colour, near the bottom of the screen, above the mobile tab bar. It sits in an always-mounted `role="alert"` region, so screen readers read it when it appears. It has a 44px "Fechar" button.
- **Loops:** none. One notice at a time.

It is used on the sheet, in the edit wizard, on the GM screen (NPCs, session end), in scenes, in handouts and on the roster.

### Sheet (finding 1)

`useCharacter` now also returns `failedAt`, next to `savedAt` and `conflictAt`. The sheet shows: *"A mudança não foi salva e a ficha voltou ao que estava. Confira a conexão e tente de novo."* The notice stays until closed, since a player often changes HP and then looks back at the table.

### Creator (findings 2, 3, 9)

- **Draft kept** in `localStorage` (`src/lib/creatorDraft.ts`). It is written on every change and deleted after a successful save. An empty form is never stored. A draft from another version is ignored. Fields added later fall back to blank values.
- **Resume banner:** "Rascunho retomado de onde você parou." with a **Começar do zero** button. That is an escape hatch, not a dialog.
- **Hydration-safe:** the server renders a blank form. After hydration the form mounts again from the draft (using `useSyncExternalStore`, the same pattern `useCrawl` uses). There is no setState-in-effect.
- **Save failure** shows inline under the button: *"Não deu para selar o registro. Nada se perdeu: confira a conexão e tente de novo."* That sentence is true now, because the draft survives.
- **Why "Próximo" is off:** a hint under the buttons, linked to the button with `aria-describedby`. For example: "Role os atributos e dê um valor a cada um dos seis." or "Dê um nome ao personagem para seguir."

### Edit wizard (finding 4)

`saveAll` stays on the page when the write fails ("As alterações não foram salvas. Elas continuam aqui."). Step saves and level commits report failures. Their values are still written again by the final save.

### GM, scenes, handouts, roster (findings 5 to 8)

Deletes only remove the item once the database says yes. Favourite and tag toggles roll back on failure. Ending a session that fails keeps the session on screen. Each failure names the thing ("A ficha de "Corvo" não foi excluída.").

## Recommended next steps (not done here)

1. **Replace `window.confirm` with undo where the action can be undone** (finding 10). Removing an actor from the turn order, deleting a scene and discarding a handout can all be put back. A 6-second "Desfazer" on the FailNotice-style card would keep the GM in flow. Keep a confirmation only for deleting a character, and make it a themed dialog rather than the browser's.
2. **Encounter writes** (finding 11): check errors in `useEncounterControls`, wrap `busy` in `try/finally`, and send refusals to the existing `notice` on the turn ribbon.
3. **Edit wizard through the saver** (finding 12): send its writes through `createCharacterSaver` so the conflict guard covers them too.
4. **Route error screens** (finding 13): add an `error.tsx` for `/sheet/[id]` and `/gm` that stays in theme and offers "Tentar de novo" and a way back home.
5. **Log after the write** (finding 14): record the "end" event after the update succeeds, or record a correction if it fails.

## Verification

- `tsc --noEmit`: clean.
- `eslint`: 26 problems before, 26 after. All are pre-existing; nothing new was introduced.
- Playwright: 66 rule checks pass, including 4 new ones for the creator draft (`e2e/f02-creator-draft.spec.ts`). The browser checks for logged-out pages pass. One failed (`F01-N2`) only because this environment has no `DISCORD_WEBHOOK_URL`, so the route returns 503 by design.
- **Not verified in a browser:** every changed screen is behind login, so the notice, the resume banner and the hint have not been seen live. Worth a look on a phone-width screen before merging.
