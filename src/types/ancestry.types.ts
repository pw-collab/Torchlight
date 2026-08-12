export interface Trait {
  name: string
  description: string
}

/**
 * Describes how many languages a character gains from this ancestry.
 * - `domainPicks`: languages chosen from the origin domain's pool
 * - `freePicks`:   additional free-choice languages (any source)
 * Values can be a fixed number or `'int_mod'` (= INT modifier, min 0).
 */
export interface AncestryLanguageRules {
  domainPicks: number | 'int_mod'
  freePicks?: number | 'int_mod'
}

export interface Ancestry {
  id: string
  name: string
  /** The people as the campaign wiki describes them. */
  description?: string
  traits: Trait[]
  /**
   * Domain(s) this ancestry can originate from.
   * Use `['*']` to mean "any domain" (e.g. Ressurreto).
   */
  domainOptions?: string[]
  /** Languages always granted by this ancestry, regardless of INT or domain. */
  fixedLanguages?: string[]
  /**
   * Pariah rating, 0–6: how strongly the tormented population of Ravenloft
   * reacts with fear and prejudice. 0 passes unnoticed; 6 is hunted.
   */
  pariahLevel?: number
  /** How many languages this ancestry grants at creation. */
  languageRules?: AncestryLanguageRules
}
