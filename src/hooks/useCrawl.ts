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

export interface CrawlCheck {
  check: EncounterCheck
  round: number | null
}

/**
 * A exploração, do lado do Mestre.
 *
 * O relógio da masmorra cuida da luz; isto cuida do resto do ritmo: em que
 * perigo a mesa está, quantas rodadas de exploração já passaram, e a checagem
 * de encontro que o perigo pede. Avançar a rodada rola a checagem sozinho
 * quando chega a hora; checar à mão fica para o barulho, a demora, a porta
 * arrombada.
 *
 * `onCheck` recebe a frase para o log escondido do Mestre.
 */
export function useCrawl(sessionId: string, chaMod: number, onCheck: (text: string) => void) {
  const key = storageKey(sessionId)
  // O servidor não tem armazenamento: renderiza o padrão, e o navegador lê o
  // que estava guardado na hidratação, sem o campo mudar sozinho depois.
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null)
  const state = parse(raw)
  const [last, setLast] = useState<(CrawlCheck & { sessionId: string }) | null>(null)

  const save = (next: CrawlState) => writeRaw(key, JSON.stringify(next))

  function check(round: number | null) {
    const result = rollEncounterCheck(chaMod)
    setLast({ sessionId, check: result, round })
    onCheck(describeCheck(result, round))
  }

  function nextRound() {
    const round = state.round + 1
    save({ ...state, round })
    if (checkDue(round, state.danger)) check(round)
  }

  return {
    danger: state.danger,
    dangerLevel: dangerOf(state.danger),
    round: state.round,
    roundsToCheck: roundsToCheck(state.round, state.danger),
    /** A última checagem desta mesa, enquanto o Mestre não a dispensar. */
    last: last && last.sessionId === sessionId ? last : null,
    check: () => check(null),
    nextRound,
    reset: () => { save({ ...state, round: 0 }); setLast(null) },
    setDanger: (danger: DangerLevel) => save({ ...state, danger }),
    dismiss: () => setLast(null),
  }
}
