export interface Spell {
  id: string
  name: string
  tier: number
  description: string
}

export const priestSpells: Spell[] = [
  { id: 'pri_cure_wounds', name: 'Cure Wounds', tier: 1, description: 'Restore 1d8+WIS modifier HP to one creature.' },
  { id: 'pri_bless', name: 'Bless', tier: 1, description: '+1 to attack rolls and saving throws for allies.' },
  { id: 'pri_turn_undead', name: 'Turn Undead', tier: 1, description: 'Undead flee if they fail a WIS save.' },
  { id: 'pri_hold_person', name: 'Hold Person', tier: 2, description: 'Paralyze a humanoid on a failed WIS save.' },
  { id: 'pri_raise_dead', name: 'Raise Dead', tier: 5, description: 'Restore life to a creature dead no more than 10 days.' },
]
