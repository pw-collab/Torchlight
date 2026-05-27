'use client'

import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getDomain } from '@/data/domains/index'
import { getItem } from '@/data/equipment/index'
import { modifier, modifierStr } from '@/lib/dice'
import type { Stat } from '@/types/class.types'
import type { KnowledgeArea } from '@/types/character.types'

const STAT_LABELS: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}
const STAT_KEYS: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

interface Props {
  name: string
  classId: string
  ancestryId: string
  stats: Record<Stat, number>
  hpMax: number
  domainId: string
  languages: string[]
  faith: string
  knowledgeAreas: KnowledgeArea[]
  spells: string[]
  backgroundDetails: { concept?: string; origin?: string; backstory?: string; traumaticEvents?: string }
  relations: { family?: string[]; allies?: string[]; rivals?: string[]; faction?: string }
  impulses: { secrets?: string; flaws?: string; fears?: string; objectives?: string }
}

export function StepReview(props: Props) {
  const { name, classId, ancestryId, stats, hpMax, domainId, languages, faith,
          knowledgeAreas, spells, backgroundDetails, relations, impulses } = props

  const cls = getClass(classId)
  const ancestry = getAncestry(ancestryId)
  const domain = domainId ? getDomain(domainId) : null
  const equipment = (cls?.startingGear ?? []).map(id => ({ id, item: getItem(id) }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Identity header */}
      <div style={{
        padding: '16px 18px',
        background: 'rgba(20,14,6,0.6)',
        border: '1px solid rgba(139,112,48,0.3)',
        borderRadius: 2,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--parchment-pale)',
          letterSpacing: '0.05em',
          marginBottom: 4,
          lineHeight: 1.1,
        }}>
          {name || '(sem nome)'}
        </h3>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--bone-muted)',
        }}>
          {cls?.name ?? classId} · {ancestry?.name ?? ancestryId} · Nível 1 · {hpMax} HP
          {domain && ` · ${domain.name}`}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
        {STAT_KEYS.map(k => {
          const val = stats[k]
          const mod = modifier(val)
          return (
            <div key={k} style={{
              textAlign: 'center',
              padding: '10px 4px',
              background: 'rgba(20,14,6,0.5)',
              border: `1px solid ${mod > 1 ? 'rgba(61,112,96,0.35)' : mod < 0 ? 'rgba(139,21,21,0.3)' : 'rgba(139,112,48,0.18)'}`,
              borderRadius: 2,
            }}>
              <p style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 6,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--candle-amber)',
                opacity: 0.7,
                marginBottom: 2,
              }}>
                {STAT_LABELS[k]}
              </p>
              <p style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--parchment-pale)',
                lineHeight: 1,
              }}>
                {val}
              </p>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: mod > 0 ? 'var(--verdigris-light)' : mod < 0 ? 'var(--blood-mid)' : 'var(--bone-muted)',
                marginTop: 2,
              }}>
                {modifierStr(val)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Two-column details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Equipment */}
        <ReviewBlock title="Equipamento">
          {equipment.map(({ id, item }) => (
            <ReviewRow key={id} label={item?.name ?? id} value={`${item?.slots ?? 1}s`} />
          ))}
        </ReviewBlock>

        {/* Origin */}
        <ReviewBlock title="Origem">
          {domain && <ReviewRow label="Domínio" value={domain.name} />}
          {faith && <ReviewRow label="Fé" value={faith} />}
          {languages.length > 0 && (
            <ReviewRow label="Idiomas" value={languages.join(', ')} />
          )}
        </ReviewBlock>

        {/* Spells */}
        {spells.length > 0 && (
          <ReviewBlock title="Magias">
            {spells.map(s => (
              <ReviewRow key={s} label={s} value="" />
            ))}
          </ReviewBlock>
        )}

        {/* Knowledge Areas */}
        {knowledgeAreas.length > 0 && (
          <ReviewBlock title="Conhecimentos">
            {knowledgeAreas.map((ka, i) => (
              <ReviewRow key={i} label={ka.name} value={ka.bonus >= 0 ? `+${ka.bonus}` : `${ka.bonus}`} />
            ))}
          </ReviewBlock>
        )}
      </div>

      {/* Narrative summary */}
      {(backgroundDetails.concept || backgroundDetails.backstory || impulses.objectives) && (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(20,14,6,0.4)',
          border: '1px solid rgba(139,112,48,0.15)',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {backgroundDetails.concept && (
            <p style={flavorText}>
              <span style={{ color: 'var(--parchment-warm)', fontStyle: 'normal' }}>Conceito: </span>
              {backgroundDetails.concept}
            </p>
          )}
          {backgroundDetails.backstory && (
            <p style={flavorText}>
              {backgroundDetails.backstory.slice(0, 180)}
              {backgroundDetails.backstory.length > 180 ? '…' : ''}
            </p>
          )}
          {impulses.objectives && (
            <p style={flavorText}>
              <span style={{ color: 'var(--parchment-warm)', fontStyle: 'normal' }}>Objetivo: </span>
              {impulses.objectives}
            </p>
          )}
        </div>
      )}

      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: 10,
        color: 'var(--bone-muted)',
        padding: '8px 0',
        borderTop: '1px solid rgba(139,112,48,0.12)',
      }}>
        Confirme os detalhes acima e sele o registro para entrar nas Terras das Névoas.
      </div>
    </div>
  )
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(20,14,6,0.45)',
      border: '1px solid rgba(139,112,48,0.18)',
      borderRadius: 2,
    }}>
      <p style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 7,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--candle-amber)',
        opacity: 0.7,
        marginBottom: 8,
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {children}
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        color: 'var(--parchment-light)',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {value && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--bone-muted)',
          flexShrink: 0,
        }}>
          {value}
        </span>
      )}
    </div>
  )
}

const flavorText: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bone-muted)',
  lineHeight: 1.5,
}
