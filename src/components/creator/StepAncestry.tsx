'use client'

import { ancestries } from '@/data/ancestries/index'
import { DOMAINS } from '@/data/domains/index'
import { CardPicker, DetailBlock, type CardOption } from '@/components/creator/CardPicker'
import { StepProse } from '@/components/creator/StepSection'
import { Badge } from '@/components/ui/badge'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  ancestryId: string
  onAncestryChange: (id: string) => void
  /** Passing both renders the name field above the deck (sheet editing). */
  name?: string
  onNameChange?: (name: string) => void
  /** Leave the setting text out when the step above already carries it. */
  hideIntro?: boolean
}

export const ANCESTRY_GLYPH: Record<string, string> = {
  human: '☼',
  elf: '❧',
  dwarf: '⚒',
  halfling: '☘',
  gnome: '⚙',
  tiefling: '⛧',
  'caliban-brute': '⛰',
  'caliban-bestial': '⚞',
  'caliban-damned': '☍',
  resurrected: '⚰',
}

const STEP_LABEL_CLASS =
  'font-heading mb-2.5 block text-[8px] tracking-[0.22em] text-[var(--candle-amber)] uppercase'

/** 0 passes unnoticed, 6 gets hunted — the scale reads green to blood. */
function pariahTone(level: number): string {
  if (level <= 1) return 'text-[var(--verdigris-light)]'
  if (level >= 5) return 'text-[var(--destructive)]'
  return 'text-muted-foreground'
}

export function StepAncestry({
  ancestryId, onAncestryChange, name, onNameChange, hideIntro,
}: Props) {
  const options: CardOption[] = ancestries.map(a => ({
    id: a.id,
    title: a.name,
    caption: a.pariahLevel != null ? `Pária ${a.pariahLevel}/6` : 'Ancestralidade',
    glyph: ANCESTRY_GLYPH[a.id] ?? '✦',
    // The wiki entries open with the paragraph that best sells the people.
    description: a.description?.split('\n')[0] ?? a.traits[0]?.description ?? '',
  }))

  return (
    <div className="flex flex-col gap-5">
      {onNameChange && (
        <Field>
          <FieldLabel htmlFor="character-name" className={STEP_LABEL_CLASS}>
            Nome do Personagem
          </FieldLabel>
          <Input
            id="character-name"
            type="text"
            value={name ?? ''}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Como te chamam nas Terras das Brumas?"
            className="h-auto rounded-sm border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-[15px] tracking-[0.02em] text-[var(--parchment-pale)] focus-visible:border-[var(--primary)]"
          />
        </Field>
      )}

      {!hideIntro && (
        <StepProse>
          No cenário de Ravenloft a fantasia tradicional dá lugar ao horror gótico, em um ambiente
          menos fantástico e mais sombrio. Humanoides, em especial os humanos, são os principais
          habitantes das Terras das Brumas. Quanto mais um personagem se afasta das características
          humanas, mais pode trazer preconceito e medo à população atormentada de Ravenloft.
        </StepProse>
      )}

      <CardPicker
        options={options}
        selectedId={ancestryId}
        onSelect={onAncestryChange}
        actionLabel="Escolher esta ancestralidade"
        chosenLabel="Ancestralidade escolhida"
        renderDetail={option => {
          const ancestry = ancestries.find(a => a.id === option.id)
          if (!ancestry) return null

          const domainCount = ancestry.domainOptions?.includes('*')
            ? DOMAINS.length
            : ancestry.domainOptions?.length ?? 0
          const rules = ancestry.languageRules

          return (
            <>
              {ancestry.description && (
                <p className="text-muted-foreground mb-3 text-[12.5px] leading-relaxed whitespace-pre-line italic">
                  {ancestry.description}
                </p>
              )}

              {ancestry.pariahLevel != null && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono rounded-[1px] border-0 bg-black/30 px-[5px] py-0.5 text-[7px] tracking-[0.06em]',
                      pariahTone(ancestry.pariahLevel),
                    )}
                  >
                    PÁRIA {ancestry.pariahLevel}/6
                  </Badge>
                  <span className="text-muted-foreground text-[11px] italic">
                    Quanto maior o índice, mais a população das Brumas reage com medo e preconceito.
                  </span>
                </div>
              )}

              <DetailBlock label="Traços">
                <ul className="flex flex-col gap-1.5">
                  {ancestry.traits.map(trait => (
                    <li key={trait.name}>
                      <span className="text-[var(--parchment-pale)]">{trait.name}: </span>
                      <span className="text-muted-foreground text-[12px] leading-relaxed">
                        {trait.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </DetailBlock>

              <DetailBlock label="Idiomas">
                {ancestry.fixedLanguages?.length
                  ? `Concedidos: ${ancestry.fixedLanguages.join(', ')}. `
                  : ''}
                {rules
                  ? `${rules.domainPicks === 'int_mod' ? 'Mod. INT' : rules.domainPicks} idioma(s) do domínio natal${
                      rules.freePicks
                        ? ` e ${rules.freePicks === 'int_mod' ? 'mod. INT' : rules.freePicks} idioma(s) livre(s)`
                        : ''
                    }.`
                  : 'Nenhum idioma adicional na criação.'}
              </DetailBlock>

              <DetailBlock label="Domínio natal">
                {domainCount > 0
                  ? `Pode ter nascido em ${domainCount} domínio${domainCount === 1 ? '' : 's'} — o lar é escolhido na seção Domínio natal.`
                  : 'Sem vínculo fixo com um domínio dos Domínios do Pavor.'}
              </DetailBlock>
            </>
          )
        }}
      />
    </div>
  )
}
