export type TalentOrigin = 'ancestry' | 'class' | 'general'

export interface Talent {
  id: string
  name: string
  origin: TalentOrigin
  description: string
  /**
   * The level the talent was gained at — the number the talent list leads
   * with. Talents rolled on the progression track before this field existed
   * leave it out and are matched back to their level by `talentId` instead
   * (see `talentLevel`).
   */
  level?: number
}
