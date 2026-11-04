'use client'

import type { Class } from '@/types/class.types'
import type { Ancestry } from '@/types/ancestry.types'
import type { Archetype } from '@/types/archetype.types'
import { DetailChip, ChipDetail } from '@/components/shared/DetailChip'

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/** `3` → `III`, as the Figma writes the level on the class tag. Past ten, plain digits. */
function levelNumeral(level: number): string {
  return ROMAN[level] ?? String(level)
}

interface Props {
  name: string
  /**
   * Phones already carry the name above the portrait, so they leave it out
   * here and keep only the tags.
   */
  showName?: boolean
  classData: Class
  level: number
  /** Fills the archetype tag. Omitted, the tag is dropped. */
  archetype?: Archetype
  /** Fills the ancestry tag. Omitted, the tag is dropped. */
  ancestry?: Ancestry
  /** The sheet's languages, listed inside the ancestry tag. */
  languages?: string[]
}

/**
 * Who the character is: the name, then class, archetype and ancestry as
 * coloured tags, with the level, proficiencies, concept and languages one
 * hover (or tap) away. The ancestry traits and the archetype talent are not
 * repeated here: they have their own cards among the techniques.
 */
export function CharacterIdentity({ name, showName = true, classData, level, archetype, ancestry, languages = [] }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {showName && (
        <h1 className="type-display-xl text-foreground m-0 [overflow-wrap:anywhere] [text-wrap:balance]">
          {name}
        </h1>
      )}

      <div className="flex flex-wrap gap-1.5">
        <DetailChip
          tone="class"
          label={classData.name}
          trailing={`Nv ${levelNumeral(level)}`}
          detailLabel="nível e proficiências da classe"
        >
          <ChipDetail label="Nível">{level} · dado de vida d{classData.hitDie}</ChipDetail>
          <ChipDetail label="Armas">{classData.weaponProficiency}</ChipDetail>
          <ChipDetail label="Armaduras">{classData.armorProficiency}</ChipDetail>
        </DetailChip>

        {archetype && (
          <DetailChip tone="archetype" label={archetype.name} detailLabel="conceito e gancho do arquétipo">
            <ChipDetail label="Conceito">{archetype.summary}</ChipDetail>
            {archetype.hook && <ChipDetail label="Gancho">{archetype.hook}</ChipDetail>}
          </DetailChip>
        )}

        {ancestry && (
          <DetailChip tone="ancestry" label={ancestry.name} detailLabel="idiomas da ancestralidade">
            <ChipDetail label="Idiomas">
              {languages.length > 0 ? languages.join(', ') : 'Nenhum idioma registrado.'}
            </ChipDetail>
          </DetailChip>
        )}
      </div>
    </div>
  )
}
