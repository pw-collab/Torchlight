import type { Archetype } from '@/types/archetype.types'

export type { Archetype, ArchetypeKitItem } from '@/types/archetype.types'

/**
 * Archetype catalog — mirrors the "Arquétipos" database in the campaign wiki.
 *
 * The wiki defines a talent for five archetypes (Cavaleiro Errante, Lutador de
 * Arena, Metafísico, Necromante, Soldado); the rest were written here, in the
 * shape those five set: a named rule, one clear trigger, one clear effect.
 * Every drafted talent is marked with a comment so the table can tell which
 * lines are the wiki's and which are still up for review.
 *
 * Questions and connections stay as the wiki has them — only two archetypes
 * carry them so far, and the UI stays quiet about the rest.
 */
export const ARCHETYPES: Archetype[] = [
  {
    id: 'alquimista',
    name: 'Alquimista',
    classIds: ['plague-doctor', 'witch'],
    glyph: '⚗',
    summary: 'Escolha o Alquimista se você quer moldar corpos e destinos por meio de misturas voláteis.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Mistura instável. Uma vez por descanso, você prepara uma dose volátil com os reagentes que tem à mão: escolha um elixir ou poção que já saiba produzir e prepare-o sem gastar componentes. Se o teste falhar, a mistura estoura nas suas mãos e causa 1d4 de dano.',
    alliesRivals: 0,
  },
  {
    id: 'anacoreta',
    name: 'Anacoreta',
    classIds: ['paladin', 'priest'],
    glyph: '✚',
    summary: 'Escolha o Anacoreta se você quer que fé, devoção e dever definam seu caminho.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Andarilho das Brumas. A fé em Ezra o sustenta onde a cerração engole as estradas: você tem vantagem em testes para atravessar as Brumas sem se perder e para encontrar abrigo em terras que nunca pisou. 1/dia, ao recitar as litanias da Guardiã em voz alta, você e os aliados próximos repetem um teste falho contra medo, horror ou efeito das Brumas.',
    alliesRivals: 2,
  },
  {
    id: 'arcabuzeiro',
    name: 'Arcabuzeiro',
    classIds: ['artificer', 'ranger'],
    glyph: '⚙',
    summary: 'Escolha o Arcabuzeiro se você quer precisão, poder de fogo e inovação no campo de batalha.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Pólvora e paciência. Recarregar uma arma de pólvora não consome sua ação uma vez por rodada. Se gastar uma rodada inteira mirando, seu próximo ataque à distância é feito com vantagem.',
    alliesRivals: 0,
  },
  {
    id: 'arcanista',
    name: 'Arcanista',
    classIds: ['wizard'],
    glyph: '✶',
    summary: 'Escolha o Arcanista se você quer domínio estruturado sobre forças arcanas.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Método arcano. Escolha uma escola de magia. Você recebe +1 em testes de conjuração de magias dessa escola e tem vantagem em testes para identificar magias e efeitos mágicos da mesma escola.',
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
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Estudo da presa. Após observar uma criatura por uma rodada, faça um teste de INT (DC 12). Em sucesso, você recorda uma fraqueza dela e tem vantagem no primeiro ataque que fizer contra ela nesta cena.',
    alliesRivals: 3,
  },
  {
    id: 'companheiro-primevo',
    name: 'Companheiro Primevo',
    classIds: ['druid'],
    glyph: '❧',
    summary: 'Escolha o Companheiro Primevo se você quer um vínculo profundo com uma besta guiada pelo instinto.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Vínculo primevo. Você tem um animal companheiro do tamanho de um lobo ou menor. Ele age no seu turno, tem HP igual ao seu nível mais seu modificador de SAB, e ataca causando 1d6. Se ele morrer, você pode formar um novo vínculo depois de uma noite em terreno selvagem.',
    alliesRivals: 0,
  },
  {
    id: 'detetive',
    name: 'Detetive',
    classIds: ['bard'],
    glyph: '☉',
    summary: 'Escolha o Detetive se você quer revelar segredos através de observação e dedução.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Olhar de investigador. Ao examinar uma cena, pergunte ao mestre um detalhe que passaria despercebido — ele responde com a verdade, mas não com a interpretação. 1/cena, você tem vantagem em um teste para relacionar pistas ou desmascarar uma mentira.',
    alliesRivals: 1,
  },
  {
    id: 'erudito',
    name: 'Erudito',
    classIds: ['wizard', 'plague-doctor'],
    glyph: '✎',
    summary: 'Escolha o Erudito se você quer que o conhecimento profundo seja sua maior arma.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Biblioteca mental. Você tem vantagem em testes de INT para recordar história, heráldica, anatomia ou lendas locais. Uma vez por descanso, ao consultar seus livros por dez minutos, converta um teste de conhecimento falho em sucesso.',
    alliesRivals: 1,
  },
  {
    id: 'essencialista',
    name: 'Essencialista',
    classIds: ['wizard', 'sorcerer'],
    glyph: '✺',
    summary: 'Escolha o Essencialista se você quer magia bruta e indomada fluindo de dentro de você.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Sangue em brasa. Escolha um tipo de dano elemental. Suas magias que causam esse tipo de dano causam +1 de dano por dado — e, quando você falha em um teste de conjuração delas, sofre 1 de dano.',
    alliesRivals: 1,
  },
  {
    id: 'inquisidor',
    name: 'Inquisidor',
    classIds: ['priest', 'monk'],
    glyph: '⚖',
    summary: 'Escolha o Inquisidor se você quer impor fé e julgamento através de disciplina e zelo.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Interrogatório inclemente. Você tem vantagem em testes para detectar mentiras e para intimidar durante um interrogatório. Uma criatura que você acusar em voz alta de heresia ou de pacto sofre −1 em testes contra você até o fim da cena.',
    alliesRivals: 2,
  },
  {
    id: 'lutador-de-arena',
    name: 'Lutador de Arena',
    classIds: ['warrior', 'barbarian'],
    glyph: '⚔',
    summary: 'Escolha o Lutador de Arena se você quer transformar violência bruta e resistência em sobrevivência.',
    // O primeiro parágrafo é do wiki; a regra abaixo dele foi redigida aqui.
    talent:
      'O corpo é sua maior arma. Em arenas clandestinas, fossos de lama ou jaulas improvisadas, você aprendeu que a violência não é glória — é sobrevivência. Cada cicatriz é um pagamento recebido por continuar respirando.\nSeus ataques desarmados causam 1d4 de dano e você tem vantagem em testes para agarrar, derrubar ou desarmar. 1/cena, quando um golpe corpo a corpo o atinge, você pode revidar imediatamente com um ataque desarmado contra quem o acertou.',
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
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Leitura proibida. Você lê qualquer texto ocultista sem precisar de tradução. 1/dia, ao examinar um símbolo, sinal ou ritual sobrenatural, faça um teste de SAB (DC 12): em sucesso, descobre o que ele invoca e o preço que cobra; em falha, faça um teste de horror.',
    alliesRivals: 4,
  },
  {
    id: 'patife',
    name: 'Patife',
    classIds: ['bard', 'thief'],
    glyph: '♠',
    summary: 'Escolha o Patife se você quer usar charme, truques e oportunismo para abrir qualquer porta.',
    // Talento redigido para a mesa — o wiki traz só o rótulo "Charlatan/Smuggler".
    talent:
      'Charlatão e contrabandista. Você tem vantagem em testes para blefar sobre sua identidade e para esconder objetos pequenos de uma revista. Uma vez por cena, você tira do bolso um item mundano e barato que "estava ali o tempo todo".',
    alliesRivals: 2,
  },
  {
    id: 'pirata',
    name: 'Pirata',
    classIds: ['thief'],
    glyph: '⚓',
    summary: 'Escolha o Pirata se você quer viver de riscos, saques e liberdade além da lei.',
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Pé no cordame. Você tem vantagem em testes de escalada, equilíbrio, natação e para manobrar embarcações. Lutando sobre superfícies instáveis — conveses, telhados, carroças em movimento —, você recebe +1 de CA.',
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
    // Talento redigido para a mesa — o verbete do wiki ainda não define o seu.
    talent:
      'Barganha com os espíritos. Oferecendo algo de valor, você pode fazer uma pergunta ao espírito de alguém morto há menos de um dia. 1/descanso, invoque um favor: um aliado próximo repete um teste falho.',
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
