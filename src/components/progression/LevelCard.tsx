'use client'

import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FavouriteIcon, SparklesIcon, SquareLock01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import type { Class } from '@/types/class.types'
import type { LevelEntry } from '@/types/progression.types'
import type { LevelRewardKind, LevelState } from '@/lib/progression'
import { MAX_LEVEL, MIN_LEVEL } from '@/lib/progression'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Props {
  state: LevelState
  classData: Class | undefined
  /** Only shown as context on level 1 — it is baked into the base HP, not per level. */
  conMod: number
  /** Character's HP maximum *after* everything sealed so far. */
  hpMax: number
  xp: number
  xpNeeded: number
  characterLevel: number
  /** Which action is in flight, if any. */
  busy: LevelRewardKind | 'level' | null
  onRoll: (kind: LevelRewardKind) => void
  onUndo: (kind: LevelRewardKind) => void
  onAdvance: () => void
  onRegress: () => void
}

/**
 * The card in the middle of the Progresso tab: everything the selected level
 * grants, plus the controls that resolve it. Every level-up rolls the class hit
 * die for HP; odd levels also roll 2d6 on the class talent table, so an odd
 * level shows two sections and is only finished once both have landed.
 */
export function LevelCard({
  state,
  classData,
  conMod,
  hpMax,
  xp,
  xpNeeded,
  characterLevel,
  busy,
  onRoll,
  onUndo,
  onAdvance,
  onRegress,
}: Props) {
  const { level, rewards, done, status, isCurrent, entry } = state

  const locked = status === 'locked'
  const sealed = status === 'sealed'
  const xpPct = xpNeeded > 0 ? Math.min(100, Math.round((xp / xpNeeded) * 100)) : 100

  const headline = sealed ? 'CONCLUÍDO' : locked ? 'BLOQUEADO' : isCurrent ? 'EM CURSO' : 'PENDENTE'

  return (
    <div className="animate-ink-spread flex w-full max-w-[520px] flex-col">
      {/* ── Header strip ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center justify-between border border-b-0 px-3 py-1.5',
          isCurrent && !sealed
            ? 'bg-destructive border-[var(--bone-dim)]'
            : 'bg-secondary border-[var(--border)]',
        )}
      >
        <span
          className={cn(
            'font-mono text-[8px] tracking-[0.18em]',
            isCurrent && !sealed ? 'text-background' : 'text-[var(--muted-foreground)]',
          )}
        >
          {headline} / NÍVEL {level}
        </span>
        <span
          className={cn(
            'font-mono text-[8px] tracking-[0.12em]',
            isCurrent && !sealed ? 'text-background/70' : 'text-[var(--muted-foreground)]',
          )}
        >
          {`// ${level}`}
        </span>
      </div>

      {/* ── Card face ────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col gap-4 border p-4 sm:p-5',
          locked ? 'bg-secondary/50 border-[var(--border)]' : 'bg-card border-[var(--border)]',
        )}
      >
        {/* Numeral + what this level hands out */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  'font-heading text-[56px] leading-[0.85] font-black sm:text-[68px]',
                  locked ? 'text-[var(--muted-foreground)]' : 'text-[var(--foreground)]',
                )}
              >
                {level}
              </span>
              <span className="font-mono text-[9px] tracking-[0.14em] text-[var(--muted-foreground)]">
                / NVL
              </span>
            </div>
            <span className="mt-1.5 h-px w-16 bg-[var(--bone-dim)]/50" />
            <div className="font-mono mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] tracking-[0.14em] text-[var(--bone-dim)]">
              {rewards.map(kind => (
                <span key={kind} className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={kind === 'hp' ? FavouriteIcon : SparklesIcon}
                    size={12}
                    strokeWidth={2}
                  />
                  {kind === 'hp' ? 'VITALIDADE' : 'TALENTO'}
                </span>
              ))}
            </div>
          </div>

          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center border',
              sealed
                ? 'border-[var(--chart-1)] bg-[var(--chart-2)]/20 text-[var(--chart-1)]'
                : locked
                  ? 'border-[var(--border)] text-[var(--muted-foreground)]'
                  : 'border-[var(--destructive)] text-[var(--destructive)]',
            )}
          >
            {sealed ? (
              <HugeiconsIcon icon={Tick02Icon} size={22} strokeWidth={2.4} />
            ) : locked ? (
              <HugeiconsIcon icon={SquareLock01Icon} size={20} strokeWidth={2} />
            ) : (
              <span className="font-mono text-[11px] leading-none font-bold">
                {done.length}/{rewards.length}
              </span>
            )}
          </div>
        </div>

        {/* Where the base HP — and its one CON modifier — actually came from */}
        {level === MIN_LEVEL && (
          <p className="font-mono border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2 text-[8.5px] leading-relaxed tracking-[0.06em] text-[var(--muted-foreground)]">
            ✦ O PV base ({hpMax > 0 ? `atual ${hpMax}` : '—'}) vem da criação: dado de vida{' '}
            {classData ? `d${classData.hitDie}` : ''} + CON {conMod >= 0 ? `+${conMod}` : conMod}. É a
            única vez que o modificador de CON entra — os níveis seguintes somam só o dado.
          </p>
        )}

        {rewards.map((kind, i) => (
          <RewardSection
            key={kind}
            kind={kind}
            withDivider={i > 0}
            level={level}
            classData={classData}
            hpMax={hpMax}
            entry={entry}
            resolved={done.includes(kind)}
            locked={locked}
            busy={busy}
            onRoll={onRoll}
            onUndo={onUndo}
          />
        ))}

        {locked && (
          <p className="font-mono text-[9px] tracking-[0.1em] text-[var(--muted-foreground)]">
            ✦ Alcance o nível {level} para desbloquear {rewards.length > 1 ? 'estas recompensas' : 'esta recompensa'}.
          </p>
        )}
      </div>

      {/* ── Footer strip: XP toward the next level + advance controls ─── */}
      <div className="bg-secondary flex flex-col gap-2 border border-t-0 border-[var(--border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono shrink-0 text-[8px] tracking-[0.14em] text-[var(--muted-foreground)]">
            XP
          </span>
          <Progress value={xpPct} className="min-w-0 flex-1 gap-0" aria-label="Progresso de XP">
            <ProgressTrack className="h-[3px] bg-black/35">
              <ProgressIndicator
                className={cn(
                  'transition-[width] duration-[400ms] ease-[var(--ease-ritual)]',
                  xpPct >= 100 ? 'bg-[var(--chart-1)]' : 'bg-[var(--destructive)]',
                )}
              />
            </ProgressTrack>
          </Progress>
          <span className="font-mono shrink-0 text-[8px] tracking-[0.1em] text-[var(--muted-foreground)]">
            {xp} / {xpNeeded} · NVL {characterLevel}
          </span>
        </div>

        {isCurrent && (
          <div className="flex gap-1.5">
            {characterLevel > MIN_LEVEL && !sealed && (
              <Button
                variant="ghost"
                onClick={onRegress}
                disabled={busy !== null}
                className="font-heading h-auto flex-1 px-3 py-2 text-[8px] tracking-[0.14em] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                ← Nível {characterLevel - 1}
              </Button>
            )}
            {characterLevel < MAX_LEVEL && (
              <Button
                variant="outline"
                onClick={onAdvance}
                disabled={busy !== null || !sealed}
                title={sealed ? undefined : 'Resolva as recompensas deste nível antes de avançar'}
                className={cn(
                  'font-heading h-auto flex-[2] px-3 py-2 text-[8px] tracking-[0.16em] transition-all duration-200',
                  sealed && busy === null
                    ? 'border-[var(--chart-1)] bg-[var(--chart-2)]/20 text-[var(--foreground)] shadow-[0_0_10px_color-mix(in_oklch,var(--chart-1),transparent_80%)]'
                    : 'cursor-not-allowed border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
                )}
              >
                ✦ Subir para o nível {characterLevel + 1} →
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface SectionProps {
  kind: LevelRewardKind
  /** Rules sit *between* sections, so the first one on a card goes without. */
  withDivider: boolean
  level: number
  classData: Class | undefined
  hpMax: number
  entry: LevelEntry | undefined
  resolved: boolean
  locked: boolean
  busy: LevelRewardKind | 'level' | null
  onRoll: (kind: LevelRewardKind) => void
  onUndo: (kind: LevelRewardKind) => void
}

/** One reward of a level: its explanation, its roll, and its receipt once rolled. */
function RewardSection({
  kind,
  withDivider,
  level,
  classData,
  hpMax,
  entry,
  resolved,
  locked,
  busy,
  onRoll,
  onUndo,
}: SectionProps) {
  const [tableOpen, setTableOpen] = useState(false)
  const isHp = kind === 'hp'
  const rolling = busy === kind

  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        withDivider && 'border-t border-[var(--border)] pt-4',
      )}
    >
      <p className="font-sans text-[13px] leading-snug text-[var(--bone-muted)] italic">
        {isHp
          ? 'Todo nível — role o dado de vida da classe e some o resultado ao PV máximo. O modificador de CON não entra de novo.'
          : `Nível ímpar — role 2d6 na tabela de talentos${classData ? ` de ${classData.name}` : ''} e receba o resultado.`}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {isHp ? (
          <>
            <StatTile label="Dado de Vida" value={classData ? `d${classData.hitDie}` : '—'} />
            <StatTile label="PV máximo" value={String(hpMax)} />
          </>
        ) : (
          <>
            <StatTile label="Rolagem" value="2d6" />
            <StatTile label="Tabela" value={classData?.name ?? '—'} />
          </>
        )}
      </div>

      {/* Talent table, on demand */}
      {!isHp && classData && (
        <Collapsible open={tableOpen} onOpenChange={setTableOpen} className="flex flex-col gap-2">
          <CollapsibleTrigger
            render={
              <Button
                variant="link"
                className="font-mono h-auto self-start p-0 text-[8px] tracking-[0.12em] text-[var(--muted-foreground)] no-underline"
              />
            }
          >
            {tableOpen ? '▲ ocultar tabela de talentos' : '▼ ver tabela de talentos'}
          </CollapsibleTrigger>

          <CollapsibleContent className="animate-ink-spread overflow-hidden border border-[var(--border)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary border-b-[var(--border)]">
                  <TableHead className="font-heading w-12 border-r border-[var(--border)] px-2.5 py-[5px] text-[7px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
                    2D6
                  </TableHead>
                  <TableHead className="font-heading px-2.5 py-[5px] text-[7px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
                    Efeito
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.talentTable.map((row, i) => {
                  const hit =
                    entry?.talentRoll != null &&
                    entry.talentRoll >= row.min &&
                    entry.talentRoll <= row.max
                  return (
                    <TableRow
                      key={row.roll}
                      data-state={hit ? 'selected' : undefined}
                      className={cn(
                        'border-b-[var(--border)] transition-colors duration-200',
                        hit ? 'bg-[var(--destructive)]/15' : i % 2 === 0 ? 'bg-secondary' : 'bg-transparent',
                      )}
                    >
                      <TableCell
                        className={cn(
                          'font-mono border-r border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold',
                          hit ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
                        )}
                      >
                        {row.roll}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'px-2.5 py-1.5 text-[10.5px] leading-snug italic',
                          hit ? 'text-[var(--parchment-light)]' : 'text-[var(--muted-foreground)]',
                        )}
                      >
                        {row.effect}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Collapsible>
      )}

      {resolved && entry && <RewardReceipt kind={kind} entry={entry} hpMax={hpMax} />}

      {!locked &&
        (resolved ? (
          <Button
            variant="outline"
            onClick={() => onUndo(kind)}
            disabled={busy !== null}
            className={cn(
              'font-heading h-auto w-full border-[var(--border)] bg-transparent px-4 py-3 text-[9px] tracking-[0.16em]',
              'text-[var(--muted-foreground)] hover:text-[var(--destructive)]',
              busy !== null && 'cursor-wait opacity-50',
            )}
          >
            ✕ Anular {isHp ? 'PV' : 'talento'} do nível {level}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => onRoll(kind)}
            disabled={busy !== null || !classData}
            className={cn(
              'font-heading h-auto w-full px-4 py-3.5 text-[11px] tracking-[0.18em] transition-all duration-200',
              busy !== null || !classData
                ? 'cursor-wait border-[var(--border)] bg-[var(--border)]/15 text-[var(--muted-foreground)]'
                : 'border-[var(--destructive)] bg-[var(--destructive)]/15 text-[var(--blood-bright)] shadow-[0_0_12px_color-mix(in_oklch,var(--destructive),transparent_75%)]',
            )}
          >
            {rolling
              ? '⟳ Rolando...'
              : !classData
                ? 'Classe não encontrada'
                : isHp
                  ? `✦ Rolar d${classData.hitDie} de PV`
                  : '✦ Rolar 2d6 na tabela'}
          </Button>
        ))}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary flex flex-col gap-1 border border-[var(--border)] px-3 py-2">
      <span className="font-heading text-[8px] tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
        {label}
      </span>
      <span className="font-heading truncate text-[18px] leading-none text-[var(--parchment-pale)]">
        {value}
      </span>
    </div>
  )
}

function RewardReceipt({
  kind,
  entry,
  hpMax,
}: {
  kind: LevelRewardKind
  entry: LevelEntry
  hpMax: number
}) {
  if (kind === 'hp') {
    return (
      <div className="flex flex-col gap-1 border border-[var(--chart-1)]/40 bg-[var(--chart-2)]/15 px-3 py-2.5">
        <span className="font-heading text-[8px] tracking-[0.2em] text-[var(--muted-foreground)] uppercase">
          PV ganhos
        </span>
        <span className="font-heading text-[28px] leading-none font-bold text-[var(--parchment-pale)]">
          +{entry.hpGain ?? 0}
        </span>
        <span className="font-mono text-[8.5px] text-[var(--muted-foreground)]">
          {entry.hpRoll} (d{entry.hpDie})
          {/* Entries from the first cut of the track still carry a per-level CON. */}
          {entry.conMod != null && ` ${entry.conMod >= 0 ? '+' : ''}${entry.conMod} (CON)`} → PV máximo{' '}
          {hpMax}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 border border-[var(--chart-1)]/40 bg-[var(--chart-2)]/15 px-3 py-2.5">
      <div className="shrink-0 text-center">
        <div className="font-heading text-[22px] leading-none font-bold text-[var(--chart-1)]">
          {entry.talentRoll}
        </div>
        <div className="font-mono mt-px text-[7.5px] text-[var(--muted-foreground)]">
          ({entry.talentDie1}+{entry.talentDie2})
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-[11.5px] leading-normal text-[var(--parchment-light)] italic">
          {entry.talentEffect}
        </span>
        <span className="font-mono text-[8px] text-[var(--chart-1)]">✦ Adicionado aos talentos</span>
      </div>
    </div>
  )
}
