'use client'

import { getArchetypesForClass } from '@/data/archetypes/index'
import { getClass } from '@/data/classes/index'
import { getInventoryItem } from '@/data/inventory/index'
import type { ArchetypeKitItem } from '@/types/archetype.types'
import { TarotPicker, DetailBlock, type TarotOption } from '@/components/creator/TarotPicker'
import { StepProse } from '@/components/creator/StepSection'

interface Props {
  classId: string
  archetypeId: string
  onChange: (id: string) => void
}

/** How a kit entry reads in the UI — catalog name and slots when it has them. */
export function kitLabel(kit: ArchetypeKitItem): { name: string; slots: number; note?: string } {
  const catalog = kit.itemId ? getInventoryItem(kit.itemId) : undefined
  return {
    name: catalog?.name ?? kit.name,
    slots: catalog?.weight ?? kit.slots ?? 1,
    note: catalog?.description && catalog.description !== '-' ? catalog.description : kit.description,
  }
}

export function StepArchetype({ classId, archetypeId, onChange }: Props) {
  const cls = getClass(classId)
  const archetypes = getArchetypesForClass(classId)

  const options: TarotOption[] = archetypes.map(a => ({
    id: a.id,
    title: a.name,
    subtitle: cls?.name ?? 'Arquétipo',
    glyph: a.glyph,
  }))

  return (
    <div className="flex flex-col gap-5">
      <StepProse>
        Arquétipos representam <strong className="text-[var(--parchment-pale)] not-italic">o tipo
        de pessoa que seu personagem é</strong> antes mesmo de suas habilidades entrarem em jogo.
        Eles descrevem história, vivência e abordagem diante do mundo, indo além da classe.
        Enquanto a Classe define <em>como</em> o personagem age mecanicamente — luta, conjura,
        sobrevive — o Arquétipo define <em>por que</em> e <em>de que forma</em> ele faz isso. Dois
        personagens da mesma classe podem ser radicalmente diferentes se escolherem arquétipos
        distintos.
      </StepProse>

      {archetypes.length === 0 ? (
        <p className="text-muted-foreground rounded-sm border border-dashed border-[var(--border)] px-4 py-5 text-center text-[11px] italic">
          {classId
            ? 'Nenhum arquétipo catalogado para esta classe ainda.'
            : 'Escolha uma classe antes de definir o arquétipo.'}
        </p>
      ) : (
        <TarotPicker
          options={options}
          selectedId={archetypeId}
          onSelect={onChange}
          emptyHint="Toque em uma carta para ver o conceito, o talento e as perguntas do arquétipo."
          renderDetail={option => {
            const archetype = archetypes.find(a => a.id === option.id)
            if (!archetype) return null

            return (
              <>
                <p className="text-muted-foreground text-[12px] leading-relaxed whitespace-pre-line italic">
                  {archetype.summary}
                </p>

                {archetype.talent && (
                  <DetailBlock label="Talento">
                    <span className="whitespace-pre-line">{archetype.talent}</span>
                  </DetailBlock>
                )}

                {archetype.kit && archetype.kit.length > 0 && (
                  <DetailBlock label="Item">
                    <ul className="flex flex-col gap-1">
                      {archetype.kit.map(kit => {
                        const { name, slots, note } = kitLabel(kit)
                        return (
                          <li key={name}>
                            <span className="text-[var(--parchment-pale)]">{name}</span>
                            <span className="font-mono text-muted-foreground ml-1.5 text-[9px]">
                              {slots} slot{slots === 1 ? '' : 's'}
                            </span>
                            {note && (
                              <span className="text-muted-foreground block text-[11px] leading-snug italic">
                                {note}
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </DetailBlock>
                )}

                {archetype.questions && archetype.questions.length > 0 && (
                  <DetailBlock label="Perguntas de arquétipo">
                    <p className="text-muted-foreground mb-1 text-[10.5px] italic">
                      Escolha 1 para responder — elas definem como você age.
                    </p>
                    <ol className="flex list-decimal flex-col gap-1 pl-4">
                      {archetype.questions.map(q => (
                        <li key={q} className="text-[11.5px] leading-snug">{q}</li>
                      ))}
                    </ol>
                  </DetailBlock>
                )}

                {archetype.connections && archetype.connections.length > 0 && (
                  <DetailBlock label="Conexões">
                    <p className="text-muted-foreground mb-1 text-[10.5px] italic">
                      Escolha 1 para responder — elas explicam sua relação com o mundo.
                    </p>
                    <ol className="flex list-decimal flex-col gap-1 pl-4">
                      {archetype.connections.map(c => (
                        <li key={c} className="text-[11.5px] leading-snug">{c}</li>
                      ))}
                    </ol>
                  </DetailBlock>
                )}

                {archetype.hook && (
                  <DetailBlock label="Gancho">
                    <span className="italic">{archetype.hook}</span>
                  </DetailBlock>
                )}

                {archetype.alliesRivals != null && archetype.alliesRivals > 0 && (
                  <DetailBlock label="Aliados / Rivais">
                    {archetype.alliesRivals === 1
                      ? 'Você começa com 1 contato herdado do arquétipo — defina-o na etapa de Narrativa.'
                      : `Você começa com ${archetype.alliesRivals} contatos herdados do arquétipo — defina-os na etapa de Narrativa.`}
                  </DetailBlock>
                )}
              </>
            )
          }}
        />
      )}
    </div>
  )
}
