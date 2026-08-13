'use client'

import { useState, useMemo } from 'react'
import { getAncestry } from '@/data/ancestries/index'
import { DOMAINS, getDomain } from '@/data/domains/index'
import { RELIGIONS } from '@/data/religions/index'
import { modifier } from '@/lib/dice'
import { StepAncestry } from '@/components/creator/StepAncestry'
import { StepProse, StepSection } from '@/components/creator/StepSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, textGlyph } from '@/lib/utils'

interface Props {
  ancestryId: string
  intStat: number
  domainId: string
  languages: string[]
  faith: string
  onDomainChange: (id: string) => void
  onLanguagesChange: (langs: string[]) => void
  onFaithChange: (faith: string) => void
  /**
   * Creation mode: the ancestry deck is shown inside this step, as sub-section
   * 2.2. The sheet's editor keeps ancestry on its own tab and leaves this out.
   */
  onAncestryChange?: (id: string) => void
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
  onAncestryChange,
}: Props) {
  const [freeInput, setFreeInput] = useState('')
  const [domainFilter, setDomainFilter] = useState('')

  const ancestry = getAncestry(ancestryId)
  const intMod = Math.max(0, modifier(intStat))

  // An ancestry may narrow the domains it can come from; '*' and an absent list
  // both mean "anywhere in the Domains of Dread".
  const availableDomains = useMemo(() => {
    const options = ancestry?.domainOptions
    if (!options || options.includes('*')) return DOMAINS
    const allowed = new Set(options)
    return DOMAINS.filter(d => allowed.has(d.id))
  }, [ancestry])

  const shownDomains = useMemo(() => {
    const query = domainFilter.trim().toLowerCase()
    if (!query) return availableDomains
    return availableDomains.filter(d => d.name.toLowerCase().includes(query))
  }, [availableDomains, domainFilter])

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
    // The domain's language pool changes with it — drop the old picks.
    onLanguagesChange([...fixedLangs, ...freeLangs])
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── 2.1 Home domain ─────────────────────────────────────────────── */}
      <StepSection index={onAncestryChange ? '2.1' : undefined} title="Domínio natal">
        <StepProse>
          Determina as expectativas culturais do personagem, seu conhecimento de folclore e suas
          suposições de sobrevivência cotidiana como nativo de um Domínio do Pavor. Estas são
          verdades de interpretação que moldam visão de mundo, medos e expectativas. Use-as para
          orientar decisões, suspeitas e reações ao sobrenatural.
        </StepProse>

        {availableDomains.length > 10 && (
          <Input
            type="search"
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            placeholder="Filtrar domínios..."
            aria-label="Filtrar domínios"
            className="h-auto rounded-sm border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--foreground)] focus-visible:border-[var(--primary)]"
          />
        )}

        <div className="flex max-h-[440px] flex-col gap-1 overflow-y-auto pr-1">
          {shownDomains.map(domain => {
            const active = domainId === domain.id
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => handleDomainSelect(active ? '' : domain.id)}
                aria-pressed={active}
                className={cn(
                  'tactile cursor-pointer rounded-sm border px-3.5 py-2.5 text-left transition-all duration-200',
                  active
                    ? 'border-[var(--primary)] bg-[var(--input)] shadow-[0_0_12px_color-mix(in_oklch,var(--primary),transparent_75%)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                )}
              >
                <span
                  className={cn(
                    'font-heading text-[13px] tracking-[0.03em]',
                    active ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
                  )}
                >
                  {domain.name}
                </span>
                <span className="font-mono ml-2 text-[7px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
                  {domain.region}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-[10.5px] leading-snug italic">
                  {domain.description}
                </span>
                {active && (
                  <span className="mt-1.5 flex flex-col gap-1">
                    {domain.commonExperiences && (
                      <span className="block text-[10.5px] leading-snug text-[var(--foreground)]">
                        <span className="text-[var(--foreground)]">Verdades de interpretação: </span>
                        {domain.commonExperiences}
                      </span>
                    )}
                    {domain.darkLord && (
                      <span className="font-mono block text-[9px] text-[var(--muted-foreground)]">
                        Senhor Sombrio: {domain.darkLord}
                      </span>
                    )}
                    {domain.religions.length > 0 && (
                      <span className="font-mono block text-[9px] text-[var(--muted-foreground)]">
                        Fé predominante: {domain.religions.join(', ')}
                      </span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
          {shownDomains.length === 0 && (
            <p className="text-muted-foreground px-1 py-3 text-[11px] italic">
              Nenhum domínio corresponde ao filtro.
            </p>
          )}
        </div>
      </StepSection>

      {/* ── 2.2 Ancestry ─────────────────────────────────────────────────── */}
      {onAncestryChange && (
        <StepSection index="2.2" title="Defina sua Ancestralidade">
          <StepAncestry ancestryId={ancestryId} onAncestryChange={onAncestryChange} />
        </StepSection>
      )}

      {/* ── 2.3 Religion ─────────────────────────────────────────────────── */}
      <StepSection index={onAncestryChange ? '2.3' : undefined} title="Religião">
        <StepProse>
          Nos Domínios do Pavor, a fé é tanto um escudo quanto uma arma. No entanto, as divindades
          raramente respondem diretamente, e suas igrejas são muitas vezes tão falhas e corruptas
          quanto o mundo ao seu redor.
        </StepProse>

        <div className="flex flex-col gap-1">
          {RELIGIONS.map(religion => {
            const active = faith === religion.name
            const local = selectedDomain?.religions.includes(religion.name) ?? false
            return (
              <button
                key={religion.id}
                type="button"
                onClick={() => onFaithChange(active ? '' : religion.name)}
                aria-pressed={active}
                className={cn(
                  'tactile flex cursor-pointer items-start gap-2.5 rounded-sm border px-3.5 py-2.5 text-left transition-all duration-200',
                  active
                    ? 'border-[var(--chart-4)] bg-[var(--muted)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]',
                )}
              >
                <span className="mt-0.5 shrink-0 text-[13px] leading-none text-[var(--muted-foreground)]">
                  {textGlyph(religion.glyph)}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'font-heading block text-[12.5px] tracking-[0.03em]',
                      active ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
                    )}
                  >
                    {religion.name}
                    {local && (
                      <span className="font-mono ml-2 text-[7px] tracking-[0.14em] text-[var(--chart-2)] uppercase">
                        no seu domínio
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-[10.5px] leading-snug italic">
                    {religion.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </StepSection>

      {/* ── Languages ────────────────────────────────────────────────────── */}
      {(fixedLangs.length > 0 || rules) && (
        <StepSection title="Idiomas">
          {fixedLangs.length > 0 && (
            <div>
              <span className={SUB_LABEL_CLASS}>Concedidos pela ancestralidade</span>
              <div className="mt-[5px] flex flex-wrap gap-[5px]">
                {fixedLangs.map(l => (
                  <Badge key={l} variant="outline" className={CHIP_CLASS}>{l}</Badge>
                ))}
              </div>
            </div>
          )}

          {domainPickCount > 0 && domainPool.length > 0 && (
            <div>
              <span className={SUB_LABEL_CLASS}>
                Do domínio — escolha {domainPickCount} de {selectedDomain?.name}
                <span className="ml-1.5 text-[var(--muted-foreground)]">
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
                          ? 'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
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

          {domainPickCount > 0 && !selectedDomain && (
            <p className="text-[10px] text-[var(--muted-foreground)] italic">
              Escolha um domínio natal acima para ver as opções de idiomas.
            </p>
          )}

          {domainPickCount > 0 && selectedDomain && domainPool.length === 0 && (
            <p className="text-[10px] text-[var(--muted-foreground)] italic">
              Os idiomas de {selectedDomain.name} ainda não foram catalogados.
            </p>
          )}

          {freePickCount > 0 && (
            <div>
              <span className={SUB_LABEL_CLASS}>
                Idiomas adicionais — qualquer
                <span className="ml-1.5 text-[var(--muted-foreground)]">
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
                      'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]',
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
                    className="h-auto flex-1 rounded-sm border-[var(--border)] bg-[var(--card)] px-2.5 py-[7px] text-xs text-[var(--foreground)] focus-visible:border-[var(--primary)]"
                  />
                  <Button
                    variant="outline"
                    onClick={addFreeLang}
                    className="h-auto rounded-sm border-[var(--border)] bg-[var(--muted)] px-3.5 py-[7px] text-[9px] tracking-[0.12em] text-[var(--foreground)]"
                  >
                    + Adicionar
                  </Button>
                </div>
              )}
            </div>
          )}
        </StepSection>
      )}
    </div>
  )
}

const SUB_LABEL_CLASS =
  'font-heading text-muted-foreground text-[7px] tracking-[0.16em] uppercase'

const CHIP_CLASS =
  'rounded-[10px] border-[var(--border)] bg-[var(--card)] px-2.5 py-[3px] text-[11px] text-[var(--foreground)]'

const PICK_CHIP_CLASS =
  'cursor-pointer rounded-[10px] border px-2.5 py-[3px] text-[11px] transition-all duration-150'
