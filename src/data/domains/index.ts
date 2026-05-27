/**
 * Ravenloft domain data — each domain carries a list of languages spoken there.
 * Characters with ancestry from a domain can learn INT-mod languages from its pool.
 */

export interface Domain {
  id: string
  name: string
  languages: string[]
}

export const DOMAINS: Domain[] = [
  {
    id: 'darkon',
    name: 'Darkon',
    languages: [
      'Darkonese',
      'Falkovniano',
      'Vaasi',
      'Halfling',
      'Lamordiano',
      'Gnomo',
      'Élfico',
      'Mordentish',
      'Anão',
      'Tepestani',
    ],
  },
]

const byId = new Map(DOMAINS.map(d => [d.id, d]))

export function getDomain(id: string): Domain | undefined {
  return byId.get(id)
}
