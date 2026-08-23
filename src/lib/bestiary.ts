import type { NPC } from '@/types/npc.types'
import { parseNPCMarkdown } from '@/lib/npcMarkdown'

/** Sem acentos e em minúsculas — quem procura "cripta" acha "Cripta". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export interface BestiaryFilter {
  query: string
  tags: string[]
  onlyFavorites: boolean
}

/**
 * A lista plana vira uma lista que se procura (§6.10).
 *
 * A busca alcança o nome, o tipo e as tags: é por onde o Mestre lembra de um
 * monstro no meio da cena — "aquele da cripta", "o chefe". As tags marcadas
 * somam-se (qualquer uma serve), porque filtrar por interseção esvaziaria a
 * lista antes de ela ajudar.
 */
export function filterBestiary(npcs: NPC[], filter: BestiaryFilter): NPC[] {
  const needle = fold(filter.query.trim())

  return npcs.filter(npc => {
    if (filter.onlyFavorites && !npc.favorite) return false
    if (filter.tags.length > 0 && !npc.tags.some(tag => filter.tags.includes(tag))) return false
    if (needle.length === 0) return true

    const haystack = fold([npc.name, npc.npcType, ...npc.tags].join(' '))
    return haystack.includes(needle)
  })
}

/** Todas as tags em uso, sem repetir, em ordem alfabética. */
export function allTags(npcs: NPC[]): string[] {
  return [...new Set(npcs.flatMap(npc => npc.tags))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

/**
 * Uma variante do mesmo monstro.
 *
 * "Goblin" vira "Goblin (cópia)", e daí em diante o Mestre edita o que muda —
 * que é como se fazem os três goblins com nomes diferentes sem redigitar o
 * statblock três vezes.
 */
export function duplicateOf(npc: NPC): Omit<NPC, 'id' | 'createdAt'> {
  const { id: _id, createdAt: _createdAt, ...rest } = npc
  return { ...rest, name: `${npc.name} (cópia)`, favorite: false }
}

/**
 * Importação em lote: vários statblocks de uma vez.
 *
 * O separador é o `---` do Markdown, que é o que já se usa entre fichas num
 * documento — e, na falta dele, cada `# ` de primeiro nível começa uma ficha
 * nova. Blocos sem nome são descartados em silêncio: colar um documento com
 * cabeçalho e rodapé não deveria criar dois monstros vazios.
 */
export function parseBestiaryImport(markdown: string): Partial<NPC>[] {
  const byRule = markdown.split(/^\s*---\s*$/m)
  const blocks = byRule.length > 1 ? byRule : splitOnHeadings(markdown)

  return blocks
    .map(block => block.trim())
    .filter(block => block.length > 0)
    .map(parseNPCMarkdown)
    .filter(npc => Boolean(npc.name?.trim()))
}

function splitOnHeadings(markdown: string): string[] {
  const lines = markdown.split('\n')
  const blocks: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (/^#\s+\S/.test(line) && current.length > 0) {
      blocks.push(current.join('\n'))
      current = []
    }
    current.push(line)
  }
  if (current.length > 0) blocks.push(current.join('\n'))
  return blocks
}
