export interface Spell {
  id: string
  name: string
  tier: number
  description: string
}

export const wizardSpells: Spell[] = [
  { id: 'wiz_magic_missile', name: 'Magic Missile', tier: 1, description: 'Automatically deals 1d4 damage to one target.' },
  { id: 'wiz_sleep', name: 'Sleep', tier: 1, description: 'Puts up to 2d8 HD of creatures to sleep.' },
  { id: 'wiz_detect_magic', name: 'Detect Magic', tier: 1, description: 'Sense magical auras within 60 feet.' },
  { id: 'wiz_charm', name: 'Charm Person', tier: 1, description: 'One humanoid regards you as a friend.' },
  { id: 'wiz_fireball', name: 'Fireball', tier: 3, description: 'Explosion deals 8d6 fire damage in a 20-foot radius.' },
  { id: 'wiz_fly', name: 'Fly', tier: 3, description: 'Target gains a fly speed of 60 feet.' },
]
