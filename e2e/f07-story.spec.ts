import { test, expect } from '@playwright/test'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'
import type { Element, Root } from 'hast'
import type { CharacterRow } from '../src/types/character.types'
import { rowToCharacter } from '../src/types/character.types'
import {
  cleanBullets,
  escapeLineStart,
  firstName,
  isLabelledList,
  normalizeBackground,
  normalizeImpulses,
  normalizeRelations,
  splitPastedBullets,
  storyMarkdown,
  toBullets,
  withPeriod,
} from '../src/lib/story'
import { insertBlock, insertCallout, toggleLinePrefix, wrapSelection, CALLOUT_TITLE } from '../src/lib/markdownEdit'

// F07: a aba História na estrutura da ficha do jogador. Checagens puras: o
// formato novo (bullets, pessoas, instituições, fatos), a leitura sem perdas
// do formato antigo, as ações da barra de formatação e o que o Markdown vira.

function row(fields: Partial<CharacterRow>): CharacterRow {
  return {
    id: 'c1', user_id: 'u1', session_id: 's1', name: 'Ralf Alester', class_id: 'wizard', ancestry_id: 'human',
    level: 3, str: 8, dex: 12, con: 10, int: 17, wis: 13, cha: 9,
    hp_max: 9, hp_current: 7, ac: 11, luck_tokens: 1, equipment: [], spells: [], torch_end_at: null,
    ...fields,
  } as CharacterRow
}

test.describe('F07 impulsos viram bullets de uma linha', () => {
  test('F07-L1 texto antigo: uma linha por bullet, sem o marcador digitado', () => {
    expect(toBullets('- Estudar em paz.\n\n• Descobrir a chave.\n1. Vender o Chuul.\n  Resgatar Bohus.  ')).toEqual([
      'Estudar em paz.', 'Descobrir a chave.', 'Vender o Chuul.', 'Resgatar Bohus.',
    ])
  })

  test('F07-L2 listas novas passam como estão, sem vazios e sem quebras', () => {
    expect(toBullets(['**Um**, dois.', '', '  ', 'três\nquatro'])).toEqual(['**Um**, dois.', 'três quatro'])
    expect(cleanBullets(['', ' a ', 'b\n c'])).toEqual(['a', 'b c'])
  })

  test('F07-L3 impulsos ausentes ou de outro tipo viram listas vazias', () => {
    expect(normalizeImpulses(undefined)).toEqual({ objectives: [], secrets: [], flaws: [], fears: [] })
    expect(normalizeImpulses({ secrets: 'Nome falso.' }).secrets).toEqual(['Nome falso.'])
  })
})

test.describe('F07 Família, Aliados, Rivais e Facção viram pessoas e instituições', () => {
  test('F07-L4 cada linha vira uma pessoa, com o grupo como papel', () => {
    const { people } = normalizeRelations({
      family: 'Rufus Alester \u2014 o irmão mais novo\nSigurd Alester: o pai',
      allies: 'Jahir - o mendigo andarilho',
      rivals: 'Rufus Alester',
    })
    expect(people.map(p => [p.name, p.role, p.note])).toEqual([
      ['Rufus Alester', 'família; rival', 'o irmão mais novo'],
      ['Sigurd Alester', 'família', 'o pai'],
      ['Jahir', 'aliado', 'o mendigo andarilho'],
    ])
    // Ids estáveis: a mesma linha antiga dá o mesmo id a cada leitura.
    expect(normalizeRelations({ family: 'Rufus' }).people[0].id).toBe(normalizeRelations({ family: 'Rufus' }).people[0].id)
  })

  test('F07-L5 listas de nomes ainda mais antigas também são lidas', () => {
    expect(normalizeRelations({ allies: ['Jahir', 'Petre'] }).people.map(p => p.name)).toEqual(['Jahir', 'Petre'])
  })

  test('F07-L6 a facção vira uma instituição', () => {
    expect(normalizeRelations({ faction: 'Academia Vermelha' }).institutions).toEqual([
      { id: 'legacy-faction', name: 'Academia Vermelha', note: 'Sua facção.' },
    ])
  })

  test('F07-L7 depois de salvo no formato novo, o antigo é ignorado', () => {
    const r = normalizeRelations({ people: [], institutions: [], family: 'Rufus', faction: 'Academia' })
    expect(r).toEqual({ people: [], institutions: [] })
  })

  test('F07-L8 fichas vazias somem e campos faltando viram texto vazio', () => {
    const r = normalizeRelations({ people: [{ id: 'a', name: '', role: '', note: '' }, { name: 'Jahir' } as never] })
    expect(r.people).toEqual([{ id: 'person-1', name: 'Jahir', role: '', note: '' }])
  })
})

test.describe('F07 o capítulo História', () => {
  test('F07-H1 eventos traumáticos antigos viram um quadro no fim da História', () => {
    const md = storyMarkdown({ backstory: 'Nasceu em Toyalis.', traumaticEvents: 'A marca.\n\nQueima.' })
    expect(md).toBe('Nasceu em Toyalis.\n\n> ## Eventos traumáticos\n>\n> A marca.\n>\n> Queima.')
    expect(storyMarkdown({ backstory: 'Só isto.' })).toBe('Só isto.')
    expect(storyMarkdown({ traumaticEvents: 'A marca.' })).toBe('> ## Eventos traumáticos\n>\n> A marca.')
  })

  test('F07-H2 o fundo guarda os textos e limpa os fatos', () => {
    const bg = normalizeBackground({
      epithet: 'O Desertor Iluminado', alias: 'nascido Aoth Hahpet', hometown: 'Toyalis',
      facts: [{ id: 'f1', label: 'Patrono', value: 'Petre' }, { id: 'f2', label: ' ', value: '' }],
      theme: 42 as never,
    })
    expect(bg).toEqual({
      epithet: 'O Desertor Iluminado', alias: 'nascido Aoth Hahpet', hometown: 'Toyalis',
      facts: [{ id: 'f1', label: 'Patrono', value: 'Petre' }],
    })
  })

  test('F07-H3 uma linha antiga inteira passa pelo rowToCharacter sem perder nada', () => {
    const c = rowToCharacter(row({
      background_details: { concept: 'Um mago.', backstory: 'Texto.', traumaticEvents: 'Marca.' },
      relations: { family: 'Rufus \u2014 irmão', faction: 'Academia' },
      impulses: { secrets: 'Nome falso.\nChave.', objectives: '- Estudar' },
    }))
    expect(c.backgroundDetails).toMatchObject({ concept: 'Um mago.', backstory: 'Texto.', traumaticEvents: 'Marca.', facts: [] })
    expect(c.relations.people.map(p => p.name)).toEqual(['Rufus'])
    expect(c.relations.institutions.map(i => i.name)).toEqual(['Academia'])
    expect(c.impulses).toEqual({ objectives: ['Estudar'], secrets: ['Nome falso.', 'Chave.'], flaws: [], fears: [] })
  })
})

test.describe('F07 colar vários bullets', () => {
  test('F07-P1 copiado de um PDF: marcadores abrem bullets, linhas quebradas continuam', () => {
    expect(splitPastedBullets('◆ Estudar necromancia em paz, sem que ninguém o defina por\nisso.\n◆ Ficar fora do alcance de Rufus.')).toEqual([
      'Estudar necromancia em paz, sem que ninguém o defina por isso.',
      'Ficar fora do alcance de Rufus.',
    ])
  })

  test('F07-P2 marcadores no meio da linha também separam', () => {
    expect(splitPastedBullets('◆ um ◆ dois\n• três')).toEqual(['um', 'dois', 'três'])
  })

  test('F07-P3 sem marcador, cada linha é um bullet', () => {
    expect(splitPastedBullets('primeiro\n\nsegundo\n')).toEqual(['primeiro', 'segundo'])
  })
})

test.describe('F07 a barra de formatação', () => {
  test('F07-B1 negrito envolve a seleção, ou insere um texto selecionado', () => {
    expect(wrapSelection('ab cd', 3, 5, '**', 'texto')).toEqual({ text: 'ab **cd**', start: 5, end: 7 })
    expect(wrapSelection('ab', 2, 2, '*', 'texto')).toEqual({ text: 'ab*texto*', start: 3, end: 8 })
  })

  test('F07-B2 título liga, troca de nível e desliga', () => {
    const on = toggleLinePrefix('um\ndois', 4, 4, '## ')
    expect(on.text).toBe('um\n## dois')
    expect(toggleLinePrefix(on.text, 5, 5, '### ').text).toBe('um\n### dois')
    expect(toggleLinePrefix(on.text, 5, 5, '## ').text).toBe('um\ndois')
  })

  test('F07-B3 lista marca cada linha da seleção, e não a seguinte', () => {
    expect(toggleLinePrefix('a\nb\nc', 0, 4, '- ').text).toBe('- a\n- b\nc')
  })

  test('F07-B4 blocos entram separados por linhas em branco', () => {
    expect(insertBlock('fim', 3, 3, '---').text).toBe('fim\n\n---')
    expect(insertBlock('a\n\nb', 1, 1, '---').text).toBe('a\n\n---\n\nb')
  })

  test('F07-B5 o quadro: modelo com o título selecionado, ou a seleção citada', () => {
    const blank = insertCallout('Texto.', 6, 6)
    expect(blank.text.slice(blank.start, blank.end)).toBe(CALLOUT_TITLE)
    expect(blank.text).toMatch(/^Texto\.\n\n> ## Título do quadro\n/)
    expect(insertCallout('a\nb', 0, 3).text).toBe('> a\n> b')
  })
})

test.describe('F07 o que o Markdown vira', () => {
  // A árvore que o react-markdown recebe: Markdown → mdast → hast.
  const tree = (md: string) => toHast(fromMarkdown(md)) as Root
  const firstList = (node: Root | Element): Element | undefined => {
    for (const child of node.children) {
      if (child.type !== 'element') continue
      if (child.tagName === 'ul') return child
      const inner = firstList(child)
      if (inner) return inner
    }
    return undefined
  }

  test('F07-M1 lista rotulada vira colunas; lista comum continua lista', () => {
    const labelled = '> ## A Marca\n> Queima.\n>\n> - **Onde queimou** Na Salle.\n> - **Onde calou** Na Capela.'
    expect(isLabelledList(firstList(tree(labelled)))).toBe(true)
    // Itens separados por linha em branco embrulham o texto num parágrafo.
    expect(isLabelledList(firstList(tree('> - **Um** a\n>\n> - **Dois** b')))).toBe(true)
    expect(isLabelledList(firstList(tree('> - um\n> - **dois**')))).toBe(false)
    expect(isLabelledList(firstList(tree('> - texto **no meio**')))).toBe(false)
  })

  test('F07-M2 numa linha, "1.", "-", "#" e ">" são texto; negrito continua negrito', () => {
    const kind = (line: string) => fromMarkdown(escapeLineStart(line)).children[0]?.type
    for (const line of ['1. Primeiro', '- traço', '* estrela', '# não é título', '> nem quadro', '---']) {
      expect(kind(line), line).toBe('paragraph')
    }
    expect(escapeLineStart('**Estudar** em paz')).toBe('**Estudar** em paz')
    expect(escapeLineStart('# não é título')).toBe('\\# não é título')
  })
})

test.describe('F07 pequenas regras de texto', () => {
  test('F07-T1 primeiro nome e ponto da alcunha', () => {
    expect(firstName('  Ralf Alester ')).toBe('Ralf')
    expect(firstName('')).toBe('')
    expect(withPeriod('O Desertor Iluminado')).toBe('O Desertor Iluminado.')
    expect(withPeriod('O Desertor?')).toBe('O Desertor?')
  })
})
