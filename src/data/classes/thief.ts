import type { Class } from '@/types/class.types'

export const thief: Class = {
  id: 'thief',
  name: 'Thief',
  hitDie: 4,

  weaponProficiency: 'Clava, besta, adaga, arco curto, espada curta',
  armorProficiency: 'Armadura de couro, cota de malha de mithral',

  armorTraining: ['none', 'light'],
  weaponTraining: ['simple', 'ranged'],

  techniques: [
    {
      id: 'backstab',
      name: 'Punhalada',
      description:
        'Se você acertar uma criatura que não está ciente do seu ataque, você causa X dados de dano adicional da sua arma. A quantidade de dados de dano adicionais é igual à metade do seu nível (arredonde para baixo).',
      // TODO: kind will be configured — likely 'passive' (always active when condition met)
    },
    {
      id: 'thievery',
      name: 'Ladroagem',
      description:
        'Você é um mestre em furtos e possui as ferramentas necessárias para o ofício escondidas em seu corpo (sem ocupar espaços). Você é treinado e tem vantagem em quaisquer testes associados à Escalada, Furtividade e ocultação, Disfarces, Encontrar e desarmar armadilhas ou Tarefas delicadas como furtar e abrir fechaduras.',
      // TODO: kind will be configured — 'passive' (always active)
    },
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Gain advantage on initiative rolls. (reroll if duplicate)' },
    { roll: '3-5',   min: 3,  max: 5,  effect: 'Your Backstab deals +1 dice of damage.' },
    { roll: '6-9',   min: 6,  max: 9,  effect: '+2 to Strength, Dexterity, or Charisma stat.' },
    { roll: '10-11', min: 10, max: 11, effect: '+1 to melee and ranged attacks.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.' },
  ],

  archetypeLabel: 'Especialização',

  startingGear: ['dagger', 'leather', 'torch', 'rope'],
}
