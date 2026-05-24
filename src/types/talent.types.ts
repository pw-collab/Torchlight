export type TalentOrigin = 'ancestry' | 'class' | 'general'

export interface Talent {
  id: string
  name: string
  origin: TalentOrigin
  description: string
}
