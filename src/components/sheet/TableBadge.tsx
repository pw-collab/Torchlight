'use client'

import { useState } from 'react'
import type { TableSession } from '@/types/session.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props {
  session: TableSession | null
  loading: boolean
  busy: boolean
  error: string | null
  onJoin: (code: string) => Promise<boolean>
  onLeave: () => Promise<void>
  /** Verde quando o Mestre está do outro lado — a mesa está de pé agora. */
  gmPresent: boolean
}

const CAPTION =
  'font-body text-muted-foreground text-[10px] leading-snug italic'

/**
 * A mesa, no topo da ficha.
 *
 * Um personagem sobrevive a várias sessões, então estar numa mesa é algo que
 * ele faz, não algo que ele é: entra-se pelo código de seis caracteres que o
 * Mestre lê em voz alta, e sai-se pelo mesmo lugar. Enquanto está na mesa, o
 * que acontece na ficha — rolagens, dano, luz — chega ao painel do Mestre.
 */
export function TableBadge({ session, loading, busy, error, onJoin, onLeave, gmPresent }: Props) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')

  if (loading) return null

  async function submit() {
    const ok = await onJoin(code)
    if (ok) {
      setCode('')
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            title={session ? `Na mesa: ${session.name}` : 'Entrar em uma mesa'}
            className={cn(
              'font-heading h-9 min-h-9 gap-1.5 rounded-[1px] px-2.5 text-[9px] tracking-[0.14em] uppercase',
              session
                ? 'border-[var(--chart-2)] bg-[var(--card)] text-[var(--foreground)]'
                : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
            )}
          >
            {session ? (
              <>
                <span
                  aria-hidden
                  className={cn('size-1.5 shrink-0 rounded-full', gmPresent && 'animate-pulse')}
                  style={{
                    background: gmPresent ? 'var(--chart-2)' : 'var(--muted-foreground)',
                    boxShadow: gmPresent ? '0 0 6px var(--chart-2)' : 'none',
                  }}
                />
                <span className="max-w-[14ch] truncate">{session.name}</span>
              </>
            ) : (
              <>⚔ Entrar na mesa</>
            )}
          </Button>
        }
      />

      <PopoverContent align="end" className="w-[280px]">
        {session ? (
          <>
            <PopoverHeader>
              <PopoverTitle>{session.name}</PopoverTitle>
            </PopoverHeader>

            <div className="flex flex-col gap-3 p-3.5 pt-0">
              <p className={CAPTION}>
                {gmPresent
                  ? 'O Mestre está na mesa. O que acontecer aqui aparece no painel dele.'
                  : 'O Mestre não está conectado agora — o que acontecer fica registrado mesmo assim.'}
              </p>

              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-muted-foreground text-[8px] tracking-[0.16em] uppercase">
                  Código
                </span>
                <span className="font-mono text-[15px] tracking-[0.3em] text-[var(--foreground)]">
                  {session.code}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={async () => { await onLeave(); setOpen(false) }}
                disabled={busy}
                className="font-heading h-10 rounded-[1px] border-[var(--destructive)] text-[10px] tracking-[0.14em] text-[var(--destructive)] uppercase"
              >
                Sair da mesa
              </Button>
            </div>
          </>
        ) : (
          <>
            <PopoverHeader>
              <PopoverTitle>Entrar na mesa</PopoverTitle>
            </PopoverHeader>

            <div className="flex flex-col gap-3 p-3.5 pt-0">
              <p className={CAPTION}>
                O Mestre abre a sessão e diz o código de seis caracteres.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="table-code" className="font-heading text-muted-foreground text-[8px] tracking-[0.16em] uppercase">
                  Código da sessão
                </Label>
                <Input
                  id="table-code"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={e => { if (e.key === 'Enter') void submit() }}
                  placeholder="ABC123"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="font-mono border-border bg-secondary h-11 text-center text-base tracking-[0.3em]"
                />
              </div>

              {error && (
                <p className="font-body text-[10px] leading-snug text-[var(--destructive)] italic">
                  {error}
                </p>
              )}

              <Button
                type="button"
                variant="hollow"
                onClick={() => void submit()}
                disabled={busy || code.trim().length < 6}
                className="font-heading bg-primary text-primary-foreground h-11 text-[11px] font-bold tracking-[0.14em] uppercase disabled:opacity-35"
              >
                {busy ? 'Entrando…' : 'Entrar'}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
