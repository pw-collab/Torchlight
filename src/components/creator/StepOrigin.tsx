'use client'

import { useState, useMemo } from 'react'
import { getAncestry } from '@/data/ancestries/index'
import { DOMAINS, getDomain, ALL_DOMAIN_IDS } from '@/data/domains/index'
import { modifier } from '@/lib/dice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const FAITHS = [
  'A Igreja de Ezra da Fé Matriz',
  'A Igreja de Ezra dos Corações Puros',
  'A Igreja de Ezra dos Eruditos',
  'A Igreja de Ezra dos Zelotes',
  'A Igreja de Hala',
  'A Divindade da Humanidade',
  'A Fé de Ferro',
  'A Ordem Eterna',
  'O Culto do Senhor da Manhã',
  'Nenhuma / Sem fé',
]

interface Props {
  ancestryId: string
  intStat: number
  domainId: string
  languages: string[]
  faith: string
  onDomainChange: (id: string) => void
  onLanguagesChange: (langs: string[]) => void
  onFaithChange: (faith: string) => void
}

export function StepOrigin({
  ancestryId,
  intStat,
  domainId,
  languages,
  faith,
  onDomainChange,
  onLanguagesChange,
  onFaithChange,
}: Props) {
  const [freeInput, setFreeInput] = useState('')

  const ancestry = getAncestry(ancestryId)
  const intMod = Math.max(0, modifier(intStat))

  const anyDomain = ancestry?.domainOptions?.includes('*') ?? false
  const availableDomains = useMemo(() => {
    if (!ancestry?.domainOptions) return []
    if (anyDomain) return DOMAINS
    return ancestry.domainOptions.map(id => DOMAINS.find(d => d.id === id)).filter(Boolean) as typeof DOMAINS
  }, [ancestry, anyDomain])

  const hasDomainChoice = availableDomains.length > 0
  const rules = ancestry?.languageRules
  const fixedLangs: string[] = ancestry?.fixedLanguages ?? []

  function resolveCount(v: number | 'int_mod'): number {
    return v === 'int_mod' ? intMod : v
  }

  const domainPickCount = rules ? resolveCount(rules.domainPicks) : 0
  const freePickCount = rules?.freePicks !== undefined ? resolveCount(rules.freePicks) : 0

  const selectedDomain = domainId ? getDomain(domainId) : null
  const domainPool: string[] = selectedDomain?.languages ?? []

  const selectedDomainLangs = languages.filter(l => domainPool.includes(l) && !fixedLangs.includes(l))
  const freeLangs = languages.filter(l => !domainPool.includes(l) && !fixedLangs.includes(l))

  function setDomainLangs(langs: string[]) {
    onLanguagesChange([...fixedLangs, ...langs, ...freeLangs])
  }

  function setFreeLangs(langs: string[]) {
    onLanguagesChange([...fixedLangs, ...selectedDomainLangs, ...langs])
  }

  function toggleDomainLang(lang: string) {
    if (selectedDomainLangs.includes(lang)) {
      setDomainLangs(selectedDomainLangs.filter(l => l !== lang))
    } else if (selectedDomainLangs.length < domainPickCount) {
      setDomainLangs([...selectedDomainLangs, lang])
    }
  }

  function addFreeLang() {
    const trimmed = freeInput.trim()
    if (!trimmed || freeLangs.includes(trimmed) || freeLangs.length >= freePickCount) return
    setFreeLangs([...freeLangs, trimmed])
    setFreeInput('')
  }

  function removeFreeLang(l: string) {
    setFreeLangs(freeLangs.filter(x => x !== l))
  }

  function handleDomainSelect(id: string) {
    onDomainChange(id)
    // Reset domain languages when domain changes
    onLanguagesChange([...fixedLangs, ...freeLangs])
  }

  return (
    <div className="flex flex-col gap-7">

      {/* Domain picker */}
      {hasDomainChoice && (
        <section>
          <div className={SECTION_LABEL_CLASS}>Domínio de Origem</div>
          <p className={SECTION_NOTE_CLASS}>
            As Terras das Névoas são compostas de domínios isolados por cerração mágica.
            Escolha o lar que moldou sua história.
          </p>
          <div
            className={cn(
              'mt-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-[5px]',
              availableDomains.length > 12 && 'max-h-[260px] overflow-y-auto',
            )}
          >
            {availableDomains.map(d => {
              const active = domainId === d.id
              return (
                <Button
                  key={d.id}
                  variant="outline"
                  onClick={() => handleDomainSelect(d.id)}
                  aria-pressed={active}
                  className={cn(
                    'h-auto justify-start truncate rounded-sm px-2.5 py-[7px] text-[11px] normal-case',
                    'font-sans tracking-normal transition-all duration-200',
                    active
                      ? 'border-[var(--primary)] bg-[var(--border)] text-[var(--parchment-light)]'
                      : 'text-muted-foreground border-[var(--border)] bg-[var(--card)]',
                  )}
                >
                  {d.name}
                </Button>
              )
            })}
          </div>
        </section>
      )}

      {/* Languages */}
      {(fixedLangs.length > 0 || rules) && (
        <section>
          <div className={SECTION_LABEL_CLASS}>Idiomas</div>

          {/* Fixed languages */}
          {fixedLangs.length > 0 && (
            <div className="mb-2.5">
              <span className={SUB_LABEL_CLASS}>Concedidos pela ancestralidade</span>
              <div className="mt-[5px] flex flex-wrap gap-[5px]">
                {fixedLangs.map(l => (
                  <Badge key={l} variant="outline" className={CHIP_CLASS}>{l}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Domain language picks */}
          {domainPickCount > 0 && domainPool.length > 0 && (
            <div className="mb-3">
              <span className={SUB_LABEL_CLASS}>
                Do domínio — escolha {domainPickCount} de {selectedDomain?.name}
                <span className="ml-1.5 text-[var(--gold-oxidized)]">
                  {selectedDomainLangs.length}/{domainPickCount}
                </span>
              </span>
              <div className="mt-1.5 flex flex-wrap gap-[5px]">
                {domainPool.map(l => {
                  const sel = selectedDomainLangs.includes(l)
                  const full = !sel && selectedDomainLangs.length >= domainPickCount
                  return (
                    <Badge
                      key={l}
                      variant="outline"
                      render={
                        <button
                          type="button"
                          onClick={() => toggleDomainLang(l)}
                          disabled={full}
                          aria-pressed={sel}
                        />
                      }
                      className={cn(
                        PICK_CHIP_CLASS,
                        sel
                          ? 'border-[var(--primary)] bg-[var(--border)] text-[var(--parchment-light)]'
                          : full
                            ? 'cursor-default border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]'
                            : 'text-muted-foreground border-[var(--border)] bg-[var(--card)]',
                      )}
                    >
                      {l}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {domainPickCount > 0 && !selectedDomain && hasDomainChoice && (
            <p className="mb-2.5 text-[10px] text-[var(--muted-foreground)] italic">
              Escolha um domínio acima para ver as opções de idiomas.
            </p>
          )}

          {/* Free language picks */}
          {freePickCount > 0 && (
            <div>
              <span className={SUB_LABEL_CLASS}>
                Idiomas adicionais — qualquer
                <span className="ml-1.5 text-[var(--gold-oxidized)]">
                  {freeLangs.length}/{freePickCount}
                </span>
              </span>
              <div className="mt-1.5 mb-2 flex flex-wrap gap-[5px]">
                {freeLangs.map(l => (
                  <Badge
                    key={l}
                    variant="outline"
                    render={
                      <button
                        type="button"
                        onClick={() => removeFreeLang(l)}
                        aria-label={`Remover ${l}`}
                      />
                    }
                    className={cn(
                      PICK_CHIP_CLASS,
                      'border-[var(--primary)] bg-[var(--border)] text-[var(--parchment-light)]',
                    )}
                  >
                    {l} ×
                  </Badge>
                ))}
              </div>
              {freeLangs.length < freePickCount && (
                <div className="flex gap-1.5">
                  <Input
                    type="text"
                    value={freeInput}
                    onChange={e => setFreeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addFreeLang()}
                    placeholder="Nome do idioma..."
                    aria-label="Nome do idioma"
                    className="h-auto flex-1 rounded-sm border-[var(--border)] bg-[var(--card)] px-2.5 py-[7px] text-xs text-[var(--parchment-pale)] focus-visible:border-[var(--primary)]"
                  />
                  <Button
                    variant="outline"
                    onClick={addFreeLang}
                    className="h-auto rounded-sm border-[var(--border)] bg-[var(--border)]/15 px-3.5 py-[7px] text-[9px] tracking-[0.12em] text-[var(--parchment-light)]"
                  >
                    + Adicionar
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Faith */}
      <section>
        <div className={SECTION_LABEL_CLASS}>Fé</div>
        <p className={SECTION_NOTE_CLASS}>Nas Terras das Névoas, a fé pode ser âncora ou corrente.</p>
        <div className="mt-3 flex flex-col gap-1">
          {FAITHS.map(f => {
            const active = faith === f
            return (
              <Button
                key={f}
                variant="outline"
                onClick={() => onFaithChange(active ? '' : f)}
                aria-pressed={active}
                className={cn(
                  'h-auto justify-start rounded-sm px-3.5 py-2.5 text-left text-xs normal-case',
                  'font-sans tracking-normal transition-all duration-200',
                  active
                    ? 'border-[var(--chart-4)] bg-[var(--muted)] text-[var(--parchment-light)] not-italic'
                    : 'text-muted-foreground border-[var(--border)] bg-[var(--card)] italic',
                )}
              >
                {f}
              </Button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

const SECTION_LABEL_CLASS =
  'font-heading mb-1.5 text-[8px] tracking-[0.22em] text-[var(--candle-amber)] uppercase'

const SECTION_NOTE_CLASS = 'text-muted-foreground text-[10px] leading-normal italic'

const SUB_LABEL_CLASS =
  'font-heading text-muted-foreground text-[7px] tracking-[0.16em] uppercase'

const CHIP_CLASS =
  'rounded-[10px] border-[var(--border)] bg-[var(--card)] px-2.5 py-[3px] text-[11px] text-[var(--parchment-light)]'

const PICK_CHIP_CLASS =
  'cursor-pointer rounded-[10px] border px-2.5 py-[3px] text-[11px] transition-all duration-150'
