/**
 * Faiths of the Domains of Dread.
 *
 * In the Domains, faith is both shield and weapon. The gods rarely answer
 * directly, and their churches are often as flawed and corrupt as the world
 * around them — so what a character believes says more about them than about
 * any deity.
 *
 * The names match the "Religiões predominantes" options on the domain database,
 * so a home domain can point at the faiths one actually meets there. The
 * descriptions are table-facing summaries, pending a religions database of
 * their own.
 */
export interface Religion {
  id: string
  name: string
  /** Symbol drawn beside the entry. */
  glyph: string
  /** What believing this says about the character, at the table. */
  description: string
}

export const RELIGIONS: Religion[] = [
  {
    id: 'ezra',
    name: 'Ezra',
    glyph: '✠',
    description:
      'A Guardiã contra as brumas, culto mais difundido do Núcleo. Divide-se em seitas que se acusam mutuamente de heresia — ortodoxos em Borca, caridosos em Dementlieu, eruditos em Mordent, militantes em Nova Vaasa.',
  },
  {
    id: 'hala',
    name: 'Hala',
    glyph: '☾',
    description:
      'A Mãe das Três Luas, padroeira de curandeiras e bruxas brancas. Sua fé sobrevive em círculos discretos, porque em muitos domínios curar com magia é motivo de fogueira.',
  },
  {
    id: 'ordem-eterna',
    name: 'A Ordem Eterna',
    glyph: '⚰',
    description:
      'A igreja de Darkon, obcecada pelo rito funerário correto. Zela para que os mortos permaneçam mortos — trabalho que, naquele domínio, raramente termina.',
  },
  {
    id: 'senhor-da-manha',
    name: 'O Senhor da Manhã',
    glyph: '✦',
    description:
      'Fé do amanhecer e da renovação, popular entre os barovianos que ainda esperam o fim da noite. Seus sacerdotes prometem uma alvorada que o domínio nunca viu chegar.',
  },
  {
    id: 'legislador',
    name: 'O Legislador',
    glyph: '⚖',
    description:
      'Divindade da lei e da ordem imposta, forte em Hazlan, Tepest e Odiare. Sua doutrina justifica hierarquias rígidas: obedecer é virtude, questionar é o primeiro passo do crime.',
  },
  {
    id: 'belenus',
    name: 'Belenus',
    glyph: '☼',
    description:
      'Deus solar dos camponeses de Tepest, invocado contra fadas e criaturas noturnas. Suas fogueiras aquecem tanto rituais de proteção quanto caças a bruxas.',
  },
  {
    id: 'divindade-da-humanidade',
    name: 'Divindade da Humanidade',
    glyph: '✥',
    description:
      'Doutrina de Paridon: não há deuses acima do potencial humano. Orgulhosa e cívica, sustenta a ordem urbana — e serve de álibi a quem experimenta com pessoas.',
  },
  {
    id: 'racionalismo',
    name: 'Racionalismo/Ateísmo',
    glyph: '⚗',
    description:
      'A posição oficial de Lamordia: o sobrenatural é fenômeno mal medido. Confortável enquanto os instrumentos funcionam, aterrorizante quando a explicação não chega a tempo.',
  },
  {
    id: 'diamabel',
    name: 'Reverência a Diamabel',
    glyph: '✧',
    description:
      'O culto profético de Pharazia, onde a palavra do santo organiza cada hora do dia. Pureza é obrigação pública, e a heresia raramente chega a julgamento.',
  },
  {
    id: 'os-loa',
    name: 'Os Loa',
    glyph: '☥',
    description:
      'Os espíritos de Souragne, cultuados com oferendas, tambores e respeito exato. Não são distantes: atendem, cobram e observam quem esquece de agradecer.',
  },
  {
    id: 'panteao-akiri',
    name: 'Panteão Akiri',
    glyph: '⚱',
    description:
      "Os deuses funerários de Har'Akir, senhores do julgamento e da preservação. A morte é burocracia sagrada — e a tumba errada, uma sentença.",
  },
  {
    id: 'panteao-rajiano',
    name: 'Panteão Rajiano',
    glyph: '✹',
    description:
      'Os deuses de Sri Raji, encabeçados por uma deusa que cobra sangue. Devoção e medo se confundem, e o sacerdócio decide quem vive perto do altar.',
  },
  {
    id: 'none',
    name: 'Nenhuma / Sem fé',
    glyph: '○',
    description:
      'Nenhuma igreja, nenhum símbolo, nenhuma prece. Nas Terras das Brumas isso é mais comum do que os púlpitos admitem — e custa caro em vilarejos onde a fé é o que mantém as portas fechadas à noite.',
  },
]

const byId = new Map(RELIGIONS.map(r => [r.id, r]))

export function getReligion(id: string): Religion | undefined {
  return byId.get(id)
}

/**
 * Faiths are stored on the character by name (the column predates this
 * catalog), so an older sheet resolves back to its entry by name.
 */
export function findReligionByName(name: string): Religion | undefined {
  return RELIGIONS.find(r => r.name === name)
}
