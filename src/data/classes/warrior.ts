import type { Class } from '@/types/class.types'
import { attacks, distribute, fromTable, note, statBoost } from '@/data/talentOptions'

export const warrior: Class = {
  id: 'warrior',
  name: 'Fighter',
  hitDie: 8,

  weaponProficiency: 'Todas as armas',
  armorProficiency: 'Todas as armaduras; Todos os escudos',

  armorTraining: ['none', 'light', 'medium', 'heavy', 'shield'],
  weaponTraining: ['simple', 'martial', 'ranged'],

  techniques: [
    {
      id: 'hauler',
      name: 'Hauler',
      summary: '+mod. de CON em slots de carga.',
      description:
        'Adicione seu modificador de Constituição, se positivo, aos seus slots de carga.',
      kind: 'passive',
      modifier: {
        stat: 'con',
        applyTo: 'gearSlots',
        onlyIfPositive: true,
      },
    },
    {
      id: 'weapon_mastery',
      name: 'Weapon Mastery',
      summary: 'Um tipo de arma: +1 e +½ nível no ataque e no dano.',
      description:
        'Escolha um tipo de arma (ex.: espadas longas). Você ganha +1 para ataque e dano com esse tipo. Além disso, adicione metade do seu nível (arredonde para baixo) a esses rolamentos.',
      kind: 'choice',
      choice: {
        prompt: 'Escolha um tipo de arma',
        kind: 'free_text',
      },
    },
    {
      id: 'grit',
      name: 'Grit',
      summary: 'Vantagem com FOR ou DES para vencer uma força oposta.',
      description:
        'Escolha Força ou Destreza. Você tem vantagem em testes desse atributo para superar uma força oposta, como arrombar uma porta travada (Força) ou se soltar de correntes enferrujadas (Destreza).',
      kind: 'choice',
      choice: {
        prompt: 'Escolha um atributo',
        kind: 'stat',
        options: [
          { value: 'str', label: 'Força' },
          { value: 'dex', label: 'Destreza' },
        ],
        informativeOnly: true,
      },
    },
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Gain Weapon Mastery with one additional weapon type.',
      options: note('Escolher o tipo de arma', 'Qual tipo de arma?', 'ex.: machados') },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to melee and ranged attacks.',
      options: attacks(1) },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Strength, Dexterity, or Constitution stat.',
      options: statBoost(2, 'str', 'dex', 'con') },
    { roll: '10-11', min: 10, max: 11, effect: 'Choose one kind of armor. You get +1 AC from that armor.',
      options: note('Escolher a armadura', 'Qual tipo de armadura dá +1 de CA?', 'ex.: cota de malha') },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.',
      options: [...fromTable(), ...distribute(2)] },
  ],

  archetypeLabel: 'Arquétipo de Combate',

  startingGear: ['sword', 'chainmail', 'torch', 'rope'],
}
