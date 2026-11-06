import type { Element, ElementContent } from 'hast'
import type {
  BackgroundDetails,
  Impulses,
  RawBackgroundDetails,
  RawImpulses,
  RawRelations,
  Relations,
  StoryFact,
  StoryInstitution,
  StoryPerson,
} from '@/types/character.types'

/*
 * A aba História, como a ficha do jogador a organiza: capa, História,
 * Por dentro, Pessoas e instituições. Aqui ficam as regras que não são de
 * tela: o formato salvo de cada parte e a leitura dos formatos antigos.
 *
 * Nada aqui apaga o que já foi escrito. Os campos antigos (impulsos em texto
 * corrido, Família / Aliados / Rivais / Facção, Eventos traumáticos) são lidos
 * no formato novo e só deixam de existir no banco quando o jogador salva
 * aquela parte de novo, já convertida.
 */

const BULLET_MARK = /^\s*(?:[-*+\u2022\u25C6\u25C7\u25AA\u25B8\u2192\u2013\u2014]|\d+[.)])\s+/

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Um id para um item novo. `randomUUID` só existe em contexto seguro (https, localhost). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Um bullet é uma linha: quebras viram espaço. */
export function oneLine(value: string): string {
  return value.replace(/\s*[\r\n]+\s*/g, ' ').trim()
}

/**
 * Os bullets de um impulso. Já é lista no formato novo; no antigo era um
 * texto livre, e cada linha vira um bullet, sem o marcador que o jogador
 * tenha digitado ("- ", "• ", "1. ").
 */
export function toBullets(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(v => oneLine(text(v))).filter(Boolean)
  return text(value)
    .split(/\r?\n/)
    .map(line => line.replace(BULLET_MARK, '').trim())
    .filter(Boolean)
}

/** Para salvar: só o que tem texto, cada um numa linha. */
export function cleanBullets(items: string[]): string[] {
  return items.map(oneLine).filter(Boolean)
}

/**
 * Um texto colado num bullet, em bullets. Copiado de um PDF, um item longo
 * chega quebrado em várias linhas: quando há marcadores (◆, •, -, 1.), cada
 * marcador abre um bullet e as linhas sem marcador continuam o anterior. Sem
 * marcador nenhum, cada linha é um bullet.
 */
export function splitPastedBullets(pasted: string): string[] {
  const lines = pasted.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const midLineMark = /\s[\u2022\u25C6\u25C7]\s/
  if (lines.some(l => BULLET_MARK.test(l) || midLineMark.test(l))) {
    const items: string[] = []
    for (const line of lines) {
      // Marcadores no meio da linha também separam: "◆ um ◆ dois".
      const parts = line.split(/\s+(?=[\u2022\u25C6\u25C7]\s)/)
      parts.forEach((part, i) => {
        if (BULLET_MARK.test(part) || i > 0 || items.length === 0) items.push(part.replace(BULLET_MARK, '').trim())
        else items[items.length - 1] = `${items[items.length - 1]} ${part}`
      })
    }
    return items.map(oneLine).filter(Boolean)
  }
  return lines.map(oneLine).filter(Boolean)
}

export function normalizeImpulses(raw: RawImpulses | undefined | null): Impulses {
  return {
    objectives: toBullets(raw?.objectives),
    secrets: toBullets(raw?.secrets),
    flaws: toBullets(raw?.flaws),
    fears: toBullets(raw?.fears),
  }
}

function cleanFacts(raw: unknown): StoryFact[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i): StoryFact => ({
      id: text(item?.id) || `fact-${i}`,
      label: text(item?.label),
      value: text(item?.value),
    }))
    .filter(f => f.label.trim() || f.value.trim())
}

const STORY_TEXT_KEYS = [
  'concept', 'epithet', 'alias', 'hometown', 'theme', 'appearance',
  'origin', 'backstory', 'traumaticEvents', 'companions',
] as const

export function normalizeBackground(raw: RawBackgroundDetails | undefined | null): BackgroundDetails {
  const b = raw ?? {}
  const out: BackgroundDetails = { facts: cleanFacts(b.facts) }
  for (const key of STORY_TEXT_KEYS) {
    const value = b[key]
    if (typeof value === 'string') out[key] = value
  }
  return out
}

// ─── Pessoas e instituições ───────────────────────────────────────────────────

const LEGACY_GROUPS = [
  { key: 'family', role: 'família' },
  { key: 'allies', role: 'aliado' },
  { key: 'rivals', role: 'rival' },
] as const

/** "Nome: o que ele é" ou "Nome, separado por travessão ou hífen, do resto". */
const NAME_SEPARATOR = /^(.+?)(?:\s+[\u2013\u2014-]\s+|:\s+)(.+)$/

function legacyLines(value: string | string[] | undefined): string[] {
  const lines = Array.isArray(value) ? value : text(value).split(/\r?\n/)
  return lines.map(l => text(l).replace(BULLET_MARK, '').trim()).filter(Boolean)
}

/**
 * Família, Aliados e Rivais eram texto livre, uma pessoa por linha (e antes
 * disso, listas de nomes). Cada linha vira uma pessoa: o que vem antes do
 * travessão é o nome, o resto é a nota, e o grupo de onde veio é o papel.
 * Quem aparecia em mais de um grupo vira uma pessoa só, com os dois papéis.
 */
export function legacyPeople(raw: RawRelations): StoryPerson[] {
  const people: StoryPerson[] = []
  for (const { key, role } of LEGACY_GROUPS) {
    legacyLines(raw[key]).forEach((line, i) => {
      const match = line.match(NAME_SEPARATOR)
      const name = (match ? match[1] : line).trim()
      const note = match ? match[2].trim() : ''
      const same = people.find(p => p.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))
      if (same) {
        same.role = `${same.role}; ${role}`
        if (note) same.note = same.note ? `${same.note} ${note}` : note
        return
      }
      people.push({ id: `legacy-${key}-${i}`, name, role, note })
    })
  }
  return people
}

function cleanPeople(raw: unknown): StoryPerson[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i): StoryPerson => ({
      id: text(item?.id) || `person-${i}`,
      name: text(item?.name),
      role: text(item?.role),
      note: text(item?.note),
    }))
    .filter(p => p.name.trim() || p.role.trim() || p.note.trim())
}

function cleanInstitutions(raw: unknown): StoryInstitution[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i): StoryInstitution => ({
      id: text(item?.id) || `institution-${i}`,
      name: text(item?.name),
      note: text(item?.note),
    }))
    .filter(x => x.name.trim() || x.note.trim())
}

/**
 * Relações no formato novo. Enquanto o banco não tem `people` (nem
 * `institutions`), elas vêm dos campos antigos; a primeira vez que o jogador
 * salva esta parte, o formato novo é gravado e os antigos saem.
 */
export function normalizeRelations(raw: RawRelations | undefined | null): Relations {
  if (!raw) return { people: [], institutions: [] }
  const people = Array.isArray(raw.people) ? cleanPeople(raw.people) : legacyPeople(raw)
  const faction = text(raw.faction).trim()
  const institutions = Array.isArray(raw.institutions)
    ? cleanInstitutions(raw.institutions)
    : faction ? [{ id: 'legacy-faction', name: faction, note: 'Sua facção.' }] : []
  return { people, institutions }
}

// ─── O capítulo História ──────────────────────────────────────────────────────

/**
 * O texto do capítulo História. "Eventos traumáticos" era um campo à parte;
 * no formato novo é um quadro destacado dentro do próprio texto, como a
 * "Marca do Pecador" da ficha de referência. Enquanto o campo antigo tiver
 * algo, ele aparece assim no fim da História, e o editor já abre com ele lá.
 */
export function storyMarkdown(details: Pick<BackgroundDetails, 'backstory' | 'traumaticEvents'>): string {
  const story = text(details.backstory).trimEnd()
  const trauma = text(details.traumaticEvents).trim()
  if (!trauma) return story
  const callout = ['## Eventos traumáticos', '', ...trauma.split(/\r?\n/)]
    .map(line => (line.trim() ? `> ${line}` : '>'))
    .join('\n')
  return story ? `${story}\n\n${callout}` : callout
}

// ─── O Markdown da História ───────────────────────────────────────────────────

function isBlank(node: ElementContent): boolean {
  return node.type === 'text' && !node.value.trim()
}

/** O item abre com um trecho em negrito: é o rótulo da coluna. */
function opensWithStrong(element: Element): boolean {
  const first = element.children.find(child => !isBlank(child))
  if (!first || first.type !== 'element') return false
  if (first.tagName === 'strong') return true
  return first.tagName === 'p' && opensWithStrong(first)
}

/**
 * Dentro de um quadro, uma lista em que todo item abre em negrito vira
 * colunas, cada uma com o negrito como rótulo ("Onde queimou" | "Onde calou").
 */
export function isLabelledList(list: Element | undefined): boolean {
  if (!list) return false
  const items = list.children.filter((c): c is Element => c.type === 'element' && c.tagName === 'li')
  return items.length > 0 && items.every(opensWithStrong)
}

// ─── Pequenas regras de texto ─────────────────────────────────────────────────

/**
 * Num campo de uma linha, "1. ", "- ", "# " e "> " no começo são texto, não
 * lista, título ou quadro. A barra faz o Markdown ler o caractere como ele é.
 */
export function escapeLineStart(value: string): string {
  const line = value.trimStart()
  if (/^([-*_])(\s*\1){2,}\s*$/.test(line)) return `\\${line}`
  return line
    .replace(/^(\d+)([.)])(\s|$)/, '$1\\$2$3')
    .replace(/^([-+*])(\s|$)/, '\\$1$2')
    .replace(/^(#{1,6})(\s|$)/, '\\$1$2')
    .replace(/^>/, '\\>')
}

/** "Ralf Alester" → "Ralf". Vazio quando não há nome. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ''
}

/** A alcunha termina com ponto quando a apresentação vem logo depois. */
export function withPeriod(value: string): string {
  const t = value.trim()
  return /[.!?\u2026:;]$/.test(t) ? t : `${t}.`
}
