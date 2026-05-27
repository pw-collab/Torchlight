'use client'

import { useState, useMemo } from 'react'
import { getAncestry } from '@/data/ancestries/index'
import { DOMAINS, getDomain, ALL_DOMAIN_IDS } from '@/data/domains/index'
import { modifier } from '@/lib/dice'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Domain picker */}
      {hasDomainChoice && (
        <section>
          <div style={sectionLabel}>Domínio de Origem</div>
          <p style={sectionNote}>
            As Terras das Névoas são compostas de domínios isolados por cerração mágica.
            Escolha o lar que moldou sua história.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 5,
            marginTop: 12,
            maxHeight: availableDomains.length > 12 ? 260 : undefined,
            overflowY: availableDomains.length > 12 ? 'auto' : undefined,
          }}>
            {availableDomains.map(d => {
              const active = domainId === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => handleDomainSelect(d.id)}
                  style={{
                    background: active ? 'rgba(139,112,48,0.14)' : 'rgba(13,10,5,0.5)',
                    border: `1px solid ${active ? 'rgba(196,120,42,0.5)' : 'rgba(139,112,48,0.18)'}`,
                    borderRadius: 2,
                    padding: '7px 10px',
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: active ? 'var(--parchment-light)' : 'var(--bone-muted)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 200ms',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {d.name}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Languages */}
      {(fixedLangs.length > 0 || rules) && (
        <section>
          <div style={sectionLabel}>Idiomas</div>

          {/* Fixed languages */}
          {fixedLangs.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <span style={subLabel}>Concedidos pela ancestralidade</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                {fixedLangs.map(l => (
                  <span key={l} style={fixedChip}>{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Domain language picks */}
          {domainPickCount > 0 && domainPool.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <span style={subLabel}>
                Do domínio — escolha {domainPickCount} de {selectedDomain?.name}
                <span style={{ color: 'var(--gold-oxidized)', marginLeft: 6 }}>
                  {selectedDomainLangs.length}/{domainPickCount}
                </span>
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                {domainPool.map(l => {
                  const sel = selectedDomainLangs.includes(l)
                  const full = !sel && selectedDomainLangs.length >= domainPickCount
                  return (
                    <button
                      key={l}
                      onClick={() => toggleDomainLang(l)}
                      disabled={full}
                      style={{
                        ...pickChip,
                        background: sel ? 'rgba(139,112,48,0.2)' : 'rgba(13,10,5,0.5)',
                        borderColor: sel ? 'rgba(196,120,42,0.5)' : 'rgba(139,112,48,0.2)',
                        color: sel ? 'var(--parchment-light)' : full ? '#3A2E18' : 'var(--bone-muted)',
                        cursor: full ? 'default' : 'pointer',
                      }}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {domainPickCount > 0 && !selectedDomain && hasDomainChoice && (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: '#3A2E18', marginBottom: 10 }}>
              Escolha um domínio acima para ver as opções de idiomas.
            </p>
          )}

          {/* Free language picks */}
          {freePickCount > 0 && (
            <div>
              <span style={subLabel}>
                Idiomas adicionais — qualquer
                <span style={{ color: 'var(--gold-oxidized)', marginLeft: 6 }}>
                  {freeLangs.length}/{freePickCount}
                </span>
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6, marginBottom: 8 }}>
                {freeLangs.map(l => (
                  <button
                    key={l}
                    onClick={() => removeFreeLang(l)}
                    style={{ ...pickChip, background: 'rgba(139,112,48,0.18)', borderColor: 'rgba(196,120,42,0.4)', color: 'var(--parchment-light)' }}
                  >
                    {l} ×
                  </button>
                ))}
              </div>
              {freeLangs.length < freePickCount && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={freeInput}
                    onChange={e => setFreeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addFreeLang()}
                    placeholder="Nome do idioma..."
                    style={{
                      flex: 1,
                      background: 'rgba(13,10,5,0.7)',
                      border: '1px solid rgba(139,112,48,0.25)',
                      borderRadius: 2,
                      padding: '7px 10px',
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: 'var(--parchment-pale)',
                      outline: 'none',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,120,42,0.5)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,112,48,0.25)' }}
                  />
                  <button
                    onClick={addFreeLang}
                    style={{
                      background: 'rgba(139,112,48,0.14)',
                      border: '1px solid rgba(139,112,48,0.3)',
                      borderRadius: 2,
                      padding: '7px 14px',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 9,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--parchment-light)',
                      cursor: 'pointer',
                    }}
                  >
                    + Adicionar
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Faith */}
      <section>
        <div style={sectionLabel}>Fé</div>
        <p style={sectionNote}>Nas Terras das Névoas, a fé pode ser âncora ou corrente.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
          {FAITHS.map(f => {
            const active = faith === f
            return (
              <button
                key={f}
                onClick={() => onFaithChange(active ? '' : f)}
                style={{
                  background: active ? 'rgba(74,48,104,0.2)' : 'rgba(13,10,5,0.4)',
                  border: `1px solid ${active ? 'rgba(107,78,138,0.5)' : 'rgba(139,112,48,0.15)'}`,
                  borderRadius: 2,
                  padding: '9px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontStyle: active ? 'normal' : 'italic',
                  fontSize: 12,
                  color: active ? 'var(--parchment-light)' : 'var(--bone-muted)',
                  transition: 'all 200ms',
                }}
              >
                {f}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 8,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--candle-amber)',
  marginBottom: 6,
}

const sectionNote: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontStyle: 'italic',
  fontSize: 10,
  color: 'var(--bone-muted)',
  lineHeight: 1.5,
}

const subLabel: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 7,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bone-muted)',
}

const fixedChip: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--parchment-light)',
  background: 'rgba(20,14,6,0.6)',
  border: '1px solid rgba(139,112,48,0.3)',
  borderRadius: 10,
  padding: '3px 10px',
}

const pickChip: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  borderRadius: 10,
  padding: '3px 10px',
  border: '1px solid',
  transition: 'all 150ms',
}
