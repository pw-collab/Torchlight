export interface Trait {
  name: string
  description: string
}

export interface Ancestry {
  id: string
  name: string
  traits: Trait[]
}
