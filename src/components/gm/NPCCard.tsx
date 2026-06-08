'use client'

import type { NPC } from '@/types/npc.types'
import { rollFormula, type RollResult } from '@/lib/dice'
import { injectDiceSpans } from '@/lib/diceParser'
import { RollableText } from '@/components/shared/RollableText'

interface Props {
  npc: NPC
  onDelete?: () => void
  onEdit?: () => void
  onRoll?: (r: RollResult) => void
}

const BORDER = '1px solid rgba(139,112,48,0.33)'

function StatPair({ label, value }: { label: string; value: string | number | undefined }) {
  if (value == null || value === '') return null
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontWeight: 500, fontSize: 11, whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', color: 'var(--parchment-light)' }}>
        {label}
      </span>
      <span style={{ color: 'rgba(139,112,48,0.6)', fontSize: 10, margin: '0 1px' }}>|</span>
      <span style={{ fontSize: 11.5, color: 'var(--ink-deep)', fontFamily: 'var(--font-body)' }}>
        {value}
      </span>
    </div>
  )
}

function formatMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

export function NPCCard({ npc, onDelete, onEdit, onRoll }: Props) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      maxWidth: 480,
      border: BORDER,
      background: 'var(--parchment-light, #f0e8d0)',
      color: 'var(--ink-deep, #1a1408)',
      position: 'relative',
    }}>
      {/* Action buttons */}
      {(onEdit || onDelete) && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 1 }}>
          {onEdit && (
            <button
              onClick={onEdit}
              title="Editar ficha"
              className="tactile"
              style={{
                background: 'rgba(42,34,16,0.75)', border: '1px solid rgba(139,112,48,0.45)',
                color: 'var(--bone-white)', fontFamily: 'var(--font-heading)', fontSize: 13,
                letterSpacing: '0.1em', padding: '8px 12px', cursor: 'pointer', borderRadius: 1,
                minWidth: 40, minHeight: 36, lineHeight: 1,
              }}
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Excluir ficha"
              className="tactile"
              style={{
                background: 'rgba(139,21,21,0.4)', border: '1px solid rgba(196,32,32,0.45)',
                color: 'var(--blood-bright)', fontFamily: 'var(--font-heading)', fontSize: 13,
                letterSpacing: '0.1em', padding: '8px 12px', cursor: 'pointer', borderRadius: 1,
                minWidth: 40, minHeight: 36, lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'var(--ink-deep)', color: '#f5f0e8', padding: '10px 14px 8px' }}>
        <p style={{ fontSize: 18, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0, lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
          {npc.name}
        </p>
        {npc.npcType && (
          <p style={{ fontSize: 11.5, color: '#c0b8a8', margin: '2px 0 0', fontStyle: 'italic' }}>
            {npc.npcType}
          </p>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px' }}>
        {npc.flavorText && (
          <p style={{ fontStyle: 'italic', fontSize: 12, color: '#5a4a2a', margin: '0 0 8px', lineHeight: 1.5 }}>
            <RollableText text={npc.flavorText} label={npc.name} onRoll={onRoll} />
          </p>
        )}

        {npc.motives && (
          <p style={{ fontSize: 12, margin: '0 0 10px', lineHeight: 1.55 }}>
            <strong style={{ fontWeight: 500 }}>Motivos &amp; Táticas:</strong>{' '}
            <RollableText text={npc.motives} label={npc.name} onRoll={onRoll} />
          </p>
        )}

        {/* Stats box */}
        <div style={{
          border: '1px solid rgba(139,112,48,0.4)',
          padding: '7px 10px',
          margin: '0 0 10px',
          background: 'rgba(240,232,208,0.6)',
          fontSize: 11.5,
        }}>
          {/* Row 1: Combat stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 4, alignItems: 'baseline' }}>
            <StatPair label="Difficulty" value={npc.difficulty} />
            <StatPair label="HP" value={npc.hp} />
            <StatPair label="AC" value={npc.ac} />
            {npc.atkDesc && <StatPair label="ATK" value={npc.atkDesc} />}
            {npc.weaponDesc && <StatPair label="Weapon" value={npc.weaponDesc} />}
          </div>

          <hr style={{ border: 'none', borderTop: '0.5px solid rgba(139,112,48,0.35)', margin: '4px 0' }} />

          {/* Row 2: Level + ability modifiers */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 4, alignItems: 'baseline' }}>
            <StatPair label="LV" value={npc.level} />
            {npc.movement && <StatPair label="MV" value={npc.movement} />}
            {npc.alignment && <StatPair label="AL" value={npc.alignment} />}
            <StatPair label="FOR" value={formatMod(npc.stats.str)} />
            <StatPair label="DES" value={formatMod(npc.stats.dex)} />
            <StatPair label="CON" value={formatMod(npc.stats.con)} />
            <StatPair label="INT" value={formatMod(npc.stats.int)} />
            <StatPair label="SAB" value={formatMod(npc.stats.wis)} />
            <StatPair label="CAR" value={formatMod(npc.stats.cha)} />
          </div>

          {npc.experience && (
            <>
              <hr style={{ border: 'none', borderTop: '0.5px solid rgba(139,112,48,0.35)', margin: '4px 0' }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 500, fontSize: 11, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', color: 'var(--parchment-light)', whiteSpace: 'nowrap' }}>
                  Experience:
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-deep)', fontFamily: 'var(--font-body)' }}>
                  {npc.experience}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Features */}
        {npc.features.length > 0 && (
          <>
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderBottom: '1.5px solid rgba(26,20,8,0.6)',
              paddingBottom: 2,
              margin: '0 0 8px',
              fontFamily: 'var(--font-heading)',
              color: 'var(--ink-deep)',
            }}>
              Features
            </div>

            {npc.features.map((feat, i) => {
              const html = feat.description
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
              return (
                <div key={i} style={{ fontSize: 12, margin: '0 0 7px', lineHeight: 1.55 }}>
                  <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#111' }}>
                    {feat.title}
                  </span>
                  {feat.tag && (
                    <span style={{ fontStyle: 'italic', color: '#555' }}>
                      {' '}— {feat.tag}.
                    </span>
                  )}{' '}
                  <span
                    onClick={onRoll ? (e) => {
                      const formula = (e.target as HTMLElement).dataset.formula
                      if (formula) onRoll(rollFormula(formula, feat.title, formula))
                    } : undefined}
                    dangerouslySetInnerHTML={{ __html: onRoll ? injectDiceSpans(html) : html }}
                  />
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
