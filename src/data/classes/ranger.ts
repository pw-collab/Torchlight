import type { Class } from '@/types/class.types'
import { distribute, fromTable, melee, note, ranged, statBoost } from '@/data/talentOptions'

export const ranger: Class = {
  id: 'ranger',
  name: 'Ranger',
  hitDie: 8,

  weaponProficiency: 'Adaga, arco longo, espada longa, arco curto, espada curta, lança, cajado',
  armorProficiency: 'Armadura de couro, cota de malha, cota de malha de mithral',

  armorTraining: ['none', 'light', 'medium', 'shield'],
  weaponTraining: ['simple', 'martial', 'ranged'],

  techniques: [
    {
      id: 'animal_companion',
      name: 'Animal Companion',
      summary: 'Um animal fiel que obedece e age na sua iniciativa.',
      description:
        'Você ganha um companheiro animal fiel. Este animal obedece seus comandos e age na sua iniciativa. Pode ser um lobo, falcão, urso ou outra criatura adequada ao ambiente.',
      // TODO: kind will be configured — 'passive' with optional limited_use for special actions
    },
    {
      id: 'tracker',
      name: 'Tracker',
      summary: 'Vantagem em SAB para rastrear e navegar na natureza.',
      description:
        'Você tem vantagem em testes de Sabedoria para rastrear criaturas e navegar em terrenos naturais.',
      // TODO: kind will be configured — 'passive' (always active)
    },
    {
      id: 'wayfinder',
      name: 'Wayfinder',
      summary: 'Nunca se perde na natureza e reconhece plantas e animais.',
      description:
        'Você nunca se perde em terrenos naturais e pode identificar plantas, animais e fenômenos naturais comuns.',
      // TODO: kind will be configured — 'passive' (always active)
    },
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'You deal d12 damage with one weapon type you choose.',
      options: note('Escolher o tipo de arma', 'Qual tipo de arma causa d12?', 'ex.: arcos longos') },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to melee or ranged attacks and damage.',
      options: [...melee(1), ...ranged(1)] },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Strength, Dexterity, or Intelligence.',
      options: statBoost(2, 'str', 'dex', 'int') },
    { roll: '10-11', min: 10, max: 11, effect: 'You gain ADV on Herbalism checks for an herb you choose.',
      options: note('Escolher a erva', 'Qual erva?', 'ex.: Raiz-de-sangue') },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.',
      options: [...fromTable(), ...distribute(2)] },
  ],

  archetypeLabel: 'Domínio Natural',

  startingGear: ['shortbow', 'leather', 'dagger', 'torch'],
}
