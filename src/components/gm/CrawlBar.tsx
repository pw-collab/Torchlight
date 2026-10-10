'use client'

import { useState, useSyncExternalStore } from 'react'
import {
  DANGER_LEVELS,
  checkDue,
  dangerOf,
  describeCheck,
  rollEncounterCheck,
  roundsToCheck,
  type DangerLevel,
  type EncounterCheck,
} from '@/lib/crawl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  sessionId: string
  /** O melhor modificador de CAR da mesa — quem costuma falar pelo grupo. */
  chaMod: number
  /** Grava a checagem no log, escondida da mesa. */
  onCheck: (text: string) => void
}

const PILL =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase'

// ─── A contagem, lembrada por mesa ────────────────────────────────────────────
//
// O perigo e a rodada são caderno do Mestre, não estado do jogo: ficam no
// navegador dele, por sessão. O armazenamento pode não existir (aba privada,
// permissão negada) — aí a memória do módulo segura enquanto a página viver.

interface CrawlState {
  danger: DangerLevel
  round: number
}

const DEFAULT_STATE: CrawlState = { danger: 'unsafe', round: 0 }
const memory = new Map<string, string>()
const listeners = new Set<() => void>()

function storageKey(sessionId: string) {
  return `torchlight:crawl:${sessionId}`
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null
  } catch {
    return memory.get(key) ?? null
  }
}

function writeRaw(key: string, value: string) {
  memory.set(key, value)
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Fica só na memória.
  }
  listeners.forEach(fn => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

function parse(raw: string | null): CrawlState {
  if (!raw) return DEFAULT_STATE
  try {
    const value = JSON.parse(raw) as Partial<CrawlState>
    const danger = DANGER_LEVELS.some(d => d.id === value.danger) ? (value.danger as DangerLevel) : DEFAULT_STATE.danger
    const round = typeof value.round === 'number' && value.round >= 0 ? Math.floor(value.round) : 0
    return { danger, round }
  } catch {
    return DEFAULT_STATE
  }
}

/**
 * A exploração, do lado do Mestre.
 *
 * O relógio da masmorra cuida da luz; esta barra cuida do resto do ritmo: em
 * que perigo a mesa está, quantas rodadas de exploração já passaram, e a
 * checagem de encontro que o perigo pede. Avançar a rodada rola a checagem
 * sozinho quando chega a hora; o botão de checar fica para o barulho, a
 * demora, a porta arrombada.
 */
export function CrawlBar({ sessionId, chaMod, onCheck }: Props) {
  const key = storageKey(sessionId)
  // O servidor não tem armazenamento: renderiza o padrão, e o navegador lê o
  // que estava guardado na hidratação, sem o campo mudar sozinho depois.
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null)
  const state = parse(raw)
  const [last, setLast] = useState<{ check: EncounterCheck; round: number | null } | null>(null)

  const save = (next: CrawlState) => writeRaw(key, JSON.stringify(next))

  function check(round: number | null) {
    const result = rollEncounterCheck(chaMod)
    setLast({ check: result, round })
    onCheck(describeCheck(result, round))
  }

  function nextRound() {
    const round = state.round + 1
    save({ ...state, round })
    if (checkDue(round, state.danger)) check(round)
  }

  const danger = dangerOf(state.danger)
  const left = roundsToCheck(state.round, state.danger)
  const found = last?.check.encounter === true

  return (
    <div
      className="flex flex-col gap-2 px-3 py-2"
      // Longhands only: the colour flips when something turns up, and React
      // warns when a shorthand border changes under a longhand one.
      style={{
        background: 'var(--card)',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 3,
        borderColor: found ? 'var(--destructive)' : 'var(--border)',
        borderLeftColor: found ? 'var(--destructive)' : 'var(--muted-foreground)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="text-[13px] leading-none">🗝</span>
          <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
            Exploração · rodada {state.round}
          </span>
        </span>

        <span
          className="font-mono text-[8.5px] text-[var(--muted-foreground)]"
          title={`${danger.label}: uma checagem a cada ${danger.every} rodada${danger.every === 1 ? '' : 's'}`}
        >
          {left === danger.every && state.round > 0 ? 'checou agora' : `checa em ${left}`}
        </span>

        <span className="flex items-center gap-1" role="group" aria-label="Nível de perigo">
          {DANGER_LEVELS.map(level => (
            <Button
              key={level.id}
              type="button"
              variant="outline"
              aria-pressed={state.danger === level.id}
              onClick={() => save({ ...state, danger: level.id })}
              title={`Checagem a cada ${level.every} rodada${level.every === 1 ? '' : 's'}`}
              className={cn(
                'font-heading h-7 min-h-7 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase',
                state.danger === level.id
                  ? 'border-[var(--primary)] text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)]',
              )}
            >
              {level.label}
            </Button>
          ))}
        </span>

        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { save({ ...state, round: 0 }); setLast(null) }}
            disabled={state.round === 0}
            title="Zerar a contagem — uma área nova, um descanso"
            className="h-8 min-h-8 px-1.5 text-[11px] text-[var(--muted-foreground)] disabled:opacity-30"
          >
            ↺
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => check(null)}
            title="Barulho, demora, porta arrombada: rolar a checagem agora"
            className={PILL}
          >
            🎲 Checar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={nextRound}
            title="Passar uma rodada de exploração — a checagem rola sozinha quando o perigo pede"
            className={cn(PILL, 'border-[var(--primary)]')}
          >
            ▸ Rodada
          </Button>
        </span>
      </div>

      {last && (
        <p
          className="font-body m-0 text-[11px] leading-snug italic"
          style={{ color: found ? 'var(--destructive)' : 'var(--muted-foreground)' }}
        >
          {found ? (
            <>
              <span className="font-heading not-italic tracking-[0.08em]">Algo se aproxima!</span>{' '}
              {last.check.distance?.label} · {last.check.activity?.label} ·{' '}
              <span className="not-italic">{last.check.reaction?.label}</span>
              <span className="font-mono not-italic text-[9px] text-[var(--muted-foreground)]">
                {' '}(d6 {last.check.distance?.roll} · 2d6 {last.check.activity?.roll} · reação {last.check.reaction?.total})
              </span>
            </>
          ) : (
            <>d6 {last.check.die}: nada se aproxima{last.round ? ` na rodada ${last.round}` : ''}.</>
          )}
        </p>
      )}
    </div>
  )
}
