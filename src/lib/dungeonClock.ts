/**
 * O relógio da masmorra.
 *
 * A luz é derivada do tempo decorrido (ver `lib/light`), e é isso que dá ao
 * Mestre um instrumento em vez de um cronômetro: mexer no relógio da mesa move
 * a tocha de todo mundo de uma vez, sem tocar em ficha nenhuma.
 *
 * O relógio da mesa é o de parede com dois ajustes:
 *
 *   pausa    — enquanto `pausedAt` estiver preenchido o tempo fica parado onde
 *              estava. Toda mesa faz intervalo para pizza, e a tocha não devia
 *              queimar durante ele.
 *   deslocamento — o quanto a mesa corre à frente do relógio de parede.
 *              Negativo depois de uma pausa (o tempo parado não conta) e
 *              positivo depois de um turno de exploração (dez minutos que
 *              passaram de propósito).
 *
 * `litAt` continua sendo hora de parede: o ajuste vive no leitor, não no item,
 * então uma tocha continua fazendo sentido fora de qualquer mesa.
 */
export interface TableClock {
  pausedAt: string | null
  shiftSeconds: number
}

/** Que horas são para esta mesa. Sem mesa, são as horas de sempre. */
export function tableNow(clock: TableClock | null | undefined, now: number = Date.now()): number {
  if (!clock) return now
  const base = clock.pausedAt ? new Date(clock.pausedAt).getTime() : now
  if (!Number.isFinite(base)) return now
  return base + clock.shiftSeconds * 1000
}

/**
 * O deslocamento que faz retomar não dar salto: o tempo em que a mesa esteve
 * parada é descontado, então a tocha volta com os mesmos minutos com que parou.
 */
export function resumeShift(clock: TableClock, now: number = Date.now()): number {
  if (!clock.pausedAt) return clock.shiftSeconds
  const pausedForMs = Math.max(0, now - new Date(clock.pausedAt).getTime())
  return clock.shiftSeconds - Math.round(pausedForMs / 1000)
}

/** Um turno de exploração: dez minutos que a mesa gastou de propósito. */
export const EXPLORATION_TURN_MINUTES = 10

/** Adianta o relógio da mesa — a luz de todo mundo queima junto. */
export function advancedShift(clock: TableClock, minutes: number): number {
  return clock.shiftSeconds + minutes * 60
}
