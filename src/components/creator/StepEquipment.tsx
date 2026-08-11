'use client'

import { useMemo, useState } from 'react'
import { getItem } from '@/data/equipment/index'
import { getClass } from '@/data/classes/index'
import { ALL_ITEMS } from '@/data/inventory/index'
import type { Item as CatalogItem } from '@/data/inventory/types'
import { catalogToInventoryItem } from '@/lib/inventory'
import { maxSlots } from '@/lib/slots'
import { useSlots } from '@/hooks/useSlots'
import type { InventoryItem } from '@/types/inventory.types'
import type { KnowledgeArea } from '@/types/character.types'
import { StepProse, StepSection } from '@/components/creator/StepSection'
import { Badge } from '@/components/ui/badge'
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
  /** Creation: gear granted automatically by the class and the archetype. */
  grantedItems?: InventoryItem[]
  /** Creation: everything the player added from the catalog. */
  extraItems?: InventoryItem[]
  onExtraItemsChange?: (items: InventoryItem[]) => void
}

type CatalogTab = 'weapon' | 'armor' | 'gear'

const TAB_LABEL: Record<CatalogTab, string> = {
  weapon: 'Armas',
  armor: 'Armaduras',
  gear: 'Equipamento',
}

export function StepEquipment({
  classId,
  str,
  knowledgeAreas,
  onKnowledgeAreasChange,
  grantedItems,
  extraItems,
  onExtraItemsChange,
}: Props) {
  const cls = getClass(classId)
  const picking = onExtraItemsChange != null

  const [kaName, setKaName] = useState('')
  const [kaBonus, setKaBonus] = useState(0)
  const [tab, setTab] = useState<CatalogTab>('weapon')
  const [query, setQuery] = useState('')

  // Sheet editing keeps the old read-only view of the class's starting gear.
  const legacyGear = useMemo(
    () => (cls?.startingGear ?? []).map(id => ({ itemId: id, slots: getItem(id)?.slots ?? 1 })),
    [cls],
  )

  const granted = grantedItems ?? []
  const extras = extraItems ?? []
  const carried = picking ? [...granted, ...extras] : legacyGear

  const { max, used } = useSlots(str, carried)

  const catalogList = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ALL_ITEMS.filter(item => {
      const matchesTab = tab === 'armor'
        ? item.type === 'armor' || item.type === 'shield'
        : item.type === tab
      if (!matchesTab) return false
      if (item.name === 'None') return false
      return !q || item.name.toLowerCase().includes(q)
    })
  }, [tab, query])

  function addCatalogItem(cat: CatalogItem) {
    onExtraItemsChange?.([...extras, catalogToInventoryItem(cat)])
  }

  function removeExtra(id: string) {
    onExtraItemsChange?.(extras.filter(i => i.id !== id))
  }

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
    <div className="flex flex-col gap-8">
      {/* ── Carried gear ──────────────────────────────────────────────────── */}
      <StepSection title="Equipamento Inicial">
        <StepProse>
          Você pode carregar uma quantidade de itens igual a 10 ou ao seu valor de FOR, o que for
          maior — {str > 0 ? `no seu caso, ${maxSlots(str)} slots` : 'defina os atributos para saber quantos'}.
          {picking && ' O kit do arquétipo e o equipamento da classe já entram nessa conta.'}
        </StepProse>

        {/* Slot bar */}
        <div>
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

        {picking ? (
          <ItemGroup className="gap-1">
            {granted.map(item => (
              <Item
                key={item.id}
                variant="outline"
                size="sm"
                className="justify-between rounded-sm border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
              >
                <ItemContent className="gap-0">
                  <ItemTitle className="text-xs font-normal text-[var(--parchment-light)]">
                    {item.name}
                  </ItemTitle>
                </ItemContent>
                <Badge
                  variant="outline"
                  className="font-mono shrink-0 rounded-[1px] border-0 bg-[var(--border)] px-[5px] py-0.5 text-[7px] tracking-[0.06em] text-[var(--gold-oxidized)]"
                >
                  KIT
                </Badge>
                <span className="font-mono text-muted-foreground text-[9px]">
                  {item.slots} slot{item.slots === 1 ? '' : 's'}
                </span>
              </Item>
            ))}

            {extras.map(item => (
              <Item
                key={item.id}
                variant="outline"
                size="sm"
                className="justify-between rounded-sm border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
              >
                <ItemContent className="gap-0">
                  <ItemTitle className="text-xs font-normal text-[var(--parchment-light)]">
                    {item.name}
                  </ItemTitle>
                </ItemContent>
                <span className="font-mono text-muted-foreground text-[9px]">
                  {item.slots} slot{item.slots === 1 ? '' : 's'}
                </span>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeExtra(item.id)}
                    aria-label={`Remover ${item.name}`}
                    className="text-[var(--destructive)] transition-colors duration-[180ms] hover:text-[var(--blood-bright)]"
                  >
                    ✕
                  </Button>
                </ItemActions>
              </Item>
            ))}

            {carried.length === 0 && (
              <p className="text-muted-foreground text-[11px] italic">
                Nada carregado ainda — escolha uma classe e um arquétipo, ou some itens da lista abaixo.
              </p>
            )}
          </ItemGroup>
        ) : (
          <ItemGroup className="gap-1">
            {legacyGear.map((e, i) => {
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
        )}
      </StepSection>

      {/* ── Catalog picker ────────────────────────────────────────────────── */}
      {picking && (
        <StepSection title="Adicionar da lista">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(TAB_LABEL) as CatalogTab[]).map(id => (
              <Button
                key={id}
                variant="outline"
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                className={cn(
                  'h-auto rounded-sm px-3 py-1.5 text-[9px] tracking-[0.12em] transition-colors duration-150',
                  tab === id
                    ? 'border-[var(--primary)] bg-[var(--border)] text-[var(--parchment-light)]'
                    : 'text-muted-foreground border-[var(--border)] bg-[var(--card)]',
                )}
              >
                {TAB_LABEL[id]}
              </Button>
            ))}
          </div>

          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar item..."
            aria-label="Buscar item"
            className="h-auto rounded-sm border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--parchment-pale)] focus-visible:border-[var(--primary)]"
          />

          <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto pr-1">
            {catalogList.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => addCatalogItem(item)}
                className="tactile flex cursor-pointer items-center gap-2.5 rounded-sm border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left transition-colors duration-150 hover:border-[var(--bone-dim)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] text-[var(--parchment-light)]">
                    {item.name}
                  </span>
                  {item.description && item.description !== '-' && (
                    <span className="text-muted-foreground line-clamp-1 block text-[10px] italic">
                      {item.description}
                    </span>
                  )}
                </span>
                {item.damageDie && item.damageDie !== '-' && (
                  <span className="font-mono shrink-0 text-[9px] text-[var(--gold-oxidized)]">
                    {item.damageDie}
                  </span>
                )}
                {item.acBonus != null && (
                  <span className="font-mono shrink-0 text-[9px] text-[var(--verdigris-light)]">
                    CA {item.acBonus}
                  </span>
                )}
                <span className="font-mono text-muted-foreground shrink-0 text-[9px]">
                  {item.weight} slot{item.weight === 1 ? '' : 's'}
                </span>
                <span className="font-mono shrink-0 text-[12px] text-[var(--candle-amber)]">+</span>
              </button>
            ))}
            {catalogList.length === 0 && (
              <p className="text-muted-foreground px-1 py-3 text-[11px] italic">
                Nenhum item corresponde à busca.
              </p>
            )}
          </div>
        </StepSection>
      )}

      {/* ── Knowledge areas ───────────────────────────────────────────────── */}
      <StepSection title="Áreas de Conhecimento">
        <StepProse>
          Habilidades, ofícios e saberes que o personagem domina além do combate. Adicione um bônus
          que reflete a proficiência.
        </StepProse>

        {knowledgeAreas.length > 0 && (
          <ItemGroup className="gap-1">
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
                    ka.bonus >= 0 ? 'text-[var(--verdigris-light)]' : 'text-[var(--destructive)]',
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

        <div className="flex gap-1.5">
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
                kaBonus >= 0 ? 'text-[var(--verdigris-light)]' : 'text-[var(--destructive)]',
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
            className="h-auto rounded-sm border-[var(--border)] bg-[var(--border)]/15 px-3 py-2 text-[9px] tracking-[0.1em] text-[var(--parchment-light)]"
          >
            + Add
          </Button>
        </div>
      </StepSection>
    </div>
  )
}

const BONUS_BTN_CLASS =
  'font-mono rounded-sm border-[var(--border)] bg-[var(--card)] text-xs text-[var(--parchment-light)]'
