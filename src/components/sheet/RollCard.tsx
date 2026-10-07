'use client'

import type { RollResult } from '@/lib/dice'

/**
 * How long a roll stays fresh: on screen as a toast, and open to a Fortuna
 * reroll. The second chance belongs to the roll that just landed, while the
 * bad result is still in front of everyone — not to anything older.
 */
export const ROLL_FRESH_MS = 15_000

/** The colours a roll is shown in: gold for a critical, red for a fumble. */
export function rollTone(roll: RollResult) {
  const accent = roll.isCritical ? 'var(--chart-1)' : roll.isFumble ? 'var(--destructive)' : null
  return {
    border: accent ?? 'var(--border)',
    background: accent
      ? `linear-gradient(148deg, ${accent} 0%, var(--card) 100%), var(--card)`
      : 'var(--card)',
    shadow: accent
      ? `0 4px 20px ${accent}, 0 2px 12px rgba(0,0,0,0.6)`
      : '0 2px 12px rgba(0,0,0,0.6)',
    number: accent ?? 'var(--foreground)',
    label: accent ?? 'var(--muted-foreground)',
  }
}

interface Props {
  roll: RollResult
  /**
   * Spends a Fortuna token and rolls again (§5.2). Passed only while the
   * offer stands — the newest roll, still fresh, with a token left.
   */
  onSpendFortune?: () => void
  fortuneLeft?: number
  /** The dock's history is narrower than a toast: the total a step smaller. */
  compact?: boolean
}

/**
 * What a settled roll says, read the same wherever it shows — the toast on
 * phones, the history in the desktop dock: the label and the time, how it was
 * rolled, the total, the verdict against the DC, the total a Fortuna reroll
 * left behind, the advantage pair, and the offer to spend Fortuna.
 *
 * The box around it (border, background, shadow) belongs to the caller, read
 * off `rollTone`.
 */
export function RollCard({ roll, onSpendFortune, fortuneLeft = 0, compact }: Props) {
  const tone = rollTone(roll)

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: tone.label,
          minWidth: 0,
        }}>
          {roll.label}
          {roll.isCritical && ' ✦'}
          {roll.isFumble && ' ☠'}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          color: 'var(--muted-foreground)',
          flexShrink: 0,
        }}>
          {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          {roll.subLabel && (
            <div style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 11,
              color: 'var(--muted-foreground)',
              marginBottom: 2,
            }}>
              {roll.subLabel}
            </div>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--muted-foreground)',
          }}>
            {roll.die}
            {roll.modifier !== undefined && roll.modifier !== 0
              ? (roll.modifier > 0 ? ` +${roll.modifier}` : ` ${roll.modifier}`)
              : ''}
          </span>
        </div>

        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: compact ? 22 : 28,
          fontWeight: 700,
          color: tone.number,
          lineHeight: 1,
          flexShrink: 0,
          textShadow: roll.isCritical ? '0 0 10px var(--chart-1)' : 'none',
        }}>
          {roll.total}
        </span>
      </div>

      {/* Verdict — the DC the roll was made against, already compared.
          The field existed on the roller for months without anything
          reading it; the player was left doing the arithmetic. */}
      {roll.dc !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: roll.success ? 'var(--chart-2)' : 'var(--destructive)',
          }}>
            {roll.success ? '✔ Sucesso' : '✖ Falha'}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--muted-foreground)',
          }}>
            vs DC {roll.dc}
          </span>
        </div>
      )}

      {/* O total que a Fortuna deixou para trás, lado a lado com o novo. */}
      {roll.rerollOf !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 8,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--chart-1)',
          }}>
            ✦ Rerrolado
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--muted-foreground)',
            textDecoration: 'line-through',
            opacity: 0.55,
          }}>
            {roll.rerollOf}
          </span>
        </div>
      )}

      {/* A Fortuna é regra de rerrolagem, não um contador: o momento de
          gastá-la é agora, com o resultado ruim ainda na tela. */}
      {onSpendFortune && (
        <button
          type="button"
          onClick={onSpendFortune}
          title={`Gastar um token de Fortuna e rolar de novo (${fortuneLeft} restante${fortuneLeft === 1 ? '' : 's'})`}
          style={{
            marginTop: 8,
            width: '100%',
            cursor: 'pointer',
            background: 'color-mix(in oklch, var(--chart-1), transparent 88%)',
            border: '1px solid var(--chart-1)',
            color: 'var(--chart-1)',
            fontFamily: 'var(--font-heading)',
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '7px 8px',
            minHeight: 32,
          }}
        >
          ✦ Gastar Fortuna
        </button>
      )}

      {roll.advantage && roll.rolls && roll.rolls.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 8,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: roll.advantage === 'advantage' ? 'var(--chart-2)' : 'var(--destructive)',
          }}>
            {roll.advantage === 'advantage' ? 'Vantagem' : 'Desvantagem'}
          </span>
          {roll.rolls.map((r, idx) => {
            const kept = r === roll.result
            return (
              <span
                key={idx}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: kept ? 700 : 400,
                  color: kept ? 'var(--foreground)' : 'var(--muted-foreground)',
                  textDecoration: kept ? 'none' : 'line-through',
                  opacity: kept ? 1 : 0.55,
                }}
              >
                {r}
              </span>
            )
          })}
        </div>
      )}
    </>
  )
}
