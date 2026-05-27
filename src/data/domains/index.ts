/**
 * Ravenloft domain data.
 * Each domain carries a list of languages spoken there.
 * Characters with ancestry from a domain can choose languages from its pool.
 * Language arrays marked TODO will be filled in as specs arrive.
 */

export interface Domain {
  id: string
  name: string
  languages: string[]
}

export const DOMAINS: Domain[] = [
  // ── Fully populated ──────────────────────────────────────────────────────
  {
    id: 'darkon',
    name: 'Darkon',
    languages: [
      'Darkonese', 'Falkovniano', 'Vaasi', 'Halfling',
      'Lamordiano', 'Gnomo', 'Élfico', 'Mordentish', 'Anão', 'Tepestani',
    ],
  },

  // ── Placeholder entries (language lists to be filled in) ─────────────────
  { id: 'i-cath',           name: "I'Cath",           languages: [] },
  { id: 'klorr',            name: 'Klorr',            languages: [] },
  { id: 'sithicus',         name: 'Sithicus',         languages: [] },
  { id: 'avonleigh',        name: 'Avonleigh',        languages: [] },
  { id: 'barovia',          name: 'Barovia',          languages: [] },
  { id: 'borca',            name: 'Borca',            languages: [] },
  { id: 'dementlieu',       name: 'Dementlieu',       languages: [] },
  { id: 'falkovnia',        name: 'Falkovnia',        languages: [] },
  { id: 'forlorn',          name: 'Forlorn',          languages: [] },
  { id: 'har-akir',         name: "Har'Akir",         languages: [] },
  { id: 'hazlan',           name: 'Hazlan',           languages: [] },
  { id: 'invidia',          name: 'Invidia',          languages: [] },
  { id: 'kartakass',        name: 'Kartakass',        languages: [] },
  { id: 'keening',          name: 'Keening',          languages: [] },
  { id: 'lamordia',         name: 'Lamordia',         languages: [] },
  { id: 'markovia',         name: 'Markovia',         languages: [] },
  { id: 'mordent',          name: 'Mordent',          languages: [] },
  { id: 'necropolis',       name: 'Necropolis',       languages: [] },
  { id: 'nidala',           name: 'Nidala',           languages: [] },
  { id: 'nova-vaasa',       name: 'Nova Vaasa',       languages: [] },
  { id: 'odiare',           name: 'Odiare',           languages: [] },
  { id: 'paridon',          name: 'Paridon',          languages: [] },
  { id: 'pharazia',         name: 'Pharazia',         languages: [] },
  { id: 'richemulot',       name: 'Richemulot',       languages: [] },
  { id: 'rokushima-taiyoo', name: 'Rokushima Taiyoo', languages: [] },
  { id: 'sanguinia',        name: 'Sanguinia',        languages: [] },
  { id: 'sebua',            name: 'Sebua',            languages: [] },
  { id: 'shadowborn-manor', name: 'Shadowborn Manor', languages: [] },
  { id: 'souragne',         name: 'Souragne',         languages: [] },
  { id: 'sri-raji',         name: 'Sri Raji',         languages: [] },
  { id: 'tepest',           name: 'Tepest',           languages: [] },
  { id: 'timor',            name: 'Timor',            languages: [] },
  { id: 'valachan',         name: 'Valachan',         languages: [] },
  { id: 'vechor',           name: 'Vechor',           languages: [] },
  { id: 'verbrek',          name: 'Verbrek',          languages: [] },
  { id: 'vorostokov',       name: 'Vorostokov',       languages: [] },
  { id: 'wildlands',        name: 'Wildlands',        languages: [] },
]

const byId = new Map(DOMAINS.map(d => [d.id, d]))

export function getDomain(id: string): Domain | undefined {
  return byId.get(id)
}

/** All domain ids, useful for ancestries that accept any domain ('*'). */
export const ALL_DOMAIN_IDS = DOMAINS.map(d => d.id)
