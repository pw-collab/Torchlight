import { Character, Attribute, Item, Spell, Talent, AttributeName } from '../types';

export function parseNotionHTML(html: string): Partial<Character> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const character: Partial<Character> = {};

  // Name
  const title = doc.querySelector('.page-title');
  if (title) character.name = title.textContent?.trim();

  // Properties
  const rows = doc.querySelectorAll('.property-row');
  const props: Record<string, string> = {};
  rows.forEach(row => {
    const label = row.querySelector('th')?.textContent?.trim();
    const valueCell = row.querySelector('td');
    const value = valueCell?.textContent?.trim();
    if (label && value) {
      props[label] = value;
      
      // Capture links for specific properties
      const link = valueCell?.querySelector('a')?.getAttribute('href');
      if (link) {
        if (label === '🔀 Domínio de origem') character.originDomainLink = link;
        if (label === '🔀 Fé') character.deityLink = link;
      }
    }
  });

  // Basic Info
  if (props['🔀 Espécie']) character.ancestry = props['🔀 Espécie'];
  if (props['🔀 Classe']) character.class = props['🔀 Classe'];
  if (props['🔀 Arquétipo']) character.archetype = props['🔀 Arquétipo'];
  if (props['🔀 Domínio de origem']) character.originDomain = props['🔀 Domínio de origem'];
  if (props['🔀 Fé']) character.deity = props['🔀 Fé'];
  if (props['✒️ Level']) character.level = parseInt(props['✒️ Level']);
  
  if (props['HP/MAX']) {
    const [current, max] = props['HP/MAX'].replace(' ❤️', '').split('/').map(n => parseInt(n));
    character.hp = current;
    character.maxHp = max;
  }

  if (props['Armadura']) {
    character.ac = parseInt(props['Armadura']);
  }
  
  if (props['Sorte']) {
    const s = props['Sorte'].toLowerCase();
    character.luck = s.includes('sim') || s.includes('yes') || s.includes('🍀') || s.includes('true') || s === '1';
  }

  // Attributes
  if (props['Atributos']) {
    // Format: F ▸ -2|D ▸ 1|C ▸ 1|I ▸ 3|S ▸ 0|Ca ▸ 0
    const attrMap: Record<string, AttributeName> = {
      'F': 'Strength',
      'D': 'Dexterity',
      'C': 'Constitution',
      'I': 'Intelligence',
      'S': 'Wisdom',
      'Ca': 'Charisma'
    };
    
    const attributeParts = props['Atributos'].split('|');
    const attributes: Attribute[] = [];
    
    attributeParts.forEach(part => {
      const [key, val] = part.split(' ▸ ');
      const name = attrMap[key.trim()];
      if (name) {
        const modifier = parseInt(val);
        attributes.push({
          name,
          modifier,
          value: 10 + (modifier * 2) // Rough estimation since Notion only shows mods
        });
      }
    });
    character.attributes = attributes;
  }

  // Inventory & Weapons
  const inventory: Item[] = [];
  const tables = doc.querySelectorAll('.simple-table');
  
  tables.forEach(table => {
    const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim().toLowerCase());
    const rows = table.querySelectorAll('tbody tr');

    if (headers.includes('equipment')) {
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0]?.textContent?.trim();
        if (name && name !== 'Currency') {
          inventory.push({
            id: Math.random().toString(36).substr(2, 9),
            name,
            description: cells[2]?.textContent?.trim() || '',
            weight: parseInt(cells[1]?.textContent?.trim() || '1') || 1,
            quantity: 1,
            type: 'gear'
          });
        } else if (name === 'Currency') {
          const currencyStr = cells[2]?.textContent?.trim() || '';
          const gp = currencyStr.match(/(\d+)\s*gp/);
          const sp = currencyStr.match(/(\d+)\s*sp/);
          const cp = currencyStr.match(/(\d+)\s*cp/);
          if (gp) character.gold = parseInt(gp[1]);
          if (sp) character.silver = parseInt(sp[1]);
          if (cp) character.copper = parseInt(cp[1]);
        }
      });
    } else if (headers.includes('attack')) {
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0]?.textContent?.trim();
        if (name) {
          inventory.push({
            id: Math.random().toString(36).substr(2, 9),
            name,
            description: `Damage: ${cells[2]?.textContent?.trim()}, Hit: ${cells[1]?.textContent?.trim()}`,
            weight: 1,
            quantity: 1,
            type: 'weapon',
            equipped: true
          });
        }
      });
    }
  });
  character.inventory = inventory;

  // Spells
  const spells: Spell[] = [];
  const spellProp = props['Magias'];
  if (spellProp) {
    const spellNames = spellProp.split(',').map(s => s.trim());
    spellNames.forEach(name => {
      spells.push({
        id: Math.random().toString(36).substr(2, 9),
        name: name.replace(/\[.*\]/, '').trim(),
        tier: 1, // Defaulting to 1 as Notion doesn't explicitly state tier in the summary
        type: 'Psionic',
        range: 'Near',
        duration: 'Instant',
        castingTime: '1 Action',
        description: 'Imported from Notion'
      });
    });
  }
  character.spells = spells;

  // Talents
  const talents: Talent[] = [];
  if (props['Talento Espécie']) {
    talents.push({
      id: Math.random().toString(36).substr(2, 9),
      name: props['Talento Espécie'].split('.')[0],
      type: 'ancestry',
      description: props['Talento Espécie']
    });
  }
  // Add skills/class talents as talents
  const talentKeys = [
    'Skill 1', 'Skill 2', 'Skill 3', 'Skill 4',
    'Talento Classe 1', 'Talento Classe 2', 'Talento Classe 3', 'Talento Classe 4',
    'Talento de Classe 1', 'Talento de Classe 2', 'Talento de Classe 3', 'Talento de Classe 4',
    'Talento Arquétipo'
  ];
  
  talentKeys.forEach(key => {
    if (props[key]) {
      talents.push({
        id: Math.random().toString(36).substr(2, 9),
        name: props[key].split('.')[0],
        type: 'class',
        description: props[key]
      });
    }
  });

  if (props['✒️ Talentos rolados']) {
    talents.push({
      id: Math.random().toString(36).substr(2, 9),
      name: 'Rolled Talents',
      type: 'general',
      description: props['✒️ Talentos rolados']
    });
  }

  character.talents = talents;

  // Languages
  if (props['✒️ Idiomas']) {
    character.languages = props['✒️ Idiomas']
      .split(/[,\n;]/)
      .map(l => l.trim())
      .filter(Boolean);
  }

  return character;
}
