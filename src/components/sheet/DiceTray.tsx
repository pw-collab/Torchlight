'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { CornerDownRightIcon } from '@hugeicons/core-free-icons'
import { doubledDice, rollDie, withDc, type RollResult } from '@/lib/dice'
import { DICE_SPRING, DICE_TAP } from '@/lib/diceMotion'
import { useNow } from '@/hooks/useNow'
import { FOLLOW_UP_MS, ROLL_FRESH_MS, offersDamage } from '@/components/sheet/RollCard'
import { ResultCard } from '@/components/sheet/ResultCard'
import { DiceKeys } from '@/components/sheet/DiceKeys'
import { useStickyDc } from '@/components/sheet/DiceRoller'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  /** Newest first, as the sheet keeps them. */
  rolls: RollResult[]
  onRoll: (result: RollResult) => void
  /** Fortuna: what a reroll spends, and the d20 panel's third field. */
  luckTokens: number
  onLuckChange: (next: number) => void
  /** Gasta um token e rola de novo (§5.2). */
  onSpendFortune: (roll: RollResult) => void
  /** Rola o dano que o ataque carrega. */
  onRollDamage: (attack: RollResult) => void
  /** Os ataques cujo dano já foi rolado: a oferta some deles. */
  damageRolled: ReadonlySet<string>
  /** Condições que impõem desvantagem (§5.6): o painel do d20 avisa. */
  disadvantageFrom?: string[]
  /** What the table waits on (death, the turn, the Mestre's asks), at the foot of the chat. */
  status?: ReactNode
  /** The urgent part of it, standing over the closed tray so it is not missed. */
  alerts?: ReactNode
  /** The attacks and the turn, on a row over the dice. */
  actions?: ReactNode
}

/** A roll and, when it is an attack, the damage rolled right after it. */
interface Entry {
  roll: RollResult
  chained?: RollResult
}

/** Oldest first, each damage roll tucked under the attack it followed. */
function entriesOf(rolls: RollResult[]): Entry[] {
  const list = [...rolls].reverse()
  const out: Entry[] = []
  for (let i = 0; i < list.length; i++) {
    const roll = list[i]
    const next = list[i + 1]
    if (roll.damage && next?.isDamage) {
      out.push({ roll, chained: next })
      i++
    } else {
      out.push({ roll })
    }
  }
  return out
}

const OFFER_CLASS =
  'flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 border-2 px-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase ' +
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]'

/**
 * What the latest roll still offers: its damage, until it is rolled, and the
 * Fortuna reroll while it is fresh.
 */
function RollOffers({ entry, latest, now, luckTokens, onSpendFortune, onRollDamage, damageRolled }: {
  entry: Entry
  latest: RollResult
  now: number
  luckTokens: number
  onSpendFortune: (roll: RollResult) => void
  onRollDamage: (attack: RollResult) => void
  damageRolled: ReadonlySet<string>
}) {
  const main = entry.roll
  const canReroll = luckTokens > 0 && now - latest.timestamp < ROLL_FRESH_MS
  const canDamage = !entry.chained && offersDamage(main) && !damageRolled.has(main.id)
  if (!canReroll && !canDamage) return null

  const crit = main.isCritical === true
  const damageFormula = main.damage ? (crit ? doubledDice(main.damage.formula) : main.damage.formula) : null

  return (
    <div className="flex min-w-0 gap-1.5">
      {canDamage && damageFormula && (
        <button
          type="button"
          onClick={() => onRollDamage(main)}
          title={crit ? 'Crítico: os dados de dano da arma dobram' : 'Acertou? Role o dano da arma'}
          className={`${OFFER_CLASS} border-[var(--border-frame)] bg-[var(--ember)] text-[var(--ember-foreground)] hover:bg-[var(--ember)]/85`}
        >
          <span>{crit ? '✦ Dano crítico' : '⚔ Dano'}</span>
          <span className="tracking-normal normal-case">{damageFormula}</span>
        </button>
      )}
      {canReroll && (
        <button
          type="button"
          onClick={() => onSpendFortune(latest)}
          title={`Gastar um token de Fortuna e rolar de novo (${luckTokens} restante${luckTokens === 1 ? '' : 's'})`}
          className={`${OFFER_CLASS} border-[var(--chart-1)] bg-[color-mix(in_oklch,var(--chart-1),transparent_88%)] text-[var(--chart-1)]`}
        >
          ✦ Fortuna
        </button>
      )}
    </div>
  )
}

/**
 * One entry of the chat: the Result card, and the damage hooked under it (the
 * Figma's `↳`), at the Figma's heights (63 and 44px).
 */
function EntryCards({ entry }: { entry: Entry }) {
  return (
    <div className="flex flex-col gap-2">
      <ResultCard roll={entry.roll} className={entry.roll.isDamage ? 'min-h-11' : 'min-h-[63px]'} />
      {entry.chained && (
        <div className="flex min-w-0 items-start gap-1.5">
          <HugeiconsIcon icon={CornerDownRightIcon} size={24} strokeWidth={1.5} className="text-foreground ml-2 shrink-0" />
          <ResultCard roll={entry.chained} className="min-h-11 min-w-0" />
        </div>
      )}
    </div>
  )
}

const FIELD_CELL =
  'flex min-w-0 flex-col items-center justify-center gap-0.5 border-2 border-[var(--border-frame)] bg-[var(--bg-raised)] px-1'
const FIELD_LABEL = 'type-label text-muted-foreground leading-none tracking-[0.08em]'
const FIELD_INPUT =
  'w-full min-w-0 border-0 bg-transparent p-0 text-center text-[20px] leading-none text-foreground outline-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]'

const MODE_KEY =
  'size-full min-h-0 min-w-0 flex-col gap-1 px-0 bg-muted text-foreground border-2 border-[var(--foreground)] hover:bg-[var(--bg-raised)] ' +
  'font-mono text-[10px] leading-none font-bold tracking-[0.04em]'

/**
 * The d20 panel, opened in place of the other dice (the ember key toggles
 * it): the modifier, the DC and the Fortuna on the top row, the three ways to
 * roll on the bottom one. Same six cells, so nothing else in the tray moves.
 */
function D20Options({ onRoll, disadvantageFrom, luckTokens, onLuckChange, mod, setMod, dc, setDc, onDone }: {
  onRoll: (result: RollResult) => void
  disadvantageFrom: string[]
  luckTokens: number
  onLuckChange: (next: number) => void
  mod: number
  setMod: (next: number) => void
  dc: number
  setDc: (next: number) => void
  onDone: () => void
}) {
  function roll(mode: 'normal' | 'advantage' | 'disadvantage') {
    const result = rollDie('d20', 'd20', undefined, mod, mode === 'advantage', mode === 'disadvantage')
    result.isCritical = result.result === 20
    result.isFumble = result.result === 1
    onRoll(withDc(result, dc))
    onDone()
  }

  const numeric = (raw: string) => {
    const n = parseInt(raw.replace(/[^\d-]/g, ''), 10)
    return Number.isFinite(n) ? n : 0
  }
  const warned = disadvantageFrom.length > 0

  return (
    <>
      <label className={FIELD_CELL} title="Somado ao d20">
        <span className={FIELD_LABEL}>Mod</span>
        <input
          type="text"
          inputMode="numeric"
          value={mod > 0 ? `+${mod}` : String(mod)}
          onChange={e => setMod(numeric(e.target.value))}
          onFocus={e => e.target.select()}
          className={FIELD_INPUT}
          style={{ fontFamily: 'var(--font-numeral)' }}
        />
      </label>
      <label className={FIELD_CELL} title="A dificuldade do teste">
        <span className={FIELD_LABEL}>CD</span>
        <input
          type="text"
          inputMode="numeric"
          value={dc}
          onChange={e => setDc(Math.max(0, numeric(e.target.value)))}
          onFocus={e => e.target.select()}
          className={FIELD_INPUT}
          style={{ fontFamily: 'var(--font-numeral)' }}
        />
      </label>
      <label className={FIELD_CELL} title="Tokens de Fortuna: cada um compra uma segunda chance">
        <span className={FIELD_LABEL}>Fortuna</span>
        <input
          type="text"
          inputMode="numeric"
          value={luckTokens}
          onChange={e => onLuckChange(Math.max(0, numeric(e.target.value)))}
          onFocus={e => e.target.select()}
          className={FIELD_INPUT}
          style={{ fontFamily: 'var(--font-numeral)', color: luckTokens > 0 ? 'var(--chart-1)' : undefined }}
        />
      </label>

      <Button type="button" variant="outline" render={<motion.button {...DICE_TAP} />} onClick={() => roll('normal')}
        title="Um d20" aria-label="Rolar d20 normal" className={MODE_KEY}>
        <span aria-hidden className="text-[16px]">✦</span>Normal
      </Button>
      <Button type="button" variant="outline" render={<motion.button {...DICE_TAP} />} onClick={() => roll('advantage')}
        title="Dois d20, fica o maior" aria-label="Rolar d20 com vantagem" className={MODE_KEY}>
        <span aria-hidden className="text-[16px]">↑</span>Vant.
      </Button>
      <Button type="button" variant="outline" render={<motion.button {...DICE_TAP} />} onClick={() => roll('disadvantage')}
        title={warned ? `Desvantagem por ${disadvantageFrom.join(', ')}` : 'Dois d20, fica o menor'}
        aria-label="Rolar d20 com desvantagem"
        className={cn(MODE_KEY, warned && 'border-[var(--destructive)] bg-[color-mix(in_oklch,var(--destructive),transparent_86%)] text-[var(--destructive)]')}>
        <span aria-hidden className="text-[16px]">↓</span>Desv.
      </Button>
    </>
  )
}

/** The solid d20 of the Figma's tray keys, dark on the cyan and on the ember. */
function D20Icon() {
  return <Image src="/dice/d20-solid.svg" alt="" aria-hidden width={30} height={30} />
}

/**
 * The desktop sheet's rolls and dice, folded into one key in the bottom-right
 * corner (Figma 353:4540): the cyan d20.
 *
 * Pressed, it opens a side sheet over a scrim (Figma 353:3505): the rolls as a
 * chat, newest at the foot, then the dice. The close key lands exactly where
 * the cyan one was, so the same spot opens and closes the tray. The ember d20
 * swaps the other dice for its own panel (modifier, DC, Fortuna; normal,
 * advantage, disadvantage) in the same cells.
 *
 * Closed, a fresh roll stands over the key for a moment (with what it still
 * offers: the damage, the Fortuna), and pressing it opens the tray. What the
 * table is waiting on from this sheet stands there too, for as long as it
 * waits.
 */
export function DiceTray({
  rolls, onRoll, luckTokens, onLuckChange, onSpendFortune, onRollDamage, damageRolled,
  disadvantageFrom = [], status, alerts, actions,
}: Props) {
  const [open, setOpen] = useState(false)
  const [d20Open, setD20Open] = useState(false)
  // The d20 panel's fields outlive the panel: the modifier for this sitting,
  // the DC across sittings (the last one used; in a dungeon it repeats).
  const [mod, setMod] = useState(0)
  const [dc, setDc, hydrateDc] = useStickyDc()
  const now = useNow(1000)
  const chatRef = useRef<HTMLDivElement>(null)
  const d20Ref = useRef<HTMLButtonElement>(null)

  const entries = entriesOf(rolls)
  const last = entries[entries.length - 1]
  const latest = rolls[0]

  // The chat reads from the foot: every new roll, and every opening, lands there.
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const el = chatRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
    return () => cancelAnimationFrame(id)
  }, [open, latest?.id, status])

  const offers = last && latest && (
    <RollOffers
      entry={last}
      latest={latest}
      now={now}
      luckTokens={luckTokens}
      onSpendFortune={onSpendFortune}
      onRollDamage={onRollDamage}
      damageRolled={damageRolled}
    />
  )

  // An attack whose damage is still to roll stays up longer: the table is
  // waiting on the Mestre to say whether it hit.
  const pendingDamage = last && !last.chained && offersDamage(last.roll) && !damageRolled.has(last.roll.id)
  const fresh = latest && now - latest.timestamp < (pendingDamage ? FOLLOW_UP_MS : ROLL_FRESH_MS)

  function setTray(next: boolean) {
    setOpen(next)
    if (!next) setD20Open(false)
  }

  return (
    <>
      {/* Closed: the key, and what stands over it. */}
      <div className="dice-tray-dock">
        {!open && (
          // Not a live region: the sheet's LiveAnnouncer already reads the newest roll out.
          <div className="dice-tray-peek">
            <div className="dice-tray__status">{alerts}</div>
            <AnimatePresence initial={false}>
              {fresh && last && (
                <motion.div
                  key={latest.id}
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={DICE_SPRING.panel}
                >
                  <div className="relative">
                    <EntryCards entry={last} />
                    <button
                      type="button"
                      onClick={() => setTray(true)}
                      aria-label="Abrir as rolagens"
                      title="Abrir as rolagens"
                      className="absolute inset-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                    />
                  </div>
                  {offers}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="dice-tray-shell">
          <Button
            type="button"
            variant="spirit"
            render={<motion.button whileTap={{ scale: 0.92 }} transition={DICE_SPRING.tap} />}
            onClick={() => setTray(true)}
            title="Rolagens e dados"
            aria-label="Abrir bandeja de dados"
            aria-haspopup="dialog"
            aria-expanded={open}
            className="size-16 min-h-0 p-2"
          >
            <D20Icon />
          </Button>
        </div>
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={setTray}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="dice-tray-scrim" />
          <DialogPrimitive.Popup className="dice-tray" initialFocus={d20Ref}>
            <DialogPrimitive.Title className="sr-only">Rolagens e dados</DialogPrimitive.Title>

            <div ref={chatRef} className="dice-tray__chat" aria-label="Rolagens">
              <div className="dice-tray__feed">
                {entries.length === 0 && (
                  <p className="font-body m-0 text-[11px] leading-snug text-[var(--muted-foreground)] italic">
                    Nenhuma rolagem ainda.
                  </p>
                )}
                {entries.map(entry => (
                  <div key={entry.roll.id} className="flex flex-col gap-2">
                    <EntryCards entry={entry} />
                    {entry === last && offers}
                  </div>
                ))}
                <div className="dice-tray__status">{status}</div>
              </div>
            </div>

            {actions && <div className="dice-tray__actions">{actions}</div>}

            {d20Open && disadvantageFrom.length > 0 && (
              <p className="font-body m-0 text-[10px] leading-tight text-[var(--destructive)] italic">
                ↓ Desvantagem por {disadvantageFrom.join(', ')}
              </p>
            )}

            <div className="dice-tray__keys">
              {d20Open ? (
                <D20Options
                  onRoll={onRoll}
                  disadvantageFrom={disadvantageFrom}
                  luckTokens={luckTokens}
                  onLuckChange={onLuckChange}
                  mod={mod}
                  setMod={setMod}
                  dc={dc}
                  setDc={setDc}
                  onDone={() => setD20Open(false)}
                />
              ) : (
                <DiceKeys onRoll={onRoll} />
              )}

              <Button
                ref={d20Ref}
                type="button"
                render={<motion.button {...DICE_TAP} />}
                onClick={() => {
                  if (!d20Open) hydrateDc()
                  setD20Open(!d20Open)
                }}
                title={d20Open ? 'Voltar aos dados' : 'd20: modos, CD e modificador'}
                aria-label={d20Open ? 'Fechar o painel do d20' : 'Abrir o painel do d20'}
                aria-pressed={d20Open}
                className={cn(
                  'dice-tray__d20 size-full min-h-0 min-w-0 p-2',
                  'border-2 border-[var(--border-frame)] bg-[var(--ember)] hover:bg-[var(--ember)]/85',
                  d20Open && 'outline-2 outline-offset-2 outline-[var(--ember)]',
                )}
              >
                <D20Icon />
              </Button>

              <DialogPrimitive.Close
                render={
                  <button
                    type="button"
                    title="Fechar"
                    aria-label="Fechar bandeja de dados"
                    className={cn(
                      'dice-tray__close flex size-full items-center justify-center bg-muted',
                      'font-mono text-[32px] leading-none font-bold text-[var(--destructive)]',
                      'transition-colors hover:bg-[var(--bg-raised)]',
                      'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                    )}
                  />
                }
              >
                ✕
              </DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
