import type { Archetype } from '@/types/archetype.types'

export type { Archetype, ArchetypeKitItem } from '@/types/archetype.types'

/**
 * Archetype catalog — mirrors the "Arquétipos" database in the campaign wiki.
 *
 * Entries whose `talent`, `questions` or `connections` are still empty in the
 * wiki are carried here with the concept line alone; the UI renders whatever
 * exists and stays quiet about the rest.
 */
export const ARCHETYPES: Archetype[] = [
  {
    id: 'alquimista',
    name: 'Alquimista',
    classIds: ['plague-doctor', 'witch'],
    glyph: '⚗',
    summary: 'Escolha o Alquimista se você quer moldar corpos e destinos por meio de misturas voláteis.',
    alliesRivals: 0,
  },
  {
    id: 'anacoreta',
    name: 'Anacoreta',
    classIds: ['paladin', 'priest'],
    glyph: '✚',
    summary: 'Escolha o Anacoreta se você quer que fé, devoção e dever definam seu caminho.',
    alliesRivals: 2,
  },
  {
    id: 'arcabuzeiro',
    name: 'Arcabuzeiro',
    classIds: ['artificer', 'ranger'],
    glyph: '⚙',
    summary: 'Escolha o Arcabuzeiro se você quer precisão, poder de fogo e inovação no campo de batalha.',
    alliesRivals: 0,
  },
  {
    id: 'arcanista',
    name: 'Arcanista',
    classIds: ['wizard'],
    glyph: '✶',
    summary: 'Escolha o Arcanista se você quer domínio estruturado sobre forças arcanas.',
    alliesRivals: 1,
  },
  {
    id: 'cavaleiro-errante',
    name: 'Cavaleiro Errante',
    classIds: ['paladin', 'barbarian'],
    glyph: '⚜',
    summary: 'Escolha o Cavaleiro Errante se você quer carregar honra e violência por uma terra despedaçada.',
    talent:
      'Enquanto estiver montado, você tem vantagem em testes de viagem, perseguição e fuga. Você e sua montaria compartilham testes contra medo e pavor; se um obtiver sucesso, ambos são considerados bem-sucedidos.\n1/Cena: após se mover, faça uma ação adicional de movimento, investida ou proteção.',
    alliesRivals: 1,
  },
  {
    id: 'cacador-de-monstros',
    name: 'Caçador de Monstros',
    classIds: ['warlock', 'ranger'],
    glyph: '☠',
    summary: 'Escolha o Caçador de Monstros se você quer rastrear, estudar e explorar as fraquezas dos horrores.',
    alliesRivals: 3,
  },
  {
    id: 'companheiro-primevo',
    name: 'Companheiro Primevo',
    classIds: ['druid'],
    glyph: '❧',
    summary: 'Escolha o Companheiro Primevo se você quer um vínculo profundo com uma besta guiada pelo instinto.',
    alliesRivals: 0,
  },
  {
    id: 'detetive',
    name: 'Detetive',
    classIds: ['bard'],
    glyph: '☉',
    summary: 'Escolha o Detetive se você quer revelar segredos através de observação e dedução.',
    alliesRivals: 1,
  },
  {
    id: 'erudito',
    name: 'Erudito',
    classIds: ['wizard', 'plague-doctor'],
    glyph: '✎',
    summary: 'Escolha o Erudito se você quer que o conhecimento profundo seja sua maior arma.',
    alliesRivals: 1,
  },
  {
    id: 'essencialista',
    name: 'Essencialista',
    classIds: ['wizard', 'sorcerer'],
    glyph: '✺',
    summary: 'Escolha o Essencialista se você quer magia bruta e indomada fluindo de dentro de você.',
    alliesRivals: 1,
  },
  {
    id: 'inquisidor',
    name: 'Inquisidor',
    classIds: ['priest', 'monk'],
    glyph: '⚖',
    summary: 'Escolha o Inquisidor se você quer impor fé e julgamento através de disciplina e zelo.',
    alliesRivals: 2,
  },
  {
    id: 'lutador-de-arena',
    name: 'Lutador de Arena',
    classIds: ['warrior', 'barbarian'],
    glyph: '⚔',
    summary: 'Escolha o Lutador de Arena se você quer transformar violência bruta e resistência em sobrevivência.',
    talent:
      'O corpo é sua maior arma. Em arenas clandestinas, fossos de lama ou jaulas improvisadas, você aprendeu que a violência não é glória — é sobrevivência. Cada cicatriz é um pagamento recebido por continuar respirando.',
    questions: [
      'O que você aprendeu a suportar para vencer?',
      'Qual parte do seu corpo virou uma arma?',
      'O que diferencia você dos outros lutadores do fosso?',
    ],
    connections: [
      'O que te fez continuar entrando no fosso quando já podia ter parado?',
      'Quem lucrava com suas lutas além de você?',
      'O que você perdeu em uma luta que venceu?',
    ],
    alliesRivals: 1,
  },
  {
    id: 'metafisico',
    name: 'Metafísico',
    classIds: ['psionicist', 'warlock'],
    glyph: '◉',
    summary:
      'Você estuda os mistérios da mente, da realidade e do sobrenatural como se fossem problemas a serem compreendidos. Onde outros veem magia ou loucura, você busca padrões, lógica e princípios ocultos que governam o universo.',
    talent:
      'Conhecimento oculto. Pode aprender feitiços que afetam a mente da lista Arcana a partir de um pergaminho, ao estudá-lo por um dia e ter sucesso em um teste de INT. Tanto num sucesso quanto numa falha, o pergaminho é gasto.',
    alliesRivals: 1,
  },
  {
    id: 'necromante',
    name: 'Necromante',
    classIds: ['wizard', 'priest'],
    glyph: '⚰',
    summary:
      'Você estuda, manipula ou barganha com as forças que governam o limite entre vida e morte, enxergando nos mortos conhecimento, poder ou ferramentas que outros temem sequer tocar.',
    talent:
      'Especialidade necromântica. Magias ou habilidades que despertam o alvo da morte podem ter 1 alvo adicional.',
    questions: [
      'O que despertou seu interesse pelos mortos? A perda de alguém querido, um mestre proibido ou a promessa de conhecimento além da vida?',
      'O que você acredita que a morte realmente é? Uma porta, uma ferramenta ou apenas mais uma ilusão da vida?',
      'O que você está disposto a sacrificar para dominar a morte? Sua reputação, sua humanidade ou sua própria alma?',
    ],
    connections: [
      'Quem sabe sobre suas práticas e ainda assim permanece ao seu lado?',
      'Qual morto você ainda não conseguiu esquecer — e por quê?',
      'Que instituição, culto ou autoridade te consideraria uma ameaça se descobrisse seus estudos?',
    ],
    alliesRivals: 0,
  },
  {
    id: 'ocultista',
    name: 'Ocultista',
    classIds: ['monk', 'psionicist'],
    glyph: '☾',
    summary: 'Escolha o Ocultista se você quer explorar verdades ocultas que nenhuma mente sã deveria buscar.',
    alliesRivals: 4,
  },
  {
    id: 'patife',
    name: 'Patife',
    classIds: ['bard', 'thief'],
    glyph: '♠',
    summary: 'Escolha o Patife se você quer usar charme, truques e oportunismo para abrir qualquer porta.',
    talent: 'Charlatão / Contrabandista.',
    alliesRivals: 2,
  },
  {
    id: 'pirata',
    name: 'Pirata',
    classIds: ['thief'],
    glyph: '⚓',
    summary: 'Escolha o Pirata se você quer viver de riscos, saques e liberdade além da lei.',
    alliesRivals: 2,
  },
  {
    id: 'soldado',
    name: 'Soldado',
    classIds: ['warrior', 'artificer'],
    glyph: '⚑',
    summary:
      'Você foi treinado para lutar como parte de algo maior que si mesmo. A disciplina, a cadeia de comando e a experiência no campo de batalha moldaram sua forma de agir, seja servindo a um reino, uma ordem ou um exército mercenário.',
    talent:
      'Estrategista. Quando está lidando com inimigos com fraquezas particulares (como licantropos suscetíveis a prata), seus acertos críticos são como atingir um ponto fraco.',
    alliesRivals: 2,
  },
  {
    id: 'voodan',
    name: 'Voodan',
    classIds: ['witch', 'druid'],
    glyph: '☥',
    summary: 'Escolha o Voodan se você quer extrair poder de espíritos, rituais e laços comunitários.',
    alliesRivals: 1,
  },
]

const byId = new Map(ARCHETYPES.map(a => [a.id, a]))

export function getArchetype(id: string): Archetype | undefined {
  return byId.get(id)
}

/**
 * Archetypes offered to a class — its own, plus the ones marked `'*'`
 * (available to everyone). An unknown class id yields only the universal set.
 */
export function getArchetypesForClass(classId: string): Archetype[] {
  return ARCHETYPES.filter(a => a.classIds.includes('*') || a.classIds.includes(classId))
}
