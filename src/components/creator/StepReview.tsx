'use client'

import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getArchetype } from '@/data/archetypes/index'
import { getDomain } from '@/data/domains/index'
import { getSpell } from '@/data/spells/index'
import { modifier, modifierStr } from '@/lib/dice'
import type { Stat } from '@/types/class.types'
import type { KnowledgeArea } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import type { Talent } from '@/types/talent.types'

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
  /** Creation extras — absent while editing an existing sheet. */
  archetypeId?: string
  equipment?: InventoryItem[]
  talents?: Talent[]
}

export function StepReview(props: Props) {
  const { name, classId, ancestryId, stats, hpMax, domainId, languages, faith,
          knowledgeAreas, spells, backgroundDetails, relations, impulses,
          archetypeId, equipment, talents } = props

  const cls = getClass(classId)
  const ancestry = getAncestry(ancestryId)
  const archetype = archetypeId ? getArchetype(archetypeId) : null
  const domain = domainId ? getDomain(domainId) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Identity header */}
      <div style={{
        padding: '16px 18px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
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
          {cls?.name ?? classId}
          {archetype && ` · ${archetype.name}`}
          {' · '}{ancestry?.name ?? ancestryId} · Nível 1 · {hpMax} HP
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
              background: 'var(--card)',
              border: `1px solid ${mod > 1 ? 'var(--chart-2)' : mod < 0 ? 'var(--destructive)' : 'var(--border)'}`,
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
                color: mod > 0 ? 'var(--verdigris-light)' : mod < 0 ? 'var(--destructive)' : 'var(--bone-muted)',
                marginTop: 2,
              }}>
                {modifierStr(val)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Archetype — talent, item and hook in one block */}
      {archetype && (
        <div style={{
          padding: '12px 14px',
          background: 'var(--card)',
          border: '1px solid var(--destructive)',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <p style={blockTitle}>Arquétipo · {archetype.name}</p>
          <p style={flavorText}>{archetype.summary}</p>
          {archetype.talent && (
            <p style={flavorText}>
              <span style={{ color: 'var(--parchment-warm)', fontStyle: 'normal' }}>Talento: </span>
              {archetype.talent}
            </p>
          )}
          {archetype.kit && archetype.kit.length > 0 && (
            <p style={flavorText}>
              <span style={{ color: 'var(--parchment-warm)', fontStyle: 'normal' }}>Item: </span>
              {archetype.kit.map(k => k.name).join(', ')}
            </p>
          )}
          {archetype.hook && (
            <p style={flavorText}>
              <span style={{ color: 'var(--parchment-warm)', fontStyle: 'normal' }}>Gancho: </span>
              {archetype.hook}
            </p>
          )}
        </div>
      )}

      {/* Two-column details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {equipment && (
          <ReviewBlock title="Equipamento">
            {equipment.length > 0
              ? equipment.map(item => (
                  <ReviewRow key={item.id} label={item.name} value={`${item.slots}s`} />
                ))
              : <ReviewRow label="Nada carregado" value="" />}
          </ReviewBlock>
        )}

        <ReviewBlock title="Origem">
          {domain && <ReviewRow label="Domínio" value={domain.name} />}
          {faith && <ReviewRow label="Fé" value={faith} />}
          {languages.length > 0 && (
            <ReviewRow label="Idiomas" value={languages.join(', ')} />
          )}
        </ReviewBlock>

        {(talents ?? []).length > 0 && (
          <ReviewBlock title="Talentos">
            {(talents ?? []).map(t => (
              <ReviewRow key={t.id} label={t.name} value="" />
            ))}
          </ReviewBlock>
        )}

        {spells.length > 0 && (
          <ReviewBlock title="Magias">
            {spells.map(id => (
              <ReviewRow key={id} label={getSpell(id)?.name ?? id} value={`T${getSpell(id)?.tier ?? 1}`} />
            ))}
          </ReviewBlock>
        )}

        {knowledgeAreas.length > 0 && (
          <ReviewBlock title="Conhecimentos">
            {knowledgeAreas.map((ka, i) => (
              <ReviewRow key={i} label={ka.name} value={ka.bonus >= 0 ? `+${ka.bonus}` : `${ka.bonus}`} />
            ))}
          </ReviewBlock>
        )}
      </div>

      {/* Narrative summary */}
      {(backgroundDetails.concept || backgroundDetails.backstory || impulses.objectives || relations.faction) && (
        <div style={{
          padding: '14px 16px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
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
        borderTop: '1px solid var(--border)',
      }}>
        Confirme os detalhes acima e sele o registro para entrar nas Terras das Brumas.
      </div>
    </div>
  )
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 2,
    }}>
      <p style={blockTitle}>{title}</p>
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

const blockTitle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 7,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--candle-amber)',
  opacity: 0.7,
  marginBottom: 8,
}

const flavorText: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bone-muted)',
  lineHeight: 1.5,
}
