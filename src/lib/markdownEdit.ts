/*
 * As ações da barra de formatação do editor da História. Cada uma recebe o
 * texto e a seleção e devolve o texto novo com a seleção que deve ficar,
 * sem tocar no DOM: o editor só aplica o resultado.
 */

export interface TextEdit {
  text: string
  start: number
  end: number
}

/** Envolve a seleção em `mark` ("**"). Sem seleção, insere `placeholder` e o seleciona. */
export function wrapSelection(text: string, start: number, end: number, mark: string, placeholder: string): TextEdit {
  const inner = text.slice(start, end) || placeholder
  return {
    text: text.slice(0, start) + mark + inner + mark + text.slice(end),
    start: start + mark.length,
    end: start + mark.length + inner.length,
  }
}

/** O começo da primeira e o fim da última linha que a seleção toca. */
function lineBounds(text: string, start: number, end: number): [number, number] {
  const from = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1
  // Uma seleção que termina logo depois de uma quebra não pega a linha seguinte.
  const last = end > start && text[end - 1] === '\n' ? end - 1 : end
  const stop = text.indexOf('\n', last)
  return [from, stop === -1 ? text.length : stop]
}

const LINE_PREFIX = /^(?:#{1,6}\s+|[-*+]\s+|>\s?)/

/**
 * Põe `prefix` ("## ", "- ") no começo de cada linha da seleção, trocando o
 * que já houver de título, lista ou quadro. Se todas já têm esse prefixo,
 * tira: o mesmo botão liga e desliga.
 */
export function toggleLinePrefix(text: string, start: number, end: number, prefix: string): TextEdit {
  const [from, to] = lineBounds(text, start, end)
  const lines = text.slice(from, to).split('\n')
  const allHave = lines.every(line => line.startsWith(prefix))
  const next = lines.map(line => {
    const bare = line.replace(LINE_PREFIX, '')
    if (allHave) return bare
    return bare.trim() ? prefix + bare : line
  })
  const block = next.join('\n')
  return { text: text.slice(0, from) + block + text.slice(to), start: from, end: from + block.length }
}

/**
 * Insere um bloco no lugar da seleção, separado do resto por linhas em
 * branco, e seleciona o trecho `select` de dentro dele (quando houver).
 */
export function insertBlock(text: string, start: number, end: number, block: string, select?: string): TextEdit {
  const before = text.slice(0, start).replace(/[ \t]+$/, '')
  const after = text.slice(end).replace(/^[ \t]+/, '')
  const lead = before === '' ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  const tail = after === '' ? '' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
  const at = before.length + lead.length
  const offset = select ? block.indexOf(select) : -1
  return {
    text: before + lead + block + tail + after,
    start: offset >= 0 ? at + offset : at + block.length,
    end: offset >= 0 ? at + offset + select!.length : at + block.length,
  }
}

export const CALLOUT_TITLE = 'Título do quadro'

/** O modelo do quadro destacado, com as duas colunas rotuladas. */
export const CALLOUT_TEMPLATE = [
  `> ## ${CALLOUT_TITLE}`,
  '> O que este quadro destaca: uma marca, um juramento, uma cicatriz.',
  '>',
  '> - **Rótulo** O que vai na primeira coluna.',
  '> - **Rótulo** O que vai na segunda coluna.',
].join('\n')

/**
 * O botão "Quadro": com texto selecionado, põe a seleção dentro de um quadro;
 * sem seleção, insere o modelo e seleciona o título para ser reescrito.
 */
export function insertCallout(text: string, start: number, end: number): TextEdit {
  if (start === end) return insertBlock(text, start, end, CALLOUT_TEMPLATE, CALLOUT_TITLE)
  const [from, to] = lineBounds(text, start, end)
  const quoted = text
    .slice(from, to)
    .split('\n')
    .map(line => (line.trim() ? `> ${line.replace(/^>\s?/, '')}` : '>'))
    .join('\n')
  return insertBlock(text, from, to, quoted)
}
