'use client'

import { useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import type { InventoryItem } from '@/types/inventory.types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Props {
  item: InventoryItem
  onClose: () => void
  onSaveContent: (content: string) => void
}

function paginateMarkdown(md: string, charsPerPage = 600): string[] {
  const paragraphs = md.split(/\n\n+/).filter(p => p.trim())
  const pages: string[] = []
  let current = ''
  for (const para of paragraphs) {
    if (current && (current.length + para.length + 2) > charsPerPage) {
      pages.push(current.trim())
      current = para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current.trim()) pages.push(current.trim())
  return pages.length ? pages : ['']
}

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="font-heading mb-2.5 text-sm leading-snug tracking-[0.1em] text-[var(--gold-oxidized)]">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-heading mt-2 mb-1.5 text-xs leading-snug tracking-[0.08em] text-[var(--gold-oxidized)]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-heading mt-1.5 mb-1 text-[11px] leading-snug tracking-[0.06em] text-[var(--gold-oxidized)]">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-2 leading-[1.55]">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--candle-amber)]">{children}</strong>
  ),
  em: ({ children }) => <em className="text-muted-foreground italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-[3px]">{children}</li>,
  hr: () => <hr className="my-2.5 border-t border-[rgba(139,112,48,0.3)]" />,
}

const PAGE_CLASS =
  'relative w-[340px] min-h-[480px] shrink-0 overflow-y-hidden bg-[var(--parchment-light)] px-7 py-8 text-[13px] leading-[1.55] text-[var(--ink-deep)]'

export function BookViewerModal({ item, onClose, onSaveContent }: Props) {
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [editingContent, setEditingContent] = useState(false)
  const [draft, setDraft] = useState(item.content ?? '')

  const pages = paginateMarkdown(item.content ?? '')
  const totalPages = pages.length
  const totalSpreads = Math.ceil(totalPages / 2)

  const leftPage  = pages[spreadIndex * 2]     ?? ''
  const rightPage = pages[spreadIndex * 2 + 1] ?? null

  const leftNum  = spreadIndex * 2 + 1
  const rightNum = spreadIndex * 2 + 2

  function handleSave() {
    onSaveContent(draft)
    setEditingContent(false)
  }

  return (
    <>
      <Dialog open onOpenChange={open => { if (!open) onClose() }}>
        <DialogContent
          showCloseButton={false}
          className="flex w-auto max-w-full flex-col items-center gap-4 border-none bg-transparent p-6 shadow-none"
        >
          {/* Header */}
          <DialogHeader className="flex w-full max-w-[736px] flex-row items-center justify-between gap-3">
            <DialogTitle className="font-heading text-[11px] tracking-[0.16em] text-[var(--parchment-warm)] uppercase">
              📖 {item.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Leitor de {item.name}, página {leftNum} de {totalPages}.
            </DialogDescription>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setDraft(item.content ?? ''); setEditingContent(true) }}
                className="border-[rgba(139,112,48,0.4)] bg-[rgba(42,34,16,0.55)] text-[9px] tracking-[0.12em] text-[var(--parchment-light)]"
              >
                ✎ Editar Conteúdo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                aria-label="Fechar"
                className="border-[rgba(196,32,32,0.4)] bg-[rgba(42,34,16,0.55)] text-[10px] text-[var(--blood-bright)]"
              >
                ✕
              </Button>
            </div>
          </DialogHeader>

          {/* Book spread */}
          <div className="flex border border-[rgba(139,112,48,0.4)] shadow-[0_16px_60px_rgba(0,0,0,0.85),0_4px_16px_rgba(0,0,0,0.6)]">
            {/* Left page */}
            <div className={PAGE_CLASS}>
              <div className="absolute bottom-2.5 left-4 text-[9px] text-[rgba(80,60,20,0.45)] italic">
                {leftNum}
              </div>
              {leftPage ? (
                <ReactMarkdown components={mdComponents}>{leftPage}</ReactMarkdown>
              ) : (
                <span className="text-[11px] text-[rgba(80,60,20,0.35)] italic">
                  Página em branco.
                </span>
              )}
            </div>

            {/* Spine */}
            <div className="w-1.5 shrink-0 bg-[linear-gradient(to_right,rgba(80,55,10,0.55),rgba(139,112,48,0.5),rgba(80,55,10,0.55))]" />

            {/* Right page */}
            <div className={PAGE_CLASS}>
              <div className="absolute right-4 bottom-2.5 text-[9px] text-[rgba(80,60,20,0.45)] italic">
                {rightPage !== null ? rightNum : ''}
              </div>
              {rightPage !== null ? (
                <ReactMarkdown components={mdComponents}>{rightPage}</ReactMarkdown>
              ) : (
                <span className="text-[11px] text-[rgba(80,60,20,0.35)] italic">
                  {totalPages > 1 ? '' : 'Use ✎ Editar Conteúdo para adicionar texto.'}
                </span>
              )}
            </div>
          </div>

          {/* Footer navigation */}
          <DialogFooter className="flex-row items-center justify-center gap-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSpreadIndex(s => Math.max(0, s - 1))}
              disabled={spreadIndex === 0}
              className="border-[rgba(139,112,48,0.4)] bg-[rgba(42,34,16,0.55)] text-[10px] tracking-[0.12em] text-[var(--parchment-light)]"
            >
              ← Anterior
            </Button>
            <span className="text-muted-foreground min-w-[120px] text-center text-[11px] italic">
              {totalPages <= 1
                ? 'Página 1'
                : `Págs. ${leftNum}–${Math.min(rightNum, totalPages)} de ${totalPages}`}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSpreadIndex(s => Math.min(totalSpreads - 1, s + 1))}
              disabled={spreadIndex >= totalSpreads - 1}
              className="border-[rgba(139,112,48,0.4)] bg-[rgba(42,34,16,0.55)] text-[10px] tracking-[0.12em] text-[var(--parchment-light)]"
            >
              Próximo →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit content dialog */}
      <Dialog open={editingContent} onOpenChange={setEditingContent}>
        <DialogContent className="max-w-[540px] border-t-2 border-t-[#7A6030] p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-[9px] tracking-[0.18em] text-[var(--parchment-light)] uppercase">
              Editar Conteúdo — {item.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Escreva o conteúdo do livro em Markdown.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={'# Título\n\nEscreva aqui em **Markdown**...\n\nPalavras *em itálico*, **negrito**, listas, etc.'}
            className={cn(
              'font-mono h-[360px] resize-y bg-[var(--ink-deep)] text-[11px] leading-normal',
              'border-[rgba(139,112,48,0.28)] text-[var(--parchment-light)]',
            )}
          />

          <DialogFooter className="sm:justify-stretch">
            <Button
              onClick={handleSave}
              variant="outline"
              className="text-foreground flex-1 border-[#2A5045] bg-[rgba(42,80,69,0.3)] text-[9px] tracking-[0.12em]"
            >
              Salvar
            </Button>
            <Button
              onClick={() => setEditingContent(false)}
              variant="outline"
              className="text-muted-foreground flex-1 border-[rgba(139,112,48,0.3)] bg-[rgba(42,34,16,0.4)] text-[9px] tracking-[0.12em]"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
