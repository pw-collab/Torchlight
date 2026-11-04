'use client'

import { useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Heading02Icon,
  Heading03Icon,
  LeftToRightListBulletIcon,
  QuoteDownIcon,
  SolidLine01Icon,
  TextBoldIcon,
  TextItalicIcon,
} from '@hugeicons/core-free-icons'
import { AutoTextarea, FieldLabel } from '@/components/sheet/story/fields'
import {
  insertBlock,
  insertCallout,
  toggleLinePrefix,
  wrapSelection,
  type TextEdit,
} from '@/lib/markdownEdit'
import { cn } from '@/lib/utils'

type Tool = {
  label: string
  icon: IconSvgElement
  /** O que o botão escreve, para quem passa o mouse ou usa leitor de tela. */
  hint: string
  apply: (text: string, start: number, end: number) => TextEdit
}

const INLINE_TOOLS: Tool[] = [
  { label: 'Negrito', icon: TextBoldIcon, hint: '**texto**', apply: (t, s, e) => wrapSelection(t, s, e, '**', 'texto') },
  { label: 'Itálico', icon: TextItalicIcon, hint: '*texto*', apply: (t, s, e) => wrapSelection(t, s, e, '*', 'texto') },
]

const BLOCK_TOOLS: Tool[] = [
  { label: 'Título', icon: Heading02Icon, hint: '## no começo da linha', apply: (t, s, e) => toggleLinePrefix(t, s, e, '## ') },
  { label: 'Rótulo', icon: Heading03Icon, hint: '### no começo da linha', apply: (t, s, e) => toggleLinePrefix(t, s, e, '### ') },
  { label: 'Lista', icon: LeftToRightListBulletIcon, hint: '- no começo da linha', apply: (t, s, e) => toggleLinePrefix(t, s, e, '- ') },
  { label: 'Quadro', icon: QuoteDownIcon, hint: '> no começo das linhas', apply: insertCallout },
  { label: 'Divisor', icon: SolidLine01Icon, hint: '--- numa linha só', apply: (t, s, e) => insertBlock(t, s, e, '---') },
]

/**
 * Um texto em Markdown com a barra de formatação por cima. Os botões só
 * escrevem a marcação no lugar do cursor: quem já conhece Markdown digita
 * direto, quem não conhece aprende vendo o que o botão escreveu.
 */
export function MarkdownEditor({
  id, label, value, onSave, placeholder, minRows = 6, blocks = true, help,
}: {
  id: string
  label: ReactNode
  value: string
  onSave: (value: string) => void
  placeholder?: string
  minRows?: number
  /** Sem os blocos (título, quadro…), só negrito e itálico: textos curtos. */
  blocks?: boolean
  help?: ReactNode
}) {
  const [draft, setDraft] = useState(value)
  const saved = useRef(value)
  const area = useRef<HTMLTextAreaElement | null>(null)

  function persist(next: string) {
    if (next === saved.current) return
    saved.current = next
    onSave(next)
  }

  function run(tool: Tool) {
    const el = area.current
    if (!el) return
    const before = el.value
    const edit = tool.apply(before, el.selectionStart, el.selectionEnd)

    // Só o trecho que mudou é reescrito, e pelo próprio navegador: assim o
    // Ctrl+Z desfaz o que o botão fez, como se tivesse sido digitado.
    let head = 0
    while (head < before.length && head < edit.text.length && before[head] === edit.text[head]) head++
    let tail = 0
    while (
      tail < before.length - head && tail < edit.text.length - head &&
      before[before.length - 1 - tail] === edit.text[edit.text.length - 1 - tail]
    ) tail++

    el.focus()
    el.setSelectionRange(head, before.length - tail)
    const typed = document.execCommand?.('insertText', false, edit.text.slice(head, edit.text.length - tail))
    if (!typed || el.value !== edit.text) flushSync(() => setDraft(edit.text))
    el.setSelectionRange(edit.start, edit.end)
  }

  const tools = blocks ? [...INLINE_TOOLS, ...BLOCK_TOOLS] : INLINE_TOOLS

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        role="toolbar"
        aria-label="Formatação"
        aria-controls={id}
        className="border-border bg-[var(--bg-raised)] flex flex-wrap items-center gap-0.5 border border-b-0 px-1 py-1"
      >
        {tools.map(tool => (
          <button
            key={tool.label}
            type="button"
            // O clique não tira o foco do texto, então a seleção continua lá.
            onMouseDown={e => e.preventDefault()}
            onClick={() => run(tool)}
            title={`${tool.label}: ${tool.hint}`}
            aria-label={tool.label}
            className={cn(
              'text-muted-foreground flex h-7 items-center gap-1 rounded-[1px] px-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase',
              'hover:bg-muted hover:text-foreground focus-visible:ring-ring transition-colors duration-[160ms] outline-none focus-visible:ring-1',
            )}
          >
            <HugeiconsIcon icon={tool.icon} size={15} strokeWidth={1.8} />
            {/* Os blocos levam o nome: um ícone de aspas não diz "quadro". */}
            {BLOCK_TOOLS.includes(tool) && <span className="max-[380px]:hidden">{tool.label}</span>}
          </button>
        ))}
      </div>
      <AutoTextarea
        ref={area}
        id={id}
        value={draft}
        onChange={setDraft}
        onBlur={persist}
        placeholder={placeholder}
        minRows={minRows}
        className="text-[13.5px] leading-[1.6]"
      />
      {help && <div className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed">{help}</div>}
    </div>
  )
}
