'use client'

import { useState } from 'react'
import { getItem } from '@/data/equipment/index'
import { getClass } from '@/data/classes/index'
import { useSlots } from '@/hooks/useSlots'
import type { KnowledgeArea } from '@/types/character.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Props {
  classId: string
  str: number
  knowledgeAreas: KnowledgeArea[]
  onKnowledgeAreasChange: (areas: KnowledgeArea[]) => void
}

export function StepEquipment({ classId, str, knowledgeAreas, onKnowledgeAreasChange }: Props) {
  const cls = getClass(classId)
  const equipment = (cls?.startingGear ?? []).map(id => ({
    itemId: id,
    slots: getItem(id)?.slots ?? 1,
  }))
  const { max, used } = useSlots(str, equipment)

  const [kaName, setKaName] = useState('')
  const [kaBonus, setKaBonus] = useState(0)

  function addArea() {
    const trimmed = kaName.trim()
    if (!trimmed) return
    onKnowledgeAreasChange([...knowledgeAreas, { name: trimmed, bonus: kaBonus }])
    setKaName('')
    setKaBonus(0)
  }

  function removeArea(idx: number) {
    onKnowledgeAreasChange(knowledgeAreas.filter((_, i) => i !== idx))
  }

  const pct = max > 0 ? Math.min(1, used / max) : 0
  const encumbered = used > max

  return (
    <div className="flex flex-col gap-6">
      {/* Equipment list */}
      <section>
        <div className={SECTION_LABEL_CLASS}>Equipamento Inicial</div>
        <p className={SECTION_NOTE_CLASS}>
          O equipamento de início é determinado pela sua classe.
          Novos itens poderão ser adicionados na ficha.
        </p>

        {/* Slot bar */}
        <div className="mt-3.5 mb-3">
          <div className="mb-[5px] flex items-center justify-between">
            <span
              className={cn(
                'font-heading text-[7px] tracking-[0.16em] uppercase',
                encumbered ? 'text-[var(--blood-bright)]' : 'text-muted-foreground',
              )}
            >
              Slots de Carga
            </span>
            <span
              className={cn(
                'font-mono text-[9px]',
                encumbered ? 'text-[var(--blood-bright)]' : 'text-[var(--parchment-light)]',
              )}
            >
              {used} / {max}
            </span>
          </div>
          <Progress
            value={pct * 100}
            className="gap-0"
            aria-label={`Slots de carga: ${used} de ${max}`}
          >
            <ProgressTrack className="h-[3px] rounded-sm bg-[var(--border)]">
              <ProgressIndicator
                className={cn(
                  'transition-[width] duration-300',
                  encumbered
                    ? 'bg-[var(--blood-mid)]'
                    : 'bg-[linear-gradient(90deg,var(--gold-oxidized),var(--candle-amber))]',
                )}
              />
            </ProgressTrack>
          </Progress>
        </div>

        <ItemGroup className="gap-1">
          {equipment.map((e, i) => {
            const item = getItem(e.itemId)
            return (
              <Item
                key={i}
                variant="outline"
                size="sm"
                className="justify-between rounded-sm border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
              >
                <ItemContent className="gap-0">
                  <ItemTitle className="text-xs font-normal text-[var(--parchment-light)]">
                    {item?.name ?? e.itemId}
                  </ItemTitle>
                </ItemContent>
                <span className="font-mono text-muted-foreground text-[9px]">
                  {e.slots} slot{e.slots !== 1 ? 's' : ''}
                </span>
              </Item>
            )
          })}
        </ItemGroup>
      </section>

      {/* Knowledge Areas */}
      <section>
        <div className={SECTION_LABEL_CLASS}>Áreas de Conhecimento</div>
        <p className={SECTION_NOTE_CLASS}>
          Habilidades, ofícios e saberes que o personagem domina além do combate.
          Adicione um bônus que reflete proficiência.
        </p>

        {knowledgeAreas.length > 0 && (
          <ItemGroup className="mt-3 mb-2.5 gap-1">
            {knowledgeAreas.map((ka, i) => (
              <Item
                key={i}
                variant="outline"
                size="sm"
                className="gap-2.5 rounded-sm border-[var(--border)] bg-[var(--card)] px-3 py-2"
              >
                <ItemContent className="gap-0">
                  <ItemTitle className="text-xs font-normal text-[var(--parchment-light)]">
                    {ka.name}
                  </ItemTitle>
                </ItemContent>
                <span
                  className={cn(
                    'font-mono min-w-[28px] text-right text-[10px]',
                    ka.bonus >= 0 ? 'text-[var(--verdigris-light)]' : 'text-[var(--blood-mid)]',
                  )}
                >
                  {ka.bonus >= 0 ? `+${ka.bonus}` : `${ka.bonus}`}
                </span>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeArea(i)}
                    aria-label={`Remover ${ka.name}`}
                    className="font-mono text-muted-foreground text-[11px]"
                  >
                    ×
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}

        {/* Add area form */}
        <div className={cn('flex gap-1.5', knowledgeAreas.length > 0 ? 'mt-0' : 'mt-3')}>
          <Input
            type="text"
            value={kaName}
            onChange={e => setKaName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addArea()}
            placeholder="ex.: Herbalismo, Ferraria..."
            aria-label="Nome da área de conhecimento"
            className="h-auto flex-1 rounded-sm border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-xs text-[var(--parchment-pale)] focus-visible:border-[var(--primary)]"
          />
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setKaBonus(b => b - 1)}
              aria-label="Diminuir bônus"
              className={BONUS_BTN_CLASS}
            >
              −
            </Button>
            <span
              className={cn(
                'font-mono min-w-[28px] text-center text-[11px]',
                kaBonus >= 0 ? 'text-[var(--verdigris-light)]' : 'text-[var(--blood-mid)]',
              )}
            >
              {kaBonus >= 0 ? `+${kaBonus}` : `${kaBonus}`}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setKaBonus(b => b + 1)}
              aria-label="Aumentar bônus"
              className={BONUS_BTN_CLASS}
            >
              +
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={addArea}
            className="h-auto rounded-sm border-[var(--border)] bg-[var(--border)] px-3 py-2 text-[9px] tracking-[0.1em] text-[var(--parchment-light)]"
          >
            + Add
          </Button>
        </div>
      </section>
    </div>
  )
}

const SECTION_LABEL_CLASS =
  'font-heading mb-1.5 text-[8px] tracking-[0.22em] text-[var(--candle-amber)] uppercase'

const SECTION_NOTE_CLASS = 'text-muted-foreground text-[10px] leading-normal italic'

const BONUS_BTN_CLASS =
  'font-mono rounded-sm border-[var(--border)] bg-[var(--card)] text-xs text-[var(--parchment-light)]'
