'use client'

import { ancestries } from '@/data/ancestries/index'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  ancestryId: string
  onNameChange: (name: string) => void
  onAncestryChange: (id: string) => void
}

const ANCESTRY_FLAVOR: Record<string, string> = {
  human:      'Ambiciosos e adaptáveis, os humanos prosperam em qualquer domínio das Terras das Névoas.',
  elf:        'Antiquíssimos e distantes, os elfos guardam segredos que antecedem as próprias trevas.',
  dwarf:      'Forjados em cavernas profundas, os anões carregam a pedra no sangue e a teimosia no espírito.',
  halfling:   'Pequenos e sorridentes mesmo diante do horror, os halflings sobrevivem pela sorte e pela astúcia.',
  resurrected:'Mortos que retornam sem memória, os Ressurretos carregam o estigma da morte como uma segunda pele.',
}

const STEP_LABEL_CLASS =
  'font-heading mb-2.5 block text-[8px] tracking-[0.22em] text-[var(--candle-amber)] uppercase'

export function StepAncestry({ name, ancestryId, onNameChange, onAncestryChange }: Props) {
  const selected = ancestries.find(a => a.id === ancestryId)

  return (
    <div className="flex flex-col gap-6">
      {/* Name */}
      <Field>
        <FieldLabel htmlFor="character-name" className={STEP_LABEL_CLASS}>
          Nome do Personagem
        </FieldLabel>
        <Input
          id="character-name"
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Como te chamam nas Terras das Névoas?"
          className="h-auto rounded-sm border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-[15px] tracking-[0.02em] text-[var(--parchment-pale)] focus-visible:border-[var(--primary)]"
        />
      </Field>

      {/* Ancestry grid */}
      <div>
        <span className={STEP_LABEL_CLASS}>Ancestralidade</span>
        <div className="grid grid-cols-2 gap-2">
          {ancestries.map(a => {
            const active = a.id === ancestryId
            return (
              <Card
                key={a.id}
                render={
                  <button type="button" onClick={() => onAncestryChange(a.id)} aria-pressed={active} />
                }
                size="sm"
                className={cn(
                  'cursor-pointer gap-0 rounded-sm border px-3.5 py-3 text-left ring-0 transition-all duration-[250ms]',
                  active
                    ? 'border-[var(--primary)] bg-[var(--border)] shadow-[0_0_14px_color-mix(in_oklch,var(--primary),transparent_80%)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border)]',
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      'font-heading text-sm tracking-[0.04em]',
                      active ? 'text-[var(--parchment-pale)]' : 'text-[var(--parchment-light)]',
                    )}
                  >
                    {a.name}
                  </span>
                  {a.pariahLevel && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-mono rounded-[1px] border-0 bg-black/30 px-[5px] py-0.5 text-[7px] tracking-[0.06em]',
                        a.pariahLevel === '0/6'
                          ? 'text-[var(--verdigris-light)]'
                          : a.pariahLevel === '6/6'
                            ? 'text-[var(--blood-mid)]'
                            : 'text-muted-foreground',
                      )}
                    >
                      PÁRIA {a.pariahLevel}
                    </Badge>
                  )}
                </div>
                {a.traits.map(t => (
                  <p
                    key={t.name}
                    className="text-muted-foreground mt-0.5 text-[10px] leading-snug italic"
                  >
                    <span className="text-[var(--parchment-warm)] not-italic">{t.name}: </span>
                    {t.description}
                  </p>
                ))}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Ancestry flavor */}
      {selected && ANCESTRY_FLAVOR[selected.id] && (
        <div className="-mt-2 border-l-2 border-[var(--border)] pl-3.5">
          <p className="text-muted-foreground text-[11px] leading-relaxed italic">
            {ANCESTRY_FLAVOR[selected.id]}
          </p>
        </div>
      )}
    </div>
  )
}
