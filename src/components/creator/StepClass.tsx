'use client'

import { classes, getClassLore } from '@/data/classes/index'
import { TRADITION_LABEL, type ClassTechnique } from '@/types/class.types'
import { TarotPicker, DetailBlock, type TarotOption } from '@/components/creator/TarotPicker'
import { StepProse } from '@/components/creator/StepSection'
import { Badge } from '@/components/ui/badge'

interface Props {
  classId: string
  onChange: (id: string) => void
}

/** Card glyphs — one symbol per vocation, drawn in the hex window. */
export const CLASS_GLYPH: Record<string, string> = {
  commoner: '○',
  artificer: '⚙',
  barbarian: '⚡',
  bard: '♪',
  druid: '❧',
  warrior: '⚔',
  monk: '☯',
  paladin: '⚜',
  'plague-doctor': '☤',
  priest: '✚',
  psionicist: '◉',
  ranger: '↟',
  sorcerer: '✹',
  thief: '☠',
  warlock: '⛧',
  witch: '☾',
  wizard: '✶',
}

const TECH_KIND_LABEL: Record<string, string> = {
  passive: 'Passivo',
  choice: 'Escolha',
  limited_use: 'Usos/Dia',
  spell_like: 'Ativação',
}

const STAT_LABEL: Record<string, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

const CHIP_CLASS =
  'rounded-[1px] border-[var(--border)] bg-black/25 px-2 py-0.5 text-[10px] text-muted-foreground italic'

/** The Commoner has no hit die of its own — its HP is the CON modifier. */
function hitDieLabel(hitDie: number): string {
  return hitDie > 0 ? `d${hitDie}` : 'Mod. CON'
}

export function StepClass({ classId, onChange }: Props) {
  const options: TarotOption[] = classes.map(c => ({
    id: c.id,
    title: c.name,
    subtitle: c.hitDie > 0 ? `Dado d${c.hitDie}` : 'Nível 0',
    glyph: CLASS_GLYPH[c.id] ?? '✦',
  }))

  return (
    <div className="flex flex-col gap-5">
      <StepProse>
        Aventureiros de todas as vocações podem ser encontrados nas Terras das Brumas. Guerreiros,
        magos, clérigos e ladinos — todos têm um lugar aqui. No entanto, o contexto sombrio de
        Ravenloft molda a forma como cada classe é percebida e o papel que desempenha. Um paladino
        não é apenas um cavaleiro sagrado; ele é um milagre raro. Um mago não é apenas um estudioso;
        ele é alguém que mexe com forças que a maioria das pessoas teme com razão.
      </StepProse>

      <p className="text-muted-foreground text-[11px] leading-relaxed italic">
        Uma vez escolhida a classe, você também escolherá um <strong className="not-italic text-[var(--parchment-pale)]">Arquétipo</strong> —
        a especialização que termina de definir o conceito do personagem.
      </p>

      <TarotPicker
        options={options}
        selectedId={classId}
        onSelect={onChange}
        emptyHint="Toque em uma carta para ler a vocação por inteiro."
        renderDetail={option => {
          const cls = classes.find(c => c.id === option.id)
          if (!cls) return null
          const lore = getClassLore(cls.id)
          const techniques = (cls.techniques ?? []).filter((t): t is ClassTechnique => t !== null)
          const casting = cls.spellcasting

          return (
            <>
              {lore?.summary && (
                <p className="text-muted-foreground text-[12px] leading-relaxed italic">
                  {lore.summary}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className={CHIP_CLASS}>
                  Dado de Vida {hitDieLabel(cls.hitDie)}
                </Badge>
                <Badge variant="outline" className={CHIP_CLASS}>{cls.weaponProficiency}</Badge>
                <Badge variant="outline" className={CHIP_CLASS}>{cls.armorProficiency}</Badge>
              </div>

              {lore?.text && (
                <p className="text-[11.5px] leading-relaxed whitespace-pre-line text-[var(--parchment-light)]">
                  {lore.text}
                </p>
              )}

              {techniques.length > 0 && (
                <DetailBlock label="Talentos de classe">
                  <ul className="flex flex-col gap-2">
                    {techniques.map(t => (
                      <li key={t.id} className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="font-mono shrink-0 rounded-[1px] border-0 bg-[var(--border)] px-[5px] py-0.5 text-[7px] tracking-[0.06em] text-[var(--gold-oxidized)]"
                          >
                            {TECH_KIND_LABEL[t.kind ?? 'passive']}
                          </Badge>
                          <span className="font-heading text-[12px] tracking-[0.03em] text-[var(--parchment-pale)]">
                            {t.name}
                          </span>
                        </span>
                        <span className="text-muted-foreground text-[11px] leading-relaxed whitespace-pre-line">
                          {t.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </DetailBlock>
              )}

              {casting && (
                <DetailBlock label="Magia">
                  Lista {casting.tradition ? TRADITION_LABEL[casting.tradition] : 'à escolha'} ·
                  conjuração por {STAT_LABEL[casting.stat]} ·{' '}
                  {(casting.spellsKnown ?? casting.spellsPerDay)[0]} magias no 1º nível.
                </DetailBlock>
              )}

              {cls.talentTable.length > 0 && (
                <DetailBlock label="Tabela de Talentos — 2d6">
                  <ul className="flex flex-col gap-1">
                    {cls.talentTable.map(entry => (
                      <li key={entry.roll} className="flex gap-2">
                        <span className="font-mono w-9 shrink-0 text-[10px] text-[var(--gold-oxidized)]">
                          {entry.roll}
                        </span>
                        <span className="text-muted-foreground text-[11px] leading-snug">
                          {entry.effect}
                        </span>
                      </li>
                    ))}
                  </ul>
                </DetailBlock>
              )}
            </>
          )
        }}
      />
    </div>
  )
}
