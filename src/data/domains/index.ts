/**
 * Domains of Dread — mirrors the "Domínios da Terra das Brumas" database in the
 * campaign wiki.
 *
 * A home domain sets the character's cultural expectations, their folklore and
 * their everyday survival assumptions as a native. `commonExperiences` holds
 * the **roleplay truths**: they shape worldview, fears and expectations, and
 * players should use them to steer decisions, suspicions and reactions to the
 * supernatural.
 *
 * `languages` is the pool a native may draw their domain language from;
 * `religions` names the faiths one actually meets there.
 */

export interface Domain {
  id: string
  name: string
  /** Where the domain sits on the map — Núcleo, Ilhas do Terror, and so on. */
  region: string
  /** The Darklord, when the domain has a named one. */
  darkLord?: string
  /** The land itself, in one line. */
  description: string
  /** What a native takes for granted — the roleplay truths. */
  commonExperiences?: string
  languages: string[]
  religions: string[]
}

export const DOMAINS: Domain[] = [
  {
    id: 'avonleigh',
    name: 'Avonleigh',
    region: 'Terras Sombrias',
    description: 'Floresta fantasmagórica mergulhada em escuridão eterna e névoa úmida.',
    languages: [],
    religions: [],
  },
  {
    id: 'barovia',
    name: 'Barovia',
    region: 'Núcleo',
    darkLord: 'Conde Strahd von Zarovich',
    description: 'Reino rural e severo nas montanhas Balinoks, com florestas densas e picos nevados.',
    commonExperiences:
      'Familiaridade com histórias de vampiros e mortos-vivos; aldeões desconfiam de magia e estrangeiros.',
    languages: ['Balok', 'Luktar', 'Vaasi', 'Sithican', 'Forfarian', 'Thaani'],
    religions: ['O Senhor da Manhã'],
  },
  {
    id: 'borca',
    name: 'Borca',
    region: 'Núcleo',
    darkLord: 'Ivana Boritsi',
    description: 'Terra fértil e bela, famosa por suas fontes termais e alimentos naturalmente envenenados.',
    commonExperiences: 'Veneno, intriga e etiqueta são conhecimentos comuns.',
    languages: ['Balok', 'Mordentish', 'Falkovnian', 'Luktar', 'Halfling'],
    religions: ['Ezra'],
  },
  {
    id: 'darkon',
    name: 'Darkon',
    region: 'Núcleo',
    darkLord: 'Azalin Rex',
    description: 'O maior domínio do Núcleo, com paisagens variadas de montanhas vulcânicas a pântanos salgados.',
    commonExperiences:
      'Lacunas de memória e história mutável são consideradas normais; registros não são confiáveis.',
    languages: [
      'Darkonese', 'Halfling', 'Gnomo', 'Élfico', 'Anão',
      'Falkovnian', 'Lamordiano', 'Mordentish', 'Tepestani', 'Vaasi',
    ],
    religions: ['A Ordem Eterna'],
  },
  {
    id: 'dementlieu',
    name: 'Dementlieu',
    region: 'Núcleo',
    darkLord: 'Marcel Guignol (governante)',
    description: 'Domínio costeiro civilizado, centro de cultura, artes e avanços tecnológicos.',
    languages: ['Mordentish', 'Lamordiano', 'Falkovnian', 'Halfling'],
    religions: ['Ezra'],
  },
  {
    id: 'falkovnia',
    name: 'Falkovnia',
    region: 'Núcleo',
    darkLord: 'Vlad Drakov',
    description: 'Estado militar sinistro sob tirania, conhecido como o celeiro do Núcleo pela produção de grãos.',
    commonExperiences:
      'Regime militar, treinamentos e sobrevivência durante cercos fazem parte das memórias de infância.',
    languages: ['Falkovnian', 'Darkonese', 'Balok', 'Mordentish', 'Halfling', 'Gnomo', 'Élfico', 'Anão'],
    religions: ['Hala', 'Ezra'],
  },
  {
    id: 'forlorn',
    name: 'Forlorn',
    region: 'Núcleo',
    description: "Planalto desolado e fustigado por gases tóxicos, habitado quase exclusivamente por 'goblyns'.",
    commonExperiences: 'Ruínas mais antigas que a memória cercam assentamentos; abandono parece natural.',
    languages: [],
    religions: [],
  },
  {
    id: 'har-akir',
    name: "Har'Akir",
    region: 'Ermos Âmbar',
    darkLord: 'Ankhtepot',
    description: 'Deserto escaldante com túmulos antigos ocultos sob as areias e civilização em oásis.',
    commonExperiences: 'Maldições antigas, tumbas e julgamento divino moldam a cautela diária.',
    languages: ['Akiri', 'Pharazian'],
    religions: ['Panteão Akiri'],
  },
  {
    id: 'hazlan',
    name: 'Hazlan',
    region: 'Núcleo',
    darkLord: 'Hazlik',
    description: 'Terra de planícies áridas e montanhas escarpadas, marcada por opressão severa e magia antiga.',
    languages: ['Vaasi', 'Halfling', 'Gnomo', 'Balok'],
    religions: ['O Legislador', 'Hala'],
  },
  {
    id: 'i-cath',
    name: "I'Cath",
    region: 'Fronteiras Nebulosas',
    darkLord: 'Tsien Chiang',
    description:
      'Reino inspirado na China feudal, com montanhas imponentes, templos antigos e vilas rurais. Governado por tradições rígidas e dominado por espíritos ancestrais.',
    languages: [],
    religions: [],
  },
  {
    id: 'invidia',
    name: 'Invidia',
    region: 'Núcleo',
    darkLord: 'Malocchio Aderre',
    description: 'Região de florestas exuberantes e rios, onde as paixões e o ódio são facilmente inflamados.',
    languages: ['Balok', 'Mordentish', 'Falkovnian', 'Luktar', 'Vaasi'],
    religions: ['Ezra', 'Hala'],
  },
  {
    id: 'kartakass',
    name: 'Kartakass',
    region: 'Núcleo',
    darkLord: 'Harkon Lukas',
    description: 'Terra de colinas e cavernas conhecida por sua cultura musical e lendas de lobos.',
    commonExperiences:
      'Histórias, canções e performances são usadas para esconder verdades ou revelá-las com segurança.',
    languages: ['Vaasi', 'Balok', 'Sithican'],
    religions: ['Ezra', 'Hala'],
  },
  {
    id: 'keening',
    name: 'Keening',
    region: 'Ilhas do Terror',
    description: 'Região montanhosa desprovida de vida, onde apenas mortos-vivos habitam as ruínas.',
    languages: [],
    religions: [],
  },
  {
    id: 'klorr',
    name: 'Klorr',
    region: 'Domínios Flutuantes',
    darkLord: "Saidra d'Honaire",
    description:
      'Cidade-estado suspensa entre as estrelas, com arquitetura impossível e paisagens que desafiam a gravidade. Seus habitantes estudam os segredos do multiverso.',
    languages: [],
    religions: [],
  },
  {
    id: 'lamordia',
    name: 'Lamordia',
    region: 'Núcleo',
    darkLord: 'Barão von Aubrecker (governante)',
    description: 'Reino costeiro gélido e racionalista, assolado por invernos brutais e tempestades de neve.',
    commonExperiences: 'A ciência é mais confiável que a fé; emoções são frequentemente reprimidas socialmente.',
    languages: ['Lamordiano'],
    religions: ['Racionalismo/Ateísmo'],
  },
  {
    id: 'markovia',
    name: 'Markovia',
    region: 'Ilhas do Terror',
    description: "Ilha tropical com florestas densas e 'homens-besta' bipedais.",
    languages: [],
    religions: [],
  },
  {
    id: 'mordent',
    name: 'Mordent',
    region: 'Núcleo',
    darkLord: 'Lorde Jules Weathermay (governante)',
    description: 'Terra de charnecas nebulosas, vilas de pescadores e mansões assombradas.',
    commonExperiences: 'Histórias de fantasmas são tratadas como avisos práticos, não superstição.',
    languages: ['Mordentish', 'Falkovnian', 'Vaasi'],
    religions: ['Ezra', 'Hala'],
  },
  {
    id: 'necropolis',
    name: 'Necropolis',
    region: 'Darkon',
    darkLord: 'Death (Morte)',
    description: 'Antiga cidade de Il Aluk, agora habitada exclusivamente por mortos-vivos após o Réquiem.',
    commonExperiences: 'A presença da morte é constante; silêncio e cinzas são familiares.',
    languages: [],
    religions: [],
  },
  {
    id: 'nidala',
    name: 'Nidala',
    region: 'Terras Sombrias',
    darkLord: 'Elena Faithhold',
    description: 'Reino de natureza selvagem rigorosamente vigiado por cavaleiros sagrados.',
    languages: [],
    religions: [],
  },
  {
    id: 'nova-vaasa',
    name: 'Nova Vaasa',
    region: 'Núcleo',
    darkLord: 'Príncipe Othmar Bolshnik',
    description: 'Vastos campos de gramíneas dominados por cavalos e cidades assoladas por pobreza extrema.',
    languages: [],
    religions: [],
  },
  {
    id: 'odiare',
    name: 'Odiare',
    region: 'Ilhas do Terror',
    darkLord: 'Maligno (marionete)',
    description: 'Vila italiana onde a maioria dos adultos foi massacrada, restando apenas jovens e crianças.',
    languages: ['Vaasi', 'Halfling', 'Gnomo', 'Balok', 'Darkonese'],
    religions: ['O Legislador'],
  },
  {
    id: 'paridon',
    name: 'Paridon',
    region: 'Zherisia',
    darkLord: 'Skeeve (implícito por conexões com Timor)',
    description: 'Cidade isolada coberta por névoa espessa, com arquitetura de pedra e ruas de paralelepípedo.',
    languages: ['Zherisiano'],
    religions: ['Divindade da Humanidade'],
  },
  {
    id: 'pharazia',
    name: 'Pharazia',
    region: 'Ermos Âmbar',
    darkLord: 'Diamabel',
    description: 'Deserto vasto governado por leis puritanas severas e códigos de conduta rígidos.',
    languages: ['Pharazian'],
    religions: ['Reverência a Diamabel'],
  },
  {
    id: 'richemulot',
    name: 'Richemulot',
    region: 'Núcleo',
    darkLord: 'Jacqueline Renier',
    description: 'Domínio de cidades grandes e antigas que parecem subpovoadas, ligadas por esgotos elaborados.',
    commonExperiences: 'Sobrevivência urbana, suspeita de doenças e espaços apertados são normais.',
    languages: ['Mordentish', 'Halfling', 'Balok', 'Falkovnian'],
    religions: ['Ezra', 'Hala'],
  },
  {
    id: 'rokushima-taiyoo',
    name: 'Rokushima Taiyoo',
    region: 'Ilhas do Terror',
    darkLord: 'Shujins (quatro lordes em guerra)',
    description: 'Arquipélago exótico em um mar venenoso, com cultura baseada em honra e artes delicadas.',
    languages: [],
    religions: [],
  },
  {
    id: 'sanguinia',
    name: 'Sanguinia',
    region: 'Terras Gélidas',
    darkLord: 'Príncipe Ladislav Mircea',
    description: 'Montanhas congeladas com florestas de coníferas e vilas protegidas contra o frio extremo.',
    languages: [],
    religions: [],
  },
  {
    id: 'sebua',
    name: 'Sebua',
    region: 'Ermos Âmbar',
    description: 'Terra deserta e maldita habitada apenas por crianças selvagens em ruínas.',
    languages: [],
    religions: [],
  },
  {
    id: 'shadowborn-manor',
    name: 'Shadowborn Manor',
    region: 'Terras Sombrias',
    description: 'Propriedade ancestral cercada por uma muralha de alabastro impenetrável.',
    languages: [],
    religions: [],
  },
  {
    id: 'sithicus',
    name: 'Sithicus',
    region: 'Núcleo',
    darkLord: 'Azrael (anão déspota)',
    description:
      'Reino de elfos reclusos e apáticos, com florestas densas e torres de madeira viva em apodrecimento.',
    languages: ['Sithican'],
    religions: ['Ezra', 'Hala'],
  },
  {
    id: 'souragne',
    name: 'Souragne',
    region: 'Ilhas do Terror',
    darkLord: 'Anton Misroi (Lorde dos Mortos)',
    description: 'Delta de rio pantanoso com bayous escuros, jacarés e cultura baseada em plantation.',
    languages: ['Souragnien'],
    religions: ['Os Loa'],
  },
  {
    id: 'sri-raji',
    name: 'Sri Raji',
    region: 'Verdurous Lands',
    darkLord: 'Maharaja Arijani',
    description: 'Selvas tropicais densas com cidades muradas cercadas por plantações de arroz.',
    languages: ['Rajiano'],
    religions: ['Panteão Rajiano'],
  },
  {
    id: 'tepest',
    name: 'Tepest',
    region: 'Núcleo',
    description: 'Florestas nodosas e místicas onde a população vive em histeria contra fadas e bruxas.',
    languages: ['Tepestani', 'Darkonese', 'Vaasi', 'Sylvan'],
    religions: ['Belenus', 'O Legislador'],
  },
  {
    id: 'timor',
    name: 'Timor',
    region: 'Zherisia',
    description: 'Labirinto subterrâneo de esgotos fétidos localizado abaixo da cidade de Paridon.',
    languages: [],
    religions: [],
  },
  {
    id: 'valachan',
    name: 'Valachan',
    region: 'Núcleo',
    darkLord: 'Barão Urik von Kharkov',
    description: 'Domínio montanhoso de florestas perenes habitado por panteras negras lendárias.',
    languages: ['Vaasi', 'Mordentish', 'Gnomo', 'Sithican'],
    religions: ['Ezra', 'Hala'],
  },
  {
    id: 'vechor',
    name: 'Vechor',
    region: 'Núcleo',
    darkLord: 'Easan, o Louco',
    description: 'Terra de caos geográfico onde a paisagem, o clima e o céu mudam de forma imprevisível.',
    languages: [],
    religions: [],
  },
  {
    id: 'verbrek',
    name: 'Verbrek',
    region: 'Núcleo',
    description: 'Terra selvagem de florestas primordiais onde lobisomens são os verdadeiros mestres.',
    languages: [],
    religions: [],
  },
  {
    id: 'vorostokov',
    name: 'Vorostokov',
    region: 'Terras Gélidas',
    darkLord: 'Gregor Zolnik',
    description: 'Vale vasto sob inverno perpétuo, onde a sobrevivência depende da caça de renas.',
    languages: [],
    religions: [],
  },
  {
    id: 'wildlands',
    name: 'Wildlands',
    region: 'Verdurous Lands',
    description: 'Região puramente selvagem de savanas e selvas onde não existem assentamentos humanos.',
    languages: [],
    religions: [],
  },
]

const byId = new Map(DOMAINS.map(d => [d.id, d]))

export function getDomain(id: string): Domain | undefined {
  return byId.get(id)
}

/** All domain ids, useful for ancestries that accept any domain ('*'). */
export const ALL_DOMAIN_IDS = DOMAINS.map(d => d.id)
