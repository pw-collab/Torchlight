import { Spell } from '../types';

export const SPELLS: Spell[] = [
  {
    "id": "comprehend-languages",
    "name": "Comprehend Languages",
    "tier": 1,
    "type": "Spell",
    "range": "Self",
    "duration": "1 torch",
    "castingTime": "Action",
    "description": "You understand the literal meaning of any spoken and written language. It takes about 10 rounds to read one page of text.",
    "classes": [
      "Arcane",
      "Divine",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "disguise-self",
    "name": "Disguise Self",
    "tier": 1,
    "type": "Spell",
    "range": "Self",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "An illusion covers your entire body to alter your appearance. Physical interaction can’t extend for the illusive parts.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Illusion"
  },
  {
    "id": "conjure-familiar",
    "name": "Conjure Familiar",
    "tier": 1,
    "type": "Spell",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You gain the service of a familiar, a spirit that takes an animal form you choose such as cats, frogs, ferrets, crows, hawks, snakes, owls, ravens, toads, weasels, or even mice.\nA creature acting as a familiar can benefit a wizard, conveying its sensory powers to its master, conversing with him, and serving as a guard/scout/spy as well.\nA familiar have 1d4 hit points plus 1 hit point per caster level, and an AC of 10 + Caster level. It can’t attack but can deliver close (touch) spells.\nA wizard can have only one familiar at a time, however, and he has no control over what sort of creature answers the summoning, if any at all come.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Conjuration"
  },
  {
    "id": "thunderwave",
    "name": "Thunderwave",
    "tier": 1,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "A wave of thunderous force sweeps out from you out to a close area around where you stand.\nCreatures and objects within the area of effect are pushed 10 feet away from you.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "create-undead",
    "name": "Create Undead",
    "tier": 6,
    "type": "Spell",
    "range": "Close",
    "duration": "1 day",
    "castingTime": "Action",
    "description": "You conjure a vengeful undead creature to do your bidding. When you cast this spell, you choose to summon either a wight or wraith. It appears next to you and is under your control. The undead creature acts on your turn. After 1 day, it melts away into smoke.",
    "classes": [
      "Arcane"
    ],
    "school": "Necromancy"
  },
  {
    "id": "acid-arrow",
    "name": "Acid Arrow",
    "tier": 2,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You conjure a corrosive bolt that hits one foe, dealing 1d6 damage a round. The bolt remains in the target for as long as you focus.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "teleport",
    "name": "Teleport",
    "tier": 7,
    "type": "Spell",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Teleport yourself and willing creatures within close range to a specified location on your same plane with a 50% chance of arriving off-target if the location is unknown.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "resilient-sphere",
    "name": "Resilient Sphere",
    "tier": 4,
    "type": "Spell",
    "range": "Close",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "You conjure a weightless, glassy sphere around you that extends out to close range. For the spell's duration, nothing can pass through or crush the sphere. You can roll the sphere a near distance on your turn.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "detect-magic",
    "name": "Detect Magic",
    "tier": 1,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You can sense the presence of magic within near range for the spell's duration. If you focus for two rounds, you discern its general properties. Full barriers block this spell.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "burning-hands",
    "name": "Burning Hands",
    "tier": 1,
    "type": "Spell",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You spread your fingers with thumbs touching, unleashing a circle of flame that roars out to a close area around where you stand. Creatures within the area of effect take 1d6 damage, and flammable objects catch fire.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Evocation"
  },
  {
    "id": "holy-weapon",
    "name": "Holy Weapon",
    "tier": 1,
    "type": "Miracle",
    "range": "Close",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "One weapon you touch is imbued with a sacred blessing. The weapon becomes magical and has +1 to attack and damage rolls for the duration.",
    "classes": [
      "Divine"
    ],
    "school": "Evocation"
  },
  {
    "id": "zone-of-truth",
    "name": "Zone Of Truth",
    "tier": 2,
    "type": "Miracle",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "Compel a creature you can see to speak the truth while within range. They cannot utter a deliberate lie.",
    "classes": [
      "Divine"
    ],
    "school": "Enchantment"
  },
  {
    "id": "divination",
    "name": "Divination",
    "tier": 4,
    "type": "Miracle",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You throw the divining bones or peer into the blackness between the stars, seeking a portent. You can ask the GM one yes or no question. The GM truthfully answers \"yes\" or \"no.\" If you cast this spell more than once in 24 hours, treat a failed spellcasting check for it as a critical failure, instead.",
    "classes": [
      "Divine"
    ],
    "school": "Divination"
  },
  {
    "id": "alarm",
    "name": "Alarm",
    "tier": 1,
    "type": "Spell",
    "range": "Close",
    "duration": "1 day",
    "castingTime": "Action",
    "description": "You touch one object, such as a door threshold, setting a magical alarm on it. If any creature you do not designate while casting the spell touches or crosses past the object, a magical bell sounds in your head.",
    "classes": [
      "Arcane"
    ],
    "school": "Abjuration"
  },
  {
    "id": "hold-monster",
    "name": "Hold Monster",
    "tier": 5,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You paralyze one creature you can see within range. If the target is LV 9+, it may make a STR check vs. your last spellcasting check at the start of its turn to end the spell.",
    "classes": [
      "Arcane"
    ],
    "school": "Enchantment"
  },
  {
    "id": "dimension-door",
    "name": "Dimension Door",
    "tier": 4,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You teleport yourself and up to one other willing creature to any point you can see.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "passwall",
    "name": "Passwall",
    "tier": 5,
    "type": "Spell",
    "range": "Close",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "A tunnel of your height opens in a barrier you touch and lasts for the duration. The passage can be up to near distance in length and must be in a straight line.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "prismatic-orb",
    "name": "Prismatic Orb",
    "tier": 5,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Send a strobing orb of energy streaking toward a target within range. Choose an energy type from fire, cold, or electricity. The orb deals 3d8 damage and delivers a concussive blast of the chosen energy type. If the energy type is anathema to the target's existence, the orb deals double damage to it.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "mage-armor",
    "name": "Mage Armor",
    "tier": 1,
    "type": "Spell",
    "range": "Self",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "An invisible layer of magical force protects your vitals. Your armor class becomes 14 (18 on a critical spellcasting check) for the spell’s duration.",
    "classes": [
      "Arcane"
    ],
    "school": "Abjuration"
  },
  {
    "id": "smite",
    "name": "Smite",
    "tier": 2,
    "type": "Miracle",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You call down punishing flames on a creature you can see within range. It takes 1d6 damage.",
    "classes": [
      "Divine"
    ],
    "school": "Evocation"
  },
  {
    "id": "silence",
    "name": "Silence",
    "tier": 2,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You magically mute sound in a near cube within the spell’s range. Creatures inside the area are deafened, and any sounds they create cannot be heard.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "fireball",
    "name": "Fireball",
    "tier": 3,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You hurl a small flame that erupts into a fiery blast. All creatures in a near-sized cube around where the flame lands take 4d6 damage.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "judgment",
    "name": "Judgment",
    "tier": 5,
    "type": "Miracle",
    "range": "Close",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "You instantly banish a creature you touch, sending it and all possessions it carries to face the judgment of your god. You can banish an intelligent creature of LV 10 or less. When the creature returns in 5 rounds, it has been healed to full hit points if its deeds pleased your god. It has been reduced to 1 hit point if its deeds angered your god. If your god can't judge its actions, it is unchanged.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "mass-cure",
    "name": "Mass Cure",
    "tier": 3,
    "type": "Miracle",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "All allies within near range of you regain 2d6 hit points.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "levitate",
    "name": "Levitate",
    "tier": 2,
    "type": "Spell",
    "range": "Self",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You can float a near distance vertically per round on your turn. You can also push against solid objects to move horizontally.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "knock",
    "name": "Knock",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "A door, window, gate, chest, or portal you can see within range instantly opens, defeating all mundane locks and barriers. This spell creates a loud knock audible to all within earshot.",
    "classes": [
      "Arcane"
    ],
    "school": "Abjuration"
  },
  {
    "id": "feather-fall",
    "name": "Feather Fall",
    "tier": 1,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You may make an attempt to cast this spell when you fall. Your rate of descent slows so that you land safely on your feet.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "dominion",
    "name": "Dominion",
    "tier": 7,
    "type": "Miracle",
    "range": "Near",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "Mighty beings come to your aid. The beings must have a combined total of 20 levels or less. Chaotic PCs summon demons/devils, and lawful or neutral PCs summon angels. The beings act of free will to aid you on your turn. After 10 rounds, they return to their realms. You cannot cast this spell again until you complete penance.",
    "classes": [
      "Divine"
    ],
    "school": "Enchantment"
  },
  {
    "id": "polymorph",
    "name": "Polymorph",
    "tier": 4,
    "type": "Spell",
    "range": "Touch",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "You transform a creature you touch into another natural creature you choose of equal or smaller size. Any gear the target carries melds into its new form. The target gains the creature's hit points, armor class, and attacks, but retains its intellect. If the target goes to 0 hit points, it reverts to its true form at half its prior hit points. You can target any willing creature with this spell, or an unwilling creature whose level is less than or equal to half your level rounded down (minimum 1).",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "sending",
    "name": "Sending",
    "tier": 3,
    "type": "Spell",
    "range": "Unlimited",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You send a brief, mental message to any creature with whom you are familiar who is on the same plane.",
    "classes": [
      "Arcane"
    ],
    "school": "Divination"
  },
  {
    "id": "mirror-image",
    "name": "Mirror Image",
    "tier": 2,
    "type": "Spell",
    "range": "Self",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "Create a number of illusory duplicates of yourself equal to half your level rounded down (minimum 1). Each time a creature attacks you, the attack misses and causes one of the duplicates to evaporate. If all the illusions have disappeared, the spell ends.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "restoration",
    "name": "Restoration",
    "tier": 3,
    "type": "Miracle",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "With the touch of your hands, you expunge curses and illnesses. One curse, illness, or affliction of your choice affecting the target creature ends.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "heal",
    "name": "Heal",
    "tier": 6,
    "type": "Miracle",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "One creature you touch is healed to full hit points. You cannot cast this spell again until you complete a rest.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "illusion",
    "name": "Illusion",
    "tier": 3,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You create a convincing visible and audible illusion that fills up to a near-sized cube in range. The illusion cannot cause harm, but creatures who believe the illusion is real react to it as though it were. A creature who inspects the illusion from afar must pass a Wisdom check vs. your last spellcasting check to perceive the false nature of the illusion. Touching the illusion also reveals its false nature.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "rebuke-unholy",
    "name": "Rebuke Unholy",
    "tier": 3,
    "type": "Miracle",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Rebuke creatures who oppose your alignment, forcing them to flee. You must present a holy symbol to cast this spell. If you are lawful or neutral, this spell affects demons, devils, and outsiders. If you are chaotic, this spell affects angels and natural creatures of the wild. Affected creatures within near of you must make a CHA check vs. your spellcasting check. If a creature fails by 10+ points and is equal to or less than your level, it is destroyed. Otherwise, on a fail, it flees from you for 5 rounds.",
    "classes": [
      "Divine"
    ],
    "school": "Evocation"
  },
  {
    "id": "scrying",
    "name": "Scrying",
    "tier": 5,
    "type": "Spell",
    "range": "Self",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You look into a crystal ball or reflecting pool, calling up images of a distant place. For the spell's duration, you can see and hear a creature or location you choose that is on the same plane. This spell is DC 18 to cast if you try to scry on a creature or location that is unfamiliar to you. Each round, creatures you view may make a Wisdom check vs. your last spellcasting check. On a success, they become aware of your magical observation.",
    "classes": [
      "Arcane"
    ],
    "school": "Divination"
  },
  {
    "id": "commune",
    "name": "Commune",
    "tier": 5,
    "type": "Miracle",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You seek your entity's counsel. Ask the GM up to three yes or no questions. The GM truthfully answers \"yes\" or \"no\" to each. If you cast this spell more than once in 24 hours, treat a failed spellcasting check for it as a critical failure, instead.",
    "classes": [
      "Divine",
      "Primal",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "fly",
    "name": "Fly",
    "tier": 3,
    "type": "Spell",
    "range": "Self",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "Your feet lift from the ground, and you take to the air like a hummingbird. You can fly near for the spell's duration and are able to hover in place.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "detect-thoughts",
    "name": "Detect Thoughts",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You peer into the mind of one creature you can see within range. Each round, you learn the target’s immediate thoughts. On its turn, the target makes a Wisdom check vs. your last spellcasting check. If the target succeeds, it notices your presence in its mind and the spell ends. \"Magic is simply the art of doing and undoing.\" -Creeg, human wizard",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "sleep",
    "name": "Sleep",
    "tier": 1,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You weave a lulling spell that fills a near-sized cube extending from you. Choose a number of living creatures in the area up to to your level. Those creatures fall into a deep sleep if they are LV 2 or less. Vigorous shaking or being injured wakes them.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "wrath",
    "name": "Wrath",
    "tier": 4,
    "type": "Miracle",
    "range": "Self",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "Weapons become magical +2 and deal an additional d8 damage for the spell's duration.",
    "classes": [
      "Divine"
    ],
    "school": "Evocation"
  },
  {
    "id": "cloudkill",
    "name": "Cloudkill",
    "tier": 5,
    "type": "Spell",
    "range": "Far",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "A putrid cloud of yellow poison fills a near-sized cube within range. It spreads around corners. Creatures inside the cloud are blinded and take 2d6 damage at the beginning of their turns. A creature of LV 9 or less that ends its turn fully inside the cloud dies.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "protection-from-energy",
    "name": "Protection From Energy",
    "tier": 3,
    "type": "Spell",
    "range": "Close",
    "duration": "10 minutes",
    "castingTime": "Action",
    "description": "One creature you touch becomes impervious to the wild fury of the elements. Choose fire, cold, or electricity. For the spell's duration, the target is immune to harm from energy of the chosen type.",
    "classes": [
      "Arcane"
    ],
    "school": "Abjuration"
  },
  {
    "id": "invisibility",
    "name": "Invisibility",
    "tier": 2,
    "type": "Spell",
    "range": "Close",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "A creature you touch becomes invisible for the spell’s duration. The spell ends if the target attacks or casts a spell.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Illusion"
  },
  {
    "id": "blind-deafen",
    "name": "Blind/Deafen",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You utter a divine censure, blinding or deafening one creature you can see in range. The creature has disadvantage on tasks requiring the lost sense.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "recover",
    "name": "Recover",
    "tier": 4,
    "type": "Miracle",
    "range": "Close",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "A creature you touch regains 1d4 hit points on your turn for the duration. This spell also regrows lost body parts.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "turn-undead",
    "name": "Turn Undead",
    "tier": 1,
    "type": "Miracle",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Present a holy symbol and force undead creatures within near range to flee or be destroyed on a failed CHA check vs. your spellcasting check.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "flame-strike",
    "name": "Flame Strike",
    "tier": 4,
    "type": "Miracle",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You call down a holy pillar of fire, immolating one creature you can see within range. The target takes 2d6 damage.",
    "classes": [
      "Divine"
    ],
    "school": "Evocation"
  },
  {
    "id": "augury",
    "name": "Augury",
    "tier": 2,
    "type": "Miracle",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You interpret the meaning of supernatural portents and omens. Ask the GM one question about a specific course of action. The GM says whether the action will lead to “weal” or “woe.”",
    "classes": [
      "Divine",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "disintegrate",
    "name": "Disintegrate",
    "tier": 6,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "A green ray shoots from your finger and turns a creature or object into ash. A target creature of LV 6 or less instantly dies. If it is LV 7+, it takes 5d6 damage, instead. A non-magical object up to the size of a large tree is destroyed.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "dispel-magic",
    "name": "Dispel Magic",
    "tier": 3,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "End one spell that affects one target you can see in range.\nFor higher tiers, make a spellcasting check as if you’re casting the targeted spell.",
    "classes": [
      "Arcane"
    ],
    "school": "Abjuration"
  },
  {
    "id": "animate-dead",
    "name": "Animate Dead",
    "tier": 3,
    "type": "Spell",
    "range": "Close",
    "duration": "1 day",
    "castingTime": "Action",
    "description": "You touch one humanoid’s remains, and it rises as a zombie or skeleton under your control. The remains must have at least three limbs and its head intact. The undead creature acts on your turn. After 1 day, the creature collapses into grave dust.",
    "classes": [
      "Arcane"
    ],
    "school": "Necromancy"
  },
  {
    "id": "shield-of-faith",
    "name": "Shield of Faith",
    "tier": 1,
    "type": "Miracle",
    "range": "Self",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "A protective force wrought of your holy conviction surrounds you. You gain a +2 bonus to your armor class for the duration.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "cleansing-weapon",
    "name": "Cleansing Weapon",
    "tier": 2,
    "type": "Miracle",
    "range": "Close",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "One weapon you touch is wreathed in purifying flames. It deals an additional 1d4 damage (1d6 vs. undead) for the duration.",
    "classes": [
      "Divine"
    ],
    "school": "Evocation"
  },
  {
    "id": "divine-vengeance",
    "name": "Divine Vengeance",
    "tier": 5,
    "type": "Miracle",
    "range": "Self",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "You become the divine avatar of your god's wrath, wreathed in holy flames or a black aura of smoldering corruption. For the spell's duration, you can fly a near distance, your weapons are magical, and you have a +4 bonus to your weapon attacks and damage.",
    "classes": [
      "Divine"
    ],
    "school": "Transmutation"
  },
  {
    "id": "hold-portal",
    "name": "Hold Portal",
    "tier": 1,
    "type": "Spell",
    "range": "Near",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "You magically hold a portal closed for the duration. A creature must make a successful STR check vs. your spellcasting check to open the portal. The knock spell ends this spell.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "charm-person",
    "name": "Charm Person",
    "tier": 1,
    "type": "Spell",
    "range": "Near",
    "duration": "1d8 days",
    "castingTime": "Action",
    "description": "You magically beguile one humanoid of LV 2 or less within near range, who regards you as a friend for the duration. The spell ends if you or your allies do anything harmful to the target. The target knows it was magically charmed after the spell ends.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "light",
    "name": "Light",
    "tier": 1,
    "type": "Spell",
    "range": "Close",
    "duration": "1 hour real time",
    "castingTime": "Action",
    "description": "One object you touch glows with bright, heatless light, illuminating out to a near distance for 1 hour of real time.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Illusion"
  },
  {
    "id": "misty-step",
    "name": "Misty Step",
    "tier": 2,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "In a puff of smoke, you teleport a near distance to an area you can see.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "arcane-eye",
    "name": "Arcane Eye",
    "tier": 4,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You conjure an invisible, grape-sized eye within range. You can see through the eye. It can see in the dark out to near range, fly near on your turn, and squeeze through openings as narrow as a keyhole.",
    "classes": [
      "Arcane"
    ],
    "school": "Divination"
  },
  {
    "id": "antimagic-shell",
    "name": "Antimagic Shell",
    "tier": 8,
    "type": "Spell",
    "range": "Self",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "An invisible, near-sized cube of null-magic appears centered on you. Within the cube, no spells can be cast. Magic items and spells have no effect in the zone, and no magic can enter. The cube moves with you. Spells such as dispel magic have no effect on it. Another antimagic shell does not affect this one.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "lightning-bolt",
    "name": "Lightning Bolt",
    "tier": 3,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You shoot a blue-white ray of lightning from your hands, hitting all creatures in a straight line out to a far distance. Creatures struck by the lightning take 3d6 damage.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "confusion",
    "name": "Confusion",
    "tier": 4,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You mesmerize one creature you can see in range. The target can't take actions, and it moves in a random direction on its turn. If the target is LV 9+, it may make a WIS check vs. your last spellcasting check at the start of its turn to end the spell.",
    "classes": [
      "Arcane"
    ],
    "school": "Enchantment"
  },
  {
    "id": "magic-circle",
    "name": "Magic Circle",
    "tier": 3,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "Conjure a circle of runes around yourself and name a type of creature. Creatures of the chosen type cannot attack or cast hostile spells on anyone inside the circle, and can't possess, compel, or beguile anyone inside the circle.",
    "classes": [
      "Arcane"
    ],
    "school": "Abjuration"
  },
  {
    "id": "fabricate",
    "name": "Fabricate",
    "tier": 4,
    "type": "Spell",
    "range": "Near",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "This spell can't target creatures. You turn a tree-sized collection of raw materials into a finished work. For example, you convert a pile of bricks or rocks into a bridge. The finished work converts back to raw materials when the spell ends.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "cure-wounds",
    "name": "Cure Wounds",
    "tier": 1,
    "type": "Priest",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Your touch restores ebbing life. Roll a number of d6s equal to 1 + half your level (rounded down). One target you touch regains that many hit points.",
    "classes": [
      "Priest"
    ],
    "school": "Necromancy"
  },
  {
    "id": "command",
    "name": "Command",
    "tier": 3,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You issue a verbal command to one creature in range who can understand you. The command must be one word, such as “kneel.” The target obeys the command for as long as you focus. If your command is ever directly harmful to the creature, it may make a Charisma check vs. your last spellcasting check. On a success, the spell ends.",
    "classes": [
      "Arcane",
      "Divine",
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "floating-disk",
    "name": "Floating Disk",
    "tier": 1,
    "type": "Spell",
    "range": "Near",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "You create a floating, circular disk of force with a concave center. It can carry up to 20 gear slots. It hovers at waist level and automatically stays within near of you. It can’t cross over drop-offs or pits taller than a human.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "plane-shift",
    "name": "Plane Shift",
    "tier": 7,
    "type": "Spell",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You fold space and time, transporting yourself and all willing creatures within close range to a location on another plane of your choice. Unless you have been to your intended location before, you appear in a random place on the destination plane.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "hold-person",
    "name": "Hold Person",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You magically paralyze one humanoid creature of LV 4 or less you can see within range.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Enchantment"
  },
  {
    "id": "shapechange",
    "name": "Shapechange",
    "tier": 9,
    "type": "Spell",
    "range": "Self",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You transform yourself and any gear you carry into another natural creature you've seen of level 10 or less. You gain the creature's hit points, armor class, and attacks, but retain your intellect. If you go to 0 hit points while under the effects of this spell, you revert to your true form at 1 hit point.",
    "classes": [
      "Arcane",
      "Primal"
    ],
    "school": "Transmutation"
  },
  {
    "id": "wish",
    "name": "Wish",
    "tier": 9,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Alter reality with a single wish, interpreted by the GM. A failed spellcasting check is treated as a critical failure and rolls the mishap with disadvantage.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "power-word-kill",
    "name": "Power Word Kill",
    "tier": 9,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Utter the Word of Doom. One creature you target of LV 9 or less dies if it hears you. Treat a failed spellcasting check for this spell as a critical failure, and roll the mishap with disadvantage.",
    "classes": [
      "Arcane"
    ],
    "school": "Enchantment"
  },
  {
    "id": "summon-extraplanar",
    "name": "Summon Extraplanar",
    "tier": 5,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "Reach into the outer planes and summon an elemental or outsider of LV 7 or less under your control. If you lose focus, you lose control and the creature becomes hostile towards you and your allies. A spellcasting check is required to return the creature to the outer planes.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "control-water",
    "name": "Control Water",
    "tier": 4,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You move and shape water. You can cause a section of water up to 100 feet in width and depth to change shape, defy gravity, or flow in a different direction.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Transmutation"
  },
  {
    "id": "telekinesis",
    "name": "Telekinesis",
    "tier": 5,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "Lift a creature or object weighing 1,000 pounds or less and move it in any direction or hold it in place.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "web",
    "name": "Web",
    "tier": 2,
    "type": "Spell",
    "range": "Far",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "Creates a near-sized cube of sticky spider web within range. Creatures stuck in the web must succeed on a Strength check vs. your spellcasting check to free themselves.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "protection-from-evil",
    "name": "Protection From Evil",
    "tier": 1,
    "type": "Spell",
    "range": "Close",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "For the spell's duration, chaotic beings have disadvantage on attack rolls and hostile spellcasting checks against the target. These beings also can't possess, compel, or beguile it. When cast on an already-possessed target, the possessing entity makes a CHA check vs. the last spellcasting check. On a failure, the entity is expelled.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "alter-self",
    "name": "Alter Self",
    "tier": 2,
    "type": "Spell",
    "range": "Self",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "You magically change your physical form, gaining one feature that modifies your existing anatomy. For example, you can grow functional gills on your neck or bear claws on your fingers. This spell can’t grow wings or limbs.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Transmutation"
  },
  {
    "id": "pillar-of-salt",
    "name": "Pillar Of Salt",
    "tier": 4,
    "type": "Miracle",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "A creature you target turns into a statue made of hardened salt. You can target a creature you can see of LV 5 or less. If you focus on this spell for 3 rounds in a row, the transformation becomes permanent.",
    "classes": [
      "Divine"
    ],
    "school": "Transmutation"
  },
  {
    "id": "gaseous-form",
    "name": "Gaseous Form",
    "tier": 3,
    "type": "Spell",
    "range": "Self",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "You and your gear turn into a cloud of smoke for the spell's duration. You can fly and pass through any gap that smoke could. You can sense the terrain and any movement around you out to a near distance. You can't cast spells while in this form.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "magic-missile",
    "name": "Magic Missile",
    "tier": 1,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "A glowing bolt of force streaks from your open hand, dealing 1d4 damage to one target.\nWizards (Class) have advantage on checks to cast this spell.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "fixed-object",
    "name": "Fixed Object",
    "tier": 2,
    "type": "Spell",
    "range": "Close",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "An object you touch that weighs no more than 5 pounds becomes fixed in its current location. It can support up to 5,000 pounds of weight for the duration of the spell.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "speak-with-dead",
    "name": "Speak With Dead",
    "tier": 3,
    "type": "Spell",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "A dead body you touch answers your questions in a distant, wheezing voice. You can ask the dead body up to three yes or no questions (one at a time). The GM truthfully answers \"yes\" or \"no\" to each. If you cast this spell more than once in 24 hours, treat a failed spellcasting check for it as a critical failure, instead.",
    "classes": [
      "Arcane",
      "Divine",
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "stoneskin",
    "name": "Stoneskin",
    "tier": 4,
    "type": "Spell",
    "range": "Self",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "Your skin becomes like granite. For the spell's duration, your armor class becomes 17 (20 on a critical spellcasting check).",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "wall-of-force",
    "name": "Wall Of Force",
    "tier": 5,
    "type": "Spell",
    "range": "Near",
    "duration": "5 rounds",
    "castingTime": "Action",
    "description": "Conjures a contiguous, transparent wall of force in a near-sized area of your choice that blocks physical objects on the same plane.",
    "classes": [
      "Arcane"
    ],
    "school": "Conjuration"
  },
  {
    "id": "bless",
    "name": "Bless",
    "tier": 2,
    "type": "Miracle",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "One creature you touch gains a luck token.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "prophecy",
    "name": "Prophecy",
    "tier": 6,
    "type": "Miracle",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Commune directly with your god for guidance. Ask the GM one question. The GM answers the question truthfully using the knowledge your god possesses. You cannot cast this spell again until you complete penance.",
    "classes": [
      "Divine"
    ],
    "school": "Divination"
  },
  {
    "id": "alter-size",
    "name": "Alter Size",
    "tier": 2,
    "type": "Spell",
    "range": "Close",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You cause a creature or an object to grow or shrink double its size. If the target is unwilling, must make a DC 13 CON check.\nIf the target is a creature, everything it is wearing and carrying changes size with it. Any item dropped by an affected creature returns to normal size at once. Any physical damage increases or decreases it’s dice damage category.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "awake-dead",
    "name": "Awake Dead",
    "tier": 1,
    "type": "Necromancer",
    "range": "Close",
    "duration": "1 day",
    "castingTime": "Action",
    "description": "You touch one humanoid’s remains, and it rises as a zombie or skeleton under your control. The remains must have at least three limbs and its head intact. The undead creature acts on your turn. After 1 day, the creature collapses into grave dust.",
    "classes": [
      "Necromancer"
    ],
    "school": "Necromancy"
  },
  {
    "id": "gentle-repose",
    "name": "Gentle Repose",
    "tier": 2,
    "type": "Spell",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You touch a corpse or other remains. the target is protected from decay and can't become undead.\nA failed spellcasting check kills instantly the creature. You can’t cast this spell again (forever) if you critical fail.",
    "classes": [
      "Arcane"
    ],
    "school": "Necromancy"
  },
  {
    "id": "haste",
    "name": "Haste",
    "tier": 3,
    "type": "Spell",
    "range": "Close",
    "duration": "3 rds",
    "castingTime": "Action",
    "description": "The selected target has its body accelerated in time, meaning it can take an additional turn per round.\nWhen the spell ends, the target is overcome by a wave of lethargy and cannot act for 1 full round.\nA failure to cast this spell causes the caster to have lethargy effect.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "blight",
    "name": "Blight",
    "tier": 4,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Necromantic energy washes over a creature draining moisture and vitality from it.\nA target plant creature of LV 4 or less instantly dies. If it is a living creature, it takes 3d8 damage instead.\nA non-magical plant up to the size of a large tree is withers and dies.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "fire-shield",
    "name": "Fire Shield",
    "tier": 4,
    "type": "Spell",
    "range": "Self",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "Thin and wispy flames wreathe your body for the duration, shedding light to a near distance (see Light Sources, pg. 84).\nThe shield grants immunity to cold damage. Melee attacks hitting you returns 1d6 fire damage to the attacker.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "ice-shield",
    "name": "Ice Shield",
    "tier": 4,
    "type": "Spell",
    "range": "Self",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "Thin and wispy snow wreathe your body for the duration, shedding light to a near distance (see Light Sources, pg. 84).\nThe shield grants immunity to fire damage. Melee attacks hitting you returns 1d6 cold damage to the attacker.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "vampiric-touch",
    "name": "Vampiric Touch",
    "tier": 3,
    "type": "Spell",
    "range": "Self",
    "duration": "1 Touch until 5 rds",
    "castingTime": "Action",
    "description": "You imbue your touch to drain life essence.\nOne target you touch with a successful attack roll takes a number of d6 equal to half your level (rounded down) and you regain HP equal to the half of the damage. \nAdditionally,  the target permanently loses 1 CON that can be restored only by a priest on the next 24 hours.\nUndead creatures are unaffected by this spell.",
    "classes": [
      "Arcane"
    ],
    "school": "Necromancy"
  },
  {
    "id": "clone",
    "name": "Clone",
    "tier": 8,
    "type": "Spell",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "This spell grows an inert duplicate of a living creature as a safeguard against death.\nThis clone needs to form inside a vessel while the spell is casting; you can also choose to have the clone be a younger version of the same creature. It remains inert and endures indefinitely, as long as its vessel remains undisturbed.\nAt any time after the clone matures for 3 months, if the original creature dies, its soul transfers to the clone, provided that the soul is free and willing to return. The clone is physically identical to the original and has the same personality, memories, and abilities, but none of the original's equipment.\nTreat a failed spellcasting check for it as a critical failure instead. Roll twice and combine both effects. If you roll a 1 instead, you intantly die additionally.",
    "classes": [
      "Arcane"
    ],
    "school": "Necromancy"
  },
  {
    "id": "antipathy-sympathy",
    "name": "Antipathy/Sympathy",
    "tier": 8,
    "type": "Spell",
    "range": "Far",
    "duration": "5 days",
    "castingTime": "Action",
    "description": "This spell attracts or repels creatures of your choice. You target something within range, either a Huge or smaller object or creature or an area that is no larger than a 20-story building.\nAntipathy. The enchantment causes creatures of the kind you designated of lower level tha yours to feel an intense urge to leave the area and avoid the target.\nSympathy. The enchantment causes the specified creatures of lower level tha yours to feel an intense urge to approach the target while within 60 feet of it or able to see it.",
    "classes": [
      "Arcane",
      "Primal"
    ],
    "school": "Enchantment"
  },
  {
    "id": "psychic-scream",
    "name": "Psychic Scream",
    "tier": 9,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You unleash the power of your mind to blast the intellect of up to ten creatures.\nA target creature of LV 15 or less instantly dies. If it is LV 11+, it is stunned for 1d6 rounds and takes 7d6 damage instead.\nCreatures that have an Intelligence score of 2 or lower are unaffected.",
    "classes": [
      "Arcane"
    ],
    "school": "Enchantment"
  },
  {
    "id": "meteor-swarm",
    "name": "Meteor Swarm",
    "tier": 9,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Evokes four near sized blazing meteors to crash the ground. Each one causes 10d6 fire and 10d6 bludgeoning damage.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "mass-polymorph",
    "name": "Mass Polymorph",
    "tier": 9,
    "type": "Spell",
    "range": "Near",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "Casts Polymorph spell (pg. 67) targeting up to ten creatures.",
    "classes": [
      "Arcane",
      "Primal"
    ],
    "school": "Transmutation"
  },
  {
    "id": "invulnerability",
    "name": "Invulnerability",
    "tier": 9,
    "type": "Spell",
    "range": "Self",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "Immune to all damage until the spell ends.",
    "classes": [
      "Arcane"
    ],
    "school": "Abjuration"
  },
  {
    "id": "gate",
    "name": "Gate",
    "tier": 9,
    "type": "Spell",
    "range": "Far",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "Open a portal at a point within far to another location on any plane.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Conjuration"
  },
  {
    "id": "foresight",
    "name": "Foresight",
    "tier": 9,
    "type": "Spell",
    "range": "Touch",
    "duration": "1 session",
    "castingTime": "Action",
    "description": "The creature can't be surprised and has advantage on d20 checks. Additionally, other creatures have disadvantage on attack rolls against the target for the duration.\nThis spell immediately ends if you cast it again before its duration ends.",
    "classes": [
      "Arcane"
    ],
    "school": "Divination"
  },
  {
    "id": "conjure-wight",
    "name": "Conjure Wight",
    "tier": 3,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You energize a fresh corpse to rise as a Wight to do your bidding. It acts on your turn. After 1 day it turns to dust.",
    "classes": [
      "Arcane",
      "Necromancer"
    ],
    "school": "Necromancy"
  },
  {
    "id": "banishment",
    "name": "Banishment",
    "tier": 4,
    "type": "Spell",
    "range": null,
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You instantly banish a creature you touch, sending it and all possessions it carries to another dimension.\nYou can banish an intelligent creature of LV 10 or less.\nIf you focus on this spell for 6 rounds in a row, a creature native to a different plane of existence than the one you’re on, it returns to its home plane.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "death-ward",
    "name": "Death Ward",
    "tier": 4,
    "type": "Miracle",
    "range": "Touch",
    "duration": "1 day",
    "castingTime": "Action",
    "description": "",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "drainblade",
    "name": "Drainblade",
    "tier": 4,
    "type": "Miracle",
    "range": "Touch",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "A melee weapon you touch becomes thirsty for blood. It now heals the wielder for an amount of HP equal to the damage it deals, encouraging the wielder to keep fighting.",
    "classes": [
      "Divine"
    ],
    "school": "Transmutation"
  },
  {
    "id": "magic-circle-against-undead",
    "name": "Magic Circle against Undead",
    "tier": 3,
    "type": "Spell",
    "range": "Self",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You draw a magic circle out to near-sized cube centered on yourself. For the spell’s duration, undead creatures LV 9 or less cannot attack or cast a hostile spell on anyone inside the circle. The undead also can’t possess, compel, or beguile anyone inside the circle.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "darkness",
    "name": "Darkness",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "5 rds",
    "castingTime": "Action",
    "description": "You magically create darkness in a near cube within the spell’s range. Creatures inside the area are blinded and they are obscured from view from the outside. Only magical light can penetrate this magical darkness.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "locate-corpse",
    "name": "Locate Corpse",
    "tier": 1,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You know the direction and range of the closest nonanimated corpse.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Divination"
  },
  {
    "id": "moses-passage",
    "name": "Moses’ Passage",
    "tier": 4,
    "type": "Miracle",
    "range": null,
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You call on your faith’s favor to part the sea. You create passages or hold back the tide in a double near cube within the spell range.",
    "classes": [
      "Divine",
      "Primal"
    ],
    "school": "Transmutation"
  },
  {
    "id": "raise-dead",
    "name": "Raise Dead",
    "tier": 5,
    "type": "Miracle",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "The caster return a non-animated dead creature you touch to life with 1 hit point, but must provide a sacrifice one soul of equal level to do so. The ritual takes three rounds to cast.\nThe spell neutralizes any illnesses and wounds but not restore missing body parts.",
    "classes": [
      "Divine",
      "Necromancer"
    ],
    "school": "Necromancy"
  },
  {
    "id": "lay-to-rest",
    "name": "Lay to Rest",
    "tier": 3,
    "type": "Miracle",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "An undead creature you touch, whose level is equal to or less than yours, is instantly sent to its final afterlife, reducing it to grave dust.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "magic-circle-against-life",
    "name": "Magic Circle against Life",
    "tier": 5,
    "type": "Miracle",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You draw a magic circle with necrotic energy out to nearsized cube centered on yourself. For the spell’s duration, enemy living creatures LV 9 or below cannot attack or cast a hostile spell on anyone inside the circle.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "boneskin",
    "name": "Boneskin",
    "tier": 2,
    "type": "Spell",
    "range": "Self",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "Your skin becomes covered in hardened bone armor, taking 1d8 damage to your maximum HP. For the spell’s duration, your armor class becomes 17 (20 on a critical spellcasting check.).",
    "classes": [
      "Arcane"
    ],
    "school": "Necromancy"
  },
  {
    "id": "summon-mummy",
    "name": "Summon Mummy",
    "tier": 5,
    "type": "Spell",
    "range": "Near",
    "duration": "5 rds",
    "castingTime": "Action",
    "description": "You summon forth a mummy from its hidden crypt who will act on your turn and do your bidding. After 5 rounds, it melts away into smoke.\nA critical fail on casting this spell still summons the mummy, but it turns against you during its 5 round lifespan. Do not roll on the mishap table.",
    "classes": [
      "Arcane",
      "Grave Warden"
    ],
    "school": "Conjuration"
  },
  {
    "id": "mummify",
    "name": "Mummify",
    "tier": 5,
    "type": "Miracle",
    "range": "Close",
    "duration": "Permanent",
    "castingTime": "Action",
    "description": "After a day of preparation and ceremony, you embalm a corpse as a mummy who acts on your turn. Mummies deteriorate when walking long distances, but can be carried in a casket or left to guard a location. This minion does not count against the LV limit of other raised undead minions.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "demonic-possession",
    "name": "Demonic Possession",
    "tier": 5,
    "type": "Miracle",
    "range": "Near",
    "duration": "5 rds",
    "castingTime": "Action",
    "description": "Your soul willingly leaves your body and occupies a target in near range. An unwilling target can make a CHA check vs. your spellcasting check. If they fail, you control the target on your turn, but your body stands in a helpless daze.\nWhen the target returns to its body, it becomes aware of the possession, but retains no memories of what transpired. If the target dies, you return to your body as long as it is within near range, otherwise you return to your body and drop to 0 HP.",
    "classes": [
      "Divine",
      "Necromancer"
    ],
    "school": "Necromancy"
  },
  {
    "id": "regenerate",
    "name": "Regenerate",
    "tier": 7,
    "type": "Miracle",
    "range": "Touch",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "An infusion of positive energy grants a creature continuous healing. The target regains half of its hit points. For the duration of the spell, the target regains 1 hit point per turn.\nEach time the creature regains hit points from regeneration, one damaged or ruined organ (if any) regrows. During the spell's duration, the creature can also take an action to reattach severed body parts.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "fire-storm",
    "name": "Fire Storm",
    "tier": 7,
    "type": "Miracle",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You call a storm made of sheets of roaring flame, immolating five creatures you can see within range. A target takes 3d10 damage.",
    "classes": [
      "Divine"
    ],
    "school": "Evocation"
  },
  {
    "id": "control-weather",
    "name": "Control Weather",
    "tier": 8,
    "type": "Miracle",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You take control of the weather within 5 miles of you for 1 entire day. \nYou change the current weather conditions, which are determined by the DM based on the climate and season.\nWeather conditions will be changed in three categories: precipitation, temperature, and wind.",
    "classes": [
      "Divine"
    ],
    "school": "Transmutation"
  },
  {
    "id": "mass-heal",
    "name": "Mass Heal",
    "tier": 9,
    "type": "Miracle",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "A flood of healing energy flows from you into injured creatures around you. You restore up to 500 hit points, divided as you choose among any number of creatures that you can see within range. Creatures healed by this spell are also cured of all diseases and any effect making them blinded or deafened.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "divine-sight",
    "name": "Divine Sight",
    "tier": 6,
    "type": "Miracle",
    "range": "Near",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "You confers on a creature the ability to see all things as they actually are. The creature sees invisible creatures or objects normally, sees through illusions, and sees the true form of polymorphed, changed, or transmuted things, its eyes ignores magical darkness.",
    "classes": [
      "Divine"
    ],
    "school": "Divination"
  },
  {
    "id": "divine-intervention",
    "name": "Divine Intervention",
    "tier": 9,
    "type": "Miracle",
    "range": null,
    "duration": null,
    "castingTime": "Action",
    "description": "",
    "classes": [
      "Divine"
    ],
    "school": "Conjuration"
  },
  {
    "id": "bone-balista",
    "name": "Bone Balista",
    "tier": 4,
    "type": "Miracle",
    "range": "Close",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You form a ballista made of bone from a corpse you touch.\nIt fires a bolt of bone shards during your turn, automatically hitting a target in near range, doing 4d6 damage. \nThe bone ballista has 10 HP, 11 AC, and can be damaged by physical or magical attacks.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "legend-lore",
    "name": "Legend Lore",
    "tier": 5,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Brings to your mind legends about an important person, place, or thing. The divination brings legends (if any) about the person, place, or things to your mind. These may be legends that are still current, legends that have been forgotten, or even information that has never been generally known. If the person, place, or thing is not of legendary importance, you gain no information.\nThe spell is cast with incense and strips of ivory formed into a rectangle, but some item of value to the caster must be sacrificed in addition (a potion, magical scroll, magical item, etc.)",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "cauldron",
    "name": "Cauldron",
    "tier": 1,
    "type": "Witchery",
    "range": "Close",
    "duration": "1 rd",
    "castingTime": "Action",
    "description": "You conjure a bubbling cauldron next to you. It can produce one of the following effects: \n• Any broken mundane item placed inside the cauldron is repaired. \n• A fat, croaking toad leaps out and follows your instructions for the next 3 rounds. \n• You can place up to 3 item slots of items inside the cauldron. The cauldron expels these items the next time you cast this spell (expelling items counts as the cauldron's single effect).",
    "classes": [
      "Witchcraft"
    ],
    "school": "Conjuration"
  },
  {
    "id": "eye-bite",
    "name": "Eye bite",
    "tier": 1,
    "type": "Witchery",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "One creature you target takes 1d4 damage, and it can't see you until the end of its next turn.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "dancing-light",
    "name": "Dancing light",
    "tier": 1,
    "type": "Witchery",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You summon a floating marsh light that bobs in the air and casts light out to a close radius around it. The light can change colors and take on vague shapes. It can float up to a near distance on your turn.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Illusion"
  },
  {
    "id": "bane",
    "name": "Bane",
    "tier": 1,
    "type": "Witchery",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You curse one creature to takes 1d4 penalty on the next d20 roll. Dispels bless.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "bestow-curse",
    "name": "Bestow Curse",
    "tier": 3,
    "type": "Witchery",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You touch a creature to bestow a curse from the following effects\n- Decrease an ability score up tol to your spellcasting attribute bonus.\n- Disadvantage on a specific type of rolls (attacks, casting spells, STR checks etc.\n- Each turn, the target has a 50% chance of taking no action.\n\nYou may also invent your own curse, but it should be no more powerful than those described above.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "cause-fear",
    "name": "Cause Fear",
    "tier": 1,
    "type": "Witchery",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You call upon the Willowman to appear in one creature's mind, filling it with supernatural terror. Choose one creature of LV 2 or less within range. That creature must immediately make a morale or fear check. Even creatures that are not normally subject to morale checks (such as undead) must do so.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "faerie-fire",
    "name": "Faerie Fire",
    "tier": 1,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "A pale glow surrounds and outlines the subjects. Outlined subjects shed light as candles. Outlined creatures is always visible.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Evocation"
  },
  {
    "id": "message",
    "name": "Message",
    "tier": 1,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You can whisper messages and receive whispered replies with little chance of being overheard. You point your finger at each creature you want to receive the message. When you whisper, the whispered message is audible to all targeted creatures within range.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Transmutation"
  },
  {
    "id": "ray-of-enfeeblement",
    "name": "Ray of Enfeeblement",
    "tier": 2,
    "type": "Witchery",
    "range": "Near",
    "duration": null,
    "castingTime": "Action",
    "description": "A coruscating ray springs from your hand. The subject takes 1d4 STR damage. The target’s STR and cannot drop below 1.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "remove-curse",
    "name": "Remove Curse",
    "tier": 3,
    "type": "Spell",
    "range": "Touch",
    "duration": "1 round per caster level",
    "castingTime": "Action",
    "description": "Remove curse instantaneously removes all curses on an object or a creature. Do not remove permanent curses but can suppress an effect to remove a wield item.",
    "classes": [
      "Arcane",
      "Divine",
      "Witchcraft"
    ],
    "school": "Abjuration"
  },
  {
    "id": "calm-emotions",
    "name": "Calm Emotions",
    "tier": 2,
    "type": "Miracle",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "Stops Near raging creatures from hostile actions. Creatures affected cannot take violent actions. Any damage on an affect creature ends the spell.",
    "classes": [
      "Divine",
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "delay-poison",
    "name": "Delay Poison",
    "tier": 2,
    "type": "Miracle",
    "range": "Touch",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "The target becomes immune to poison for the duration of spell.",
    "classes": [
      "Divine",
      "Primal",
      "Witchcraft"
    ],
    "school": "Transmutation"
  },
  {
    "id": "poison",
    "name": "Poison",
    "tier": 2,
    "type": "Witchery",
    "range": "Close",
    "duration": "5 rds",
    "castingTime": "Action",
    "description": "",
    "classes": [
      "Witchcraft"
    ],
    "school": "Transmutation"
  },
  {
    "id": "desecrate",
    "name": "Desecrate",
    "tier": 2,
    "type": "Miracle",
    "range": "Near",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "Imbues a near sized area with negative energy. Undead creatures are resistant to Turn undead spell and receive +1 to all rolls.\nAdditionally, Animate dead and similar spells is always cast as critical success.",
    "classes": [
      "Divine",
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "hideous-laughter",
    "name": "Hideous Laughter",
    "tier": 2,
    "type": "Witchery",
    "range": "Touch",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "One target you touch of LV 4 or less collapses helplessly with disturbing, pained laughter for the spell's duration.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "speak-with-animals",
    "name": "Speak with animals",
    "tier": 2,
    "type": "Primal",
    "range": "Self",
    "duration": "3 rds",
    "castingTime": "Action",
    "description": "You can comprehend and communicate with animals.",
    "classes": [
      "Primal",
      "Witchcraft"
    ],
    "school": "Transmutation"
  },
  {
    "id": "summon-swarm",
    "name": "Summon swarm",
    "tier": 3,
    "type": "Witchery",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "A dense swarm of biting bats, rats, or locusts appears in a nearsized cube around a point you can see within range. All creatures that start their turn within the swarm take 2d6 damage and are blinded.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Conjuration"
  },
  {
    "id": "spidersilk",
    "name": "Spidersilk",
    "tier": 2,
    "type": "Spell",
    "range": "Self",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "Sticky spidersilk covers your hands and feet. For the spell's duration, you can walk on vertical surfaces as easily as if it were flat ground.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Transmutation"
  },
  {
    "id": "broomstick",
    "name": "Broomstick",
    "tier": 3,
    "type": "Witchery",
    "range": "Close",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You transform a broomstick into a flying broomstick. The broomstick's rider can fly a near distance each round and can hover in place.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Transmutation"
  },
  {
    "id": "larissa-s-dance-of-the-dead",
    "name": "Larissa’s dance of the dead",
    "tier": 5,
    "type": "Primal",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You perform choreographed and precise steps of a dance that macabrely hypnotizes those who watch. Choose a number of living creatures that can see you to take 2d8 damage. Creatures killed by the spell damage come back as zombies.",
    "classes": [
      "Primal",
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "danse-macabre",
    "name": "Danse Macabre",
    "tier": 5,
    "type": "Necromancer",
    "range": "Near",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "You raise an army of skeletons to your aid from 2d4 human-like corpses. They carry whatever weapon they died with. If uknown, assume a weapon that causes 1d6 damage, such as a shortsword or mace. Your spellcasting bonus is used for any checks and determine the total HP.\nThey act on your turn and return to the afterlife after 10 rounds.",
    "classes": [
      "Necromancer",
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "prismatic-spray",
    "name": "Prismatic Spray",
    "tier": 5,
    "type": "Spell",
    "range": null,
    "duration": null,
    "castingTime": "Action",
    "description": "You flash eight multicolored rays",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "true-seeing",
    "name": "True Seeing",
    "tier": 6,
    "type": "Spell",
    "range": "Touch",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "You grant a creature the ability to see all things as they truly are, up to 60 feet. The target can see through magical darkness, spot invisible creatures, detect illusions, perceive secret doors, and see the true forms of polymorphed or disguised creatures. This spell does not allow vision through solid objects or into other planes.",
    "classes": [
      "Arcane"
    ],
    "school": "Divination"
  },
  {
    "id": "eyebite",
    "name": "Eyebite",
    "tier": 6,
    "type": "Spell",
    "range": "Near",
    "duration": "3 rds",
    "castingTime": "Action",
    "description": "You gain a powerful gaze attack, allowing you to affect one creature within range each round. When casting, choose one of the following effects (this choice is fixed for the spell’s duration):\n- Charm: The creature becomes loyal to you, following your commands as if under a charm spell.\n- Fear: The creature is overcome with terror and flees from you for 1d4 rounds.\n- Sicken: The creature is weakened, moving and attacking at half effectiveness for the spell’s duration.\n- Sleep: The creature falls into a deep, comatose sleep.\nEach creature affected can make a DC 15 WIS check to resist the effect. This spell does not affect undead or creatures on other planes.",
    "classes": [
      "Arcane"
    ],
    "school": "Enchantment"
  },
  {
    "id": "glassee",
    "name": "Glassee",
    "tier": 6,
    "type": "Spell",
    "range": "Touch",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "You make a section of metal, stone, or wood transparent as glass, up to 3 feet wide by 2 feet high. The transparency can be limited to your sight only, or you can create a one-way window that others can see through. This effect does not work on lead, gold, or platinum. The window retains the strength of the original material.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "domination",
    "name": "Domination",
    "tier": 5,
    "type": "Spell",
    "range": "Near",
    "duration": "1d4 days",
    "castingTime": "Action",
    "description": "You take control of a humanoid whose LV is half your level or lower (rounded down). \nOnce dominated, the creature will follow your commands, though it may resist actions against its nature with a DC 15 WIS check. Self-destructive commands are ignored. If a protection from evil effect surrounds the target, you cannot control it while the protection lasts.",
    "classes": [
      "Arcane"
    ],
    "school": "Enchantment"
  },
  {
    "id": "vision",
    "name": "Vision",
    "tier": 7,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You call upon a powerful entity for supernatural guidance, asking one question. Roll 2d6 to determine the response:\n- 2–6: The entity is displeased and refuses to answer. You are compelled to perform a quest or task for it.\n- 7–9: The entity is indifferent and provides a minor vision, which may be cryptic or unrelated.\n- 10+: The entity grants a clear vision answering your question.\n\nYou can sacrifice a precious item to improve your roll: +1 for a valuable item, +2 for an extremely valuable item, and +3 for a priceless item.",
    "classes": [
      "Arcane",
      "Divine"
    ],
    "school": "Divination"
  },
  {
    "id": "hypnotic-pattern",
    "name": "Hypnotic Pattern",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You create a twisting, colorful pattern in the air, mesmerizing creatures within a near-sized area. A total of up to 12 (or your level) Hit Dice of creatures can be affected. Creatures that see the pattern become fascinated, standing transfixed as long as you maintain focus. Any damage inflicted on an affected creature immediately breaks the spell’s effect on that creature.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "cone-of-cold",
    "name": "Cone of Cold",
    "tier": 5,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You unleash a blast of frigid air from your hands in a near-sized long cone. All creatures in the area take 5d8 cold damage.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "color-spray",
    "name": "Color Spray",
    "tier": 1,
    "type": "Spell",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You project a fan of clashing colors to a close area around where you stand. Creatures with 4 Hit Dice or fewer becomes stunned for 1 round. Creatures with 2 Hit Dice or fewer who fail the check are instead knocked unconscious for 2d4 rounds.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "cure-light-wounds",
    "name": "Cure Light Wounds",
    "tier": 1,
    "type": "Miracle",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You touch a creature and restore 1d8 hit points. This spell does not affect creatures without corporeal bodies, undead, or creatures of extraplanar origin.\nReverse: Inflict 1d8 damage instead",
    "classes": [
      "Divine",
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "cure-serious-wounds",
    "name": "Cure Serious Wounds",
    "tier": 4,
    "type": "Miracle",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You touch a creature and restore 2d8+Half your level of hit points. This spell does not affect incorporeal, nonliving, or extraplanar creatures.\nReverse: Inflict damage instead.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "remove-fear",
    "name": "Remove Fear",
    "tier": 1,
    "type": "Miracle",
    "range": "Near",
    "duration": "10 minutes (real)",
    "castingTime": "Action",
    "description": "You instill courage in one creature within range, granting it advantage on checks against fear effects for the duration. If the creature failed a check against fear earlier that day, it can immediately attempt the save again with advantage. This spell has no effect on undead.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "time-stop",
    "name": "Time Stop",
    "tier": 9,
    "type": "Spell",
    "range": "Self",
    "duration": "1d4 rds",
    "castingTime": "Action",
    "description": "You stop the flow of time within a 15-foot sphere around you, freezing all other creatures in the area. You can act for 1d4 rounds in a row. If you leave the area, the spell immediately ends, and time resumes.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "audible-glamer",
    "name": "Audible Glamer",
    "tier": 1,
    "type": "Spell",
    "range": "Far",
    "duration": "5 rds",
    "castingTime": "Action",
    "description": "You create an illusion of sound at a location within range. The sound can resemble anything from whispering voices to roaring animals. It can remain stationary, approach, or recede as you choose. Creatures that hear the sound will believe it is real unless they have reason to doubt it.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Illusion"
  },
  {
    "id": "animate-object",
    "name": "Animate Object",
    "tier": 6,
    "type": "Miracle",
    "range": "Near",
    "duration": null,
    "castingTime": "Action",
    "description": "You animate one or more inanimate objects within range, up to a total volume of 10 cubic feet. The objects obey your commands, either attacking your designated target or performing simple tasks. Animated objects deal 1d6 damage per attack and have AC 13. They vanish or fall inert when the spell ends or when destroyed. Attempting to animate an object in someone’s possession grants them a DC 15 WIS check to resist.",
    "classes": [
      "Divine"
    ],
    "school": "Transmutation"
  },
  {
    "id": "shield-of-force",
    "name": "Shield of Force",
    "tier": 1,
    "type": "Spell",
    "range": "Self",
    "duration": "5 rds",
    "castingTime": "Action",
    "description": "A floating shield made of arcane energy hovers around you, ready to intercept attacks. You gain a +2 bonus to your armor class for the duration. The shield completely blocks magic missile.",
    "classes": [
      "Arcane"
    ],
    "school": "Abjuration"
  },
  {
    "id": "ice-knife",
    "name": "Ice Knife",
    "tier": 2,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You conjure a dagger of ice and hurl it at a target within range. On a hit, the target takes 2d4 damage. When the ice knife strikes, it shatters, releasing a burst of freezing air. All creatures within a Close radius take 1d4 cold damage and have their movement halved for 1d3 rounds.",
    "classes": [
      "Arcane",
      "Primal"
    ],
    "school": "Evocation"
  },
  {
    "id": "spray-of-cards",
    "name": "Spray of Cards",
    "tier": 2,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You conjure a circle of spectral cards that slice through the air out to a close area around you. Each creature in the area takes 1d10 force damage and is blinded until the end of its next turn.",
    "classes": [
      "Arcane",
      "Primal"
    ],
    "school": "Conjuration"
  },
  {
    "id": "binding-ice",
    "name": "Binding Ice",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You unleash a blast of freezing ice in a near-sized cube. Creatures in the area take 1d8 damage and its legs are frozen for 1 round.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "magnify-gravity",
    "name": "Magnify Gravity",
    "tier": 1,
    "type": "Spell",
    "range": "Self",
    "duration": "1 rd",
    "castingTime": "Action",
    "description": "You intensify gravity in a near-sized cube around you. Each creature in the area takes has its speed limited to Close for the duration. Any unattended object within the area becomes immovable.",
    "classes": [
      "Arcane"
    ],
    "school": "Dunamancy"
  },
  {
    "id": "tongues",
    "name": "Tongues",
    "tier": 3,
    "type": "Spell",
    "range": "Self",
    "duration": "5 rds",
    "castingTime": "Action",
    "description": "You gain the ability to speak and understand all languages within Near. This allows you to communicate effectively with any creature that understands language. This spell does not enable communication with animals or influence a creature’s disposition toward you.",
    "classes": [
      "Arcane"
    ],
    "school": "Divination"
  },
  {
    "id": "pulse-wave",
    "name": "Pulse Wave",
    "tier": 3,
    "type": "Spell",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You create intense pressure and unleashes it, deciding if the pressure pulls or pushes near creatures and objects. Each creature in area takes 1d6 damage and is either pulled toward you or pushed away from you, depending on the choice you made for the spell.",
    "classes": [
      "Arcane"
    ],
    "school": "Dunamancy"
  },
  {
    "id": "greater-invisibility",
    "name": "Greater Invisibility",
    "tier": 4,
    "type": "Spell",
    "range": "Touch",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "A creature you touch becomes invisible for the spell’s duration.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "mental-prison",
    "name": "Mental Prison",
    "tier": 6,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You trap one creature within a terrifying, illusory prison that only it perceives. The creature takes is surrounded by a deadly illusion like fiery walls, serrated blades, or other horrors you decide.  If it attempts to break free by moving or touching through the illusion, it takes an 5d10 psychic damage, and the spell ends.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "power-word-stun",
    "name": "Power Word: Stun",
    "tier": 7,
    "type": "Spell",
    "range": "Near",
    "duration": "Special",
    "castingTime": "Action",
    "description": "You utter a word of power, stunning one near creature of level lower than 7 for 4 rounds, lower than LV 14 for 2 rounds, LV 15+ not affected.",
    "classes": [
      "Arcane"
    ],
    "school": "Enchantment"
  },
  {
    "id": "chain-lightning",
    "name": "Chain Lightning",
    "tier": 6,
    "type": "Spell",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Unleashes a bolt of lightning that strikes one creature or object, then arcs to additional targets within range. The initial target takes 6d6 damage. Each subsequent target in the chain takes 1d6 less damage than the previous target, until the spell either exhausts its power or runs out of targets. Each target can only be struck once.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "gust-of-wind",
    "name": "Gust of Wind",
    "tier": 3,
    "type": "Spell",
    "range": "Near",
    "duration": "1 rd",
    "castingTime": "Action",
    "description": "You release a strong blast of wind within Near in one direction. The wind extinguishes unprotected flames, scatters light objects, and disperses vapors and gases. Man-sized creatures are held motionless if moving against the wind. Larger creatures are slowed by half for one round. Gaseous or unsecured levitating creatures are blown away from the caster.",
    "classes": [
      "Arcane",
      "Primal"
    ],
    "school": "Transmutation"
  },
  {
    "id": "suggestion",
    "name": "Suggestion",
    "tier": 3,
    "type": "Spell",
    "range": "Near",
    "duration": "1 hour",
    "castingTime": "Action",
    "description": "You compel a creature within range to follow a reasonable course of action you describe in one or two sentences. The creature must be able to understand your language. The action cannot be directly self-destructive but may involve risky or unusual behavior if worded convincingly.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "distance-distortion",
    "name": "Distance Distortion",
    "tier": 5,
    "type": "Spell",
    "range": "Far",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "You alter the dimensions of an area completely enclosed by earth, rock, or similar material. The area can be up to a Near-sized cube. You choose to either double or halve the distance across the area for those traveling within it.\nCreatures affected by the distortion cannot detect the change and perceive the area as normal unless they use true seeing.",
    "classes": [
      "Arcane"
    ],
    "school": "Transmutation"
  },
  {
    "id": "locate-object",
    "name": "Locate Object",
    "tier": 2,
    "type": "Spell",
    "range": "Far",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "You sense the direction of a well-known or clearly visualized object within range. If searching for a general item type, the spell directs you to the nearest one. If searching for a specific item, you must have seen it firsthand.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "silent-image",
    "name": "Silent Image",
    "tier": 1,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You create a silent, motionless visual illusion of an object, creature, or force that is no larger than an elephant. You can move the illusion within the spell’s range.\nCreatures that interact with the illusion in a meaningful way may realize it is fake.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Illusion"
  },
  {
    "id": "enthrall",
    "name": "Enthrall",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You weave a captivating string of words, like singing, tell a story or similar, distracting creatures of your choice within range. Affected creatures is distracted as long as you maintain focus.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "scare",
    "name": "Scare",
    "tier": 2,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You call upon the Willowman to appear in one creature's mind, filling it with supernatural terror. Choose one creature of LV 6 or less within range. That creature must immediately make a morale or fear check. Even creatures that are not normally subject to morale checks (such as undead) must do so.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Necromancy"
  },
  {
    "id": "whispering-wind",
    "name": "Whispering Wind",
    "tier": 2,
    "type": "Spell",
    "range": "Unlimited",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You send a faint, magical whisper on the wind to a specific location within range that you are familiar with. When it arrives, the wind delivers a message of up to 25 words, a brief sound lasting 1 round, or simply a faint breeze. The message is delivered regardless of whether anyone is there to hear it, after which the wind dissipates.\nThis spell cannot activate magical effects, speak command words, or mimic spell incantations.",
    "classes": [
      "Arcane",
      "Primal",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "clairaudience-clairvoyance",
    "name": "Clairaudience/Clairvoyance",
    "tier": 3,
    "type": "Spell",
    "range": "Far",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "You create an invisible magical sensor at a known or obvious location within range. You can choose to hear (clairaudience) or see (clairvoyance) through the sensor, but not both at the same time. The sensor remains fixed in place, though you can rotate your view in any direction.\nThe sensor does not work through magical darkness and cannot benefit from supernatural or enhanced senses. It functions only on the plane you currently occupy.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Divination"
  },
  {
    "id": "chill-touch",
    "name": "Chill Touch",
    "tier": 1,
    "type": "Spell",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Your hand glows with cold blue energy, channeling negative energy into a creature you touch. The target takes 3d4 damage and 1 CON and STR damage.",
    "classes": [
      "Arcane"
    ],
    "school": "Necromancy"
  },
  {
    "id": "lorloveim-s-creeping-shadow",
    "name": "Lorloveim’s Creeping Shadow",
    "tier": 3,
    "type": "Spell",
    "range": "Self",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "Your shadow elongates and moves independently at a rate of near per round, stretching up to double near. It can slither along floors and walls but cannot physically interact with objects.\nYou can see, hear, and speak through your shadow as if you were there. It is 90% undetectable in dim or dark environments, but in bright light, it may be noticed. The shadow shares your AC and can only be struck by magical weapons (+1 or better) or spells. Any damage dealt to the shadow is taken by you.",
    "classes": [
      "Arcane"
    ],
    "school": "Necromancy"
  },
  {
    "id": "ray-of-frost",
    "name": "Ray of frost",
    "tier": 1,
    "type": "Spell",
    "range": "Near",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You send a beam of biting cold from your outstretched hand to one creature. The target takes 1d4 damage. \nFreezes the target on the ground for one round if hit the max damage.",
    "classes": [
      "Arcane"
    ],
    "school": "Evocation"
  },
  {
    "id": "elemental-weapon",
    "name": "Elemental Weapon",
    "tier": 2,
    "type": "Spell",
    "range": "Touch",
    "duration": "5 rds",
    "castingTime": "Action",
    "description": "One weapon you touch is wreathed in elemental energy.\nChoose an energy type from fire, cold or electricity. The wea pon deals an additional 1d4 damage\nof the chosen type for the duration.\nIf the energy type is anathema to the target's existence (for example, cold energy against a\nfire elemental), the additional damage is doubled instead.",
    "classes": [
      "Arcane",
      "Primal"
    ],
    "school": "Evocation"
  },
  {
    "id": "curse-water",
    "name": "Curse Water",
    "tier": 1,
    "type": "Miracle",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "you touch a flask or some other vessel containing water and transform it into unholy water.\nThe entire batch of holy water can be hurled at a target that is close or near as an attack using STR or DEX. If the target is a living creature it takes 1d4 damage.\nAny unholy water you have created transforms back into the water it was before after a day, or if you create more unholy water.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "hex",
    "name": "Hex",
    "tier": 1,
    "type": "Miracle",
    "range": "Near",
    "duration": "1 day",
    "castingTime": "Action",
    "description": "You jinx a creature you can see. The creature has disadvantage on one specific task of your choosing, excluding attacks rolls and spells.\nRepeated attempts at the same task still have disadvantage",
    "classes": [
      "Divine",
      "Witchcraft"
    ],
    "school": "Enchantment"
  },
  {
    "id": "inflict-wounds",
    "name": "Inflict Wounds",
    "tier": 1,
    "type": "Miracle",
    "range": "Touch",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Your touch causes boils and blisters to erupt from skin.\nRoll a number of d4s equal to half your level (rounded down). One living target you touch loses\nthat many hit points.",
    "classes": [
      "Divine"
    ],
    "school": "Necromancy"
  },
  {
    "id": "horns-of-doom",
    "name": "Horns of Doom",
    "tier": 5,
    "type": "Miracle",
    "range": "Far",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Ominous trumpets sound from the heavens.\nChoose a creature you can see that defies your diety's will. The creature takes 3d6 damage\nfrom the fiery doom that rains down upon it.\nAny creatures that are near the target take 1d6 damage.",
    "classes": [
      "Divine"
    ],
    "school": "Evocation"
  },
  {
    "id": "insect-swarm",
    "name": "Insect Swarm",
    "tier": 4,
    "type": "Miracle",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "A thick swarm of locusts appears in a near sized area.\nEach creature caught in the swarm has disadvantage on attack rolls and checks, and they spend\ntheir 1st turn in the swarm unable to move. They can't see beyond the swarm, and creaures outside\nthe swarm cannot see in.\nEach time the caster makes a spellcasting check to maintain focus, they can move the swarm to\nan area in range.",
    "classes": [
      "Divine"
    ],
    "school": "Conjuration"
  },
  {
    "id": "arms-of-shadow",
    "name": "Arms of Shadow",
    "tier": 1,
    "type": "Witchery",
    "range": "Self",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Dark tendrils erupt from your body, lashing out at all creatures within close. Each creature in the area takes 1d6  damage and cannot take reactions until the start of their next turn.",
    "classes": [
      "Witchcraft"
    ],
    "school": "Conjuration"
  },
  {
    "id": "blade-of-disaster",
    "name": "Blade of Disaster",
    "tier": 9,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You conjure a hovering blade of pure planar destruction. You can immediately command the blade to make two attacks right after cast. Each hit deals 3d12 damage.\nThe blade scores a critical hit on an 18–20, dealing 8d12 damage instead.\nOn each of your turns, you may move the blade up to near and make one attack.\nThe blade phases through all barriers, including magical ones such as wall of force.",
    "classes": [
      "Arcane",
      "Witchcraft"
    ],
    "school": "Conjuration"
  },
  {
    "id": "endless-echoes",
    "name": "Endless Echoes",
    "tier": 2,
    "type": "Spell",
    "range": "Far",
    "duration": "Focus",
    "castingTime": "Action",
    "description": "You magically create ghostly sounds echoing in a near cube within the spell’s range. Creatures casting spells inside the area are distracted by the sounds, and any Focus is break.",
    "classes": [
      "Arcane"
    ],
    "school": "Illusion"
  },
  {
    "id": "epiphany",
    "name": "Epiphany",
    "tier": 1,
    "type": "Miracle",
    "range": "Near",
    "duration": "10 rounds",
    "castingTime": "Action",
    "description": "You use a vial of holy water to fill one creature with divine clarity and hope. \nA target suffering from a minor or moderate Horror effect can anticipate their weekly recovery check with ADV. If the target is under the effects of an Evil or profane spell, they may immediately reroll their save against that effect (no bonus).\n\nIf the target is not currently under a Horror effect, they gain divine resilience. The next Horror check within the spell’s duration, is made with ADV.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "eternal-slumber",
    "name": "Eternal Slumber",
    "tier": 7,
    "type": "Miracle",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "Rids the world of an undead without harm its body, freeing its soul to the afterlife.\nIf cast on a corpse, it becomes immune to spells like animate dead and that would interfere with its eternal rest. Also prevents a victim slain by an undead rise as a spawn.\nIf cast on an existing undead, it must make a DC 15 WIS check or feels an overwhelming desire to return to its grave. This desire persists for 1 day. Liches are banished to its phylactery for 24 hours.\nDarklords makes this check with ADV and automatically wakes at the next dusk.",
    "classes": [
      "Divine"
    ],
    "school": "Abjuration"
  },
  {
    "id": "induce-lycanthropy",
    "name": "Induce Lycanthropy",
    "tier": 4,
    "type": "Spell",
    "range": "Touch",
    "duration": "1 hour",
    "castingTime": "Action",
    "description": "You force a natural or afflicted lycanthrope you touch to assume one of its beast or hybrid forms for the spell duration. If it has both forms, it chooses which one to assume.\nThe transformation starts immediately, and the target loses its next action.",
    "classes": [
      "Arcane",
      "Primal"
    ],
    "school": "Transmutation"
  },
  {
    "id": "wildshape",
    "name": "Wildshape",
    "tier": 1,
    "type": "Druid",
    "range": "Self",
    "duration": "( 10 x LV) minutes",
    "castingTime": "Action",
    "description": "You shape shift into an animal form. You remain in animal form for a number of minutes equal to 10 x your LV. You choose the animal’s appearance. Your statistics remain the same in animal with the following changes (choose one when you shift):\n• Keen: You have a +2 bonus to Wisdom checks and cannot be surprised.\n• Nimble: You have a +2 bonus to Dexterity and have advantage on checks to hide and remain hidden.\n• Robust: You have a +1 bonus to Armor Class, Strength, and Constitution\nIf you are reduced to zero HP in animal form, you revert to your true form at one HP.\n—-\nLV 1 - Can shape shift into an animal no larger than a boar that cannot fly. Your attacks in animal form deal 1d4 damage.\nLV 3 - Can shape shift into an animal no larger than a rhinoceros that cannot fly. Your attacks in animal form deal 1d6 damage.\nLV 5 - Can shape shift into an animal that can fly and is no larger than a rhinoceros. Your attacks in animal form deal 1d8 damage.\nLV 7 - Can shape shift into an animal no larger than a giraffe. Your attacks in animal form deal 1d10 damage.",
    "classes": [
      "Druid"
    ],
    "school": "Transmutation"
  },
  {
    "id": "animal-companion",
    "name": "Animal Companion",
    "tier": 1,
    "type": "Primal",
    "range": "Close",
    "duration": "Instant",
    "castingTime": "Action",
    "description": "You verbally control one 0-level non-insect animal companion such as a fox, owl, or iguana. You can train a calm or captive animal to become new Animal Companion. You can only have one animal companion at a time, and its LV cannot not exceed yours. For every 2 LV of the animal, training takes 1 day. You must know its language to understand it.",
    "classes": [
      "Primal"
    ],
    "school": "Enchantment"
  },
  {
    "id": "molecular-rearrangement-int",
    "name": "Molecular Rearrangement [INT]",
    "tier": 3,
    "type": "Psion",
    "range": "Touch",
    "duration": "10 rds",
    "castingTime": "Action",
    "description": "You alter the molecular structure of a small object, changing its density, hardness, or state of matter. You can turn wood into metal, solid into liquid, or make fragile objects incredibly durable. The object reverts after the duration ends.\nCritical Fail: The object transforms into an unintended material or becomes brittle and breaks.\nPower Score Effect: The transformation lasts 1 hour instead of 5 minutes.",
    "classes": [
      "Psion"
    ],
    "school": "Transmutation"
  }
];
