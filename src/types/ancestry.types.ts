export interface Trait {
  name: string
  description: string
}

export interface Ancestry {
  id: string
  name: string
  traits: Trait[]
  /**
   * Domain(s) this ancestry can originate from.
   * The character picks one domain; its language pool (filtered by INT mod) determines bonus languages.
   */
  domainOptions?: string[]
  /**
   * Languages always granted by this ancestry, regardless of INT or domain.
   * E.g. Dwarf always gets "Anão".
   */
  fixedLanguages?: string[]
  /**
   * Pariah level rating, e.g. "3/6".
   * Represents social standing / how easily the ancestry is ostracised.
   */
  pariahLevel?: string
}
