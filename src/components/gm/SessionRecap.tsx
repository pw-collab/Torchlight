'use client'

import { useMemo, useState } from 'react'
import type { SessionEvent } from '@/types/session.types'
import { buildRecap, durationLabel, formatRecap } from '@/lib/recap'
import { publishRecap } from '@/lib/discord'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  sessionId: string
  sessionName: string
  events: SessionEvent[]
  onClose: () => void
}

const PILL =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase'

/** Uma linha do resumo. Some quando não há o que contar. */
function Line({ glyph, children }: { glyph: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span aria-hidden className="shrink-0 text-[11px] opacity-80">{glyph}</span>
      <span className="font-body text-[12px] leading-relaxed text-[var(--foreground)]">{children}</span>
    </div>
  )
}

/**
 * O que aconteceu na sessão (§5.11).
 *
 * Tudo aqui sai do log — nada é escrito à parte para alimentar o recap. É o
 * material com que o Mestre abre a próxima sessão, e o que ele cola no canal
 * da campanha quando a mesa se despede.
 */
export function SessionRecap({ sessionId, sessionName, events, onClose }: Props) {
  const recap = useMemo(() => buildRecap(events, sessionName), [events, sessionName])
  const [copied, setCopied] = useState(false)
  const [published, setPublished] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle')

  const empty =
    recap.rolls === 0 &&
    recap.cast.length === 0 &&
    recap.encounters.length === 0 &&
    recap.xp.length === 0

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatRecap(recap))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Sem permissão de área de transferência o texto continua na tela.
    }
  }

  async function publish() {
    setPublished('sending')
    // O texto vai do servidor, não daqui: o que a mesa publica é o log lido lá.
    const ok = await publishRecap(sessionId)
    setPublished(ok ? 'done' : 'failed')
  }

  return (
    <div
      className="worn-border animate-ink-spread flex flex-col gap-3 p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--primary)' }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-heading text-[11px] tracking-[0.14em] text-[var(--foreground)] uppercase">
          📜 {recap.sessionName}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-body text-[11px] text-[var(--muted-foreground)] italic">
            {durationLabel(recap.minutes)} de mesa
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Fechar o recap"
            className="font-mono text-xs text-[var(--muted-foreground)]"
          >
            ✕
          </Button>
        </div>
      </div>

      {empty ? (
        <p className="font-body text-[12px] leading-relaxed text-[var(--muted-foreground)] italic">
          Ainda não há o que contar desta sessão. O recap se escreve sozinho conforme
          a mesa joga.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {recap.cast.length > 0 && <Line glyph="⚔">{recap.cast.join(', ')}</Line>}
          {recap.encounters.length > 0 && <Line glyph="🐗">{recap.encounters.join(' · ')}</Line>}

          {recap.criticals.map((crit, i) => (
            <Line key={`c${i}`} glyph="✨">
              <span className="text-[var(--chart-1)]">{crit.who}</span> — {crit.label} ({crit.total})
            </Line>
          ))}
          {recap.fumbles.map((fumble, i) => (
            <Line key={`f${i}`} glyph="💀">
              <span className="text-[var(--destructive)]">{fumble.who}</span> — {fumble.label} ({fumble.total})
            </Line>
          ))}

          {recap.downs.length > 0 && (
            <Line glyph="🩸">Caíram: {recap.downs.join(', ')}</Line>
          )}
          {recap.xp.length > 0 && (
            <Line glyph="△">{recap.xp.map(x => `${x.who} +${x.gained}`).join(', ')}</Line>
          )}
          {recap.torchMinutes > 0 && (
            <Line glyph="🔥">{recap.torchMinutes} minutos de luz queimados</Line>
          )}
          {recap.handouts.length > 0 && (
            <Line glyph="📖">{recap.handouts.join(' · ')}</Line>
          )}
          {recap.rolls > 0 && (
            <Line glyph="🎲">{recap.rolls} rolagens</Line>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          onClick={() => void copy()}
          disabled={empty}
          className={cn(PILL, 'border-[var(--border)] disabled:opacity-30')}
        >
          {copied ? '✓ Copiado' : '⧉ Copiar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void publish()}
          disabled={empty || published === 'sending' || published === 'done'}
          title="Manda o resumo para o canal da campanha"
          className={cn(PILL, 'border-[var(--primary)] disabled:opacity-30')}
        >
          {published === 'sending'
            ? 'Publicando…'
            : published === 'done'
              ? '✓ No canal'
              : published === 'failed'
                ? '↻ Tentar de novo'
                : '↗ Publicar no Discord'}
        </Button>
        {published === 'failed' && (
          <span className="font-body text-[11px] text-[var(--destructive)] italic">
            O canal não recebeu. O texto continua aqui — dá para copiar.
          </span>
        )}
      </div>
    </div>
  )
}
