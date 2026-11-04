'use client'

import { createContext, useContext, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import type { Element } from 'hast'
import { escapeLineStart, isLabelledList } from '@/lib/story'
import { cn } from '@/lib/utils'

/*
 * O Markdown da aba História. O capítulo História é um texto só, e é o
 * Markdown que deixa ele carregar mais de um tipo de bloco, como a ficha de
 * referência faz:
 *
 *   parágrafo        o primeiro ganha letra capitular (com `lead`)
 *   ## Título        título de bloco
 *   ### Rótulo       rótulo em versalete
 *   - item           lista com losangos
 *   > texto          quadro destacado, como "A Marca do Pecador"
 *   > - **Rótulo** … dentro do quadro, uma lista em que todo item abre em
 *                    negrito vira colunas ("Onde queimou" | "Onde calou")
 *   ---              divisor
 *
 * HTML cru não passa (react-markdown o ignora sem `rehype-raw`), e imagens e
 * tabelas ficam de fora: a página não tem onde desenhá-las bem.
 */

const BLOCK_ELEMENTS = [
  'p', 'br', 'strong', 'em', 'del', 'code', 'a',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'hr',
]

const INLINE_ELEMENTS = ['p', 'br', 'strong', 'em', 'del', 'code', 'a']

/** Dentro de um quadro destacado as listas rotuladas viram colunas. */
const InCallout = createContext(false)

function Callout({ children }: { children?: ReactNode }) {
  return (
    <InCallout.Provider value>
      {/* Um aparte do texto, não uma região da página: `note`, não `aside`. */}
      <div role="note" className="story-callout">{children}</div>
    </InCallout.Provider>
  )
}

function UnorderedList({ node, children }: { node?: Element; children?: ReactNode }) {
  const inCallout = useContext(InCallout)
  const columns = inCallout && isLabelledList(node)
  return <ul className={columns ? 'story-columns' : 'story-list'}>{children}</ul>
}

const blockComponents: Components = {
  h1: ({ children }) => <h3 className="story-h3">{children}</h3>,
  h2: ({ children }) => <h3 className="story-h3">{children}</h3>,
  h3: ({ children }) => <h4 className="story-label">{children}</h4>,
  h4: ({ children }) => <h4 className="story-label">{children}</h4>,
  h5: ({ children }) => <h4 className="story-label">{children}</h4>,
  h6: ({ children }) => <h4 className="story-label">{children}</h4>,
  blockquote: ({ children }) => <Callout>{children}</Callout>,
  ul: ({ node, children }) => <UnorderedList node={node}>{children}</UnorderedList>,
  ol: ({ children }) => <ol className="story-ordered">{children}</ol>,
  // Um fio com o losango dos bullets no meio: o ornamento da ficha.
  hr: () => (
    <div role="separator" className="story-divider">
      <span className="story-divider__mark" />
    </div>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="story-link">{children}</a>
  ),
}

const inlineComponents: Components = {
  // Uma linha não tem parágrafo: o texto entra direto onde for posto.
  p: ({ children }) => <>{children}</>,
  a: blockComponents.a,
}

interface StoryMarkdownProps {
  children: string
  /** Letra capitular no primeiro parágrafo, para o texto que abre um capítulo. */
  lead?: boolean
  className?: string
}

/** Um texto em blocos: parágrafos, títulos, listas e quadros. */
export function StoryMarkdown({ children, lead = false, className }: StoryMarkdownProps) {
  return (
    <div className={cn('story-prose', className)} data-lead={lead || undefined}>
      <ReactMarkdown allowedElements={BLOCK_ELEMENTS} unwrapDisallowed components={blockComponents}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

/** Uma linha com negrito e itálico: os bullets, os fatos, os papéis. */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown allowedElements={INLINE_ELEMENTS} unwrapDisallowed components={inlineComponents}>
      {escapeLineStart(children)}
    </ReactMarkdown>
  )
}
