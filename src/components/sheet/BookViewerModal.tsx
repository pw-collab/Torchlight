'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { InventoryItem } from '@/types/inventory.types'

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

const mdComponents = {
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '0.1em', color: 'var(--gold-oxidized)', margin: '0 0 10px', lineHeight: 1.3 }}>{children}</h1>
  ),
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '0.08em', color: 'var(--gold-oxidized)', margin: '8px 0 6px', lineHeight: 1.3 }}>{children}</h2>
  ),
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '0.06em', color: 'var(--gold-oxidized)', margin: '6px 0 4px', lineHeight: 1.3 }}>{children}</h3>
  ),
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p style={{ margin: '0 0 8px', lineHeight: 1.55 }}>{children}</p>
  ),
  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong style={{ color: 'var(--candle-amber)', fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <em style={{ color: 'var(--bone-muted)', fontStyle: 'italic' }}>{children}</em>
  ),
  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul style={{ paddingLeft: 16, margin: '0 0 8px' }}>{children}</ul>
  ),
  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol style={{ paddingLeft: 16, margin: '0 0 8px' }}>{children}</ol>
  ),
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li style={{ marginBottom: 3 }}>{children}</li>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid rgba(139,112,48,0.3)', margin: '10px 0' }} />
  ),
}

const pageStyle: React.CSSProperties = {
  width: 340,
  minHeight: 480,
  background: 'var(--parchment-light, #f0e8d0)',
  padding: '32px 28px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--ink-deep, #1a1408)',
  lineHeight: 1.55,
  overflowY: 'hidden',
  position: 'relative',
  flexShrink: 0,
}

const navBtnStyle: React.CSSProperties = {
  background: 'rgba(42,34,16,0.55)',
  border: '1px solid rgba(139,112,48,0.4)',
  color: 'var(--parchment-light)',
  fontFamily: 'var(--font-heading)',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '7px 18px',
  cursor: 'pointer',
  borderRadius: 1,
  transition: 'all 250ms',
}

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
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(3px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 736 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--parchment-warm)' }}>
            📖 {item.name}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setDraft(item.content ?? ''); setEditingContent(true) }}
              style={{ ...navBtnStyle, fontSize: 9 }}
            >
              ✎ Editar Conteúdo
            </button>
            <button
              onClick={onClose}
              style={{ ...navBtnStyle, color: 'var(--blood-bright)', borderColor: 'rgba(196,32,32,0.4)', padding: '7px 13px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Book spread */}
        <div style={{
          display: 'flex',
          boxShadow: '0 16px 60px rgba(0,0,0,0.85), 0 4px 16px rgba(0,0,0,0.6)',
          border: '1px solid rgba(139,112,48,0.4)',
        }}>
          {/* Left page */}
          <div style={pageStyle}>
            <div style={{ position: 'absolute', bottom: 10, left: 16, fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9, color: 'rgba(80,60,20,0.45)' }}>
              {leftNum}
            </div>
            {leftPage
              ? <ReactMarkdown components={mdComponents as any}>{leftPage}</ReactMarkdown>
              : <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'rgba(80,60,20,0.35)' }}>
                  Página em branco.
                </span>
            }
          </div>

          {/* Spine */}
          <div style={{ width: 6, background: 'linear-gradient(to right, rgba(80,55,10,0.55), rgba(139,112,48,0.5), rgba(80,55,10,0.55))', flexShrink: 0 }} />

          {/* Right page */}
          <div style={pageStyle}>
            <div style={{ position: 'absolute', bottom: 10, right: 16, fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9, color: 'rgba(80,60,20,0.45)' }}>
              {rightPage !== null ? rightNum : ''}
            </div>
            {rightPage !== null
              ? <ReactMarkdown components={mdComponents as any}>{rightPage}</ReactMarkdown>
              : <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'rgba(80,60,20,0.35)' }}>
                  {totalPages > 1 ? '' : 'Use ✎ Editar Conteúdo para adicionar texto.'}
                </span>
            }
          </div>
        </div>

        {/* Footer navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setSpreadIndex(s => Math.max(0, s - 1))}
            disabled={spreadIndex === 0}
            style={{ ...navBtnStyle, opacity: spreadIndex === 0 ? 0.35 : 1 }}
          >
            ← Anterior
          </button>
          <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--bone-muted)', minWidth: 120, textAlign: 'center' }}>
            {totalPages <= 1
              ? 'Página 1'
              : `Págs. ${leftNum}–${Math.min(rightNum, totalPages)} de ${totalPages}`
            }
          </span>
          <button
            onClick={() => setSpreadIndex(s => Math.min(totalSpreads - 1, s + 1))}
            disabled={spreadIndex >= totalSpreads - 1}
            style={{ ...navBtnStyle, opacity: spreadIndex >= totalSpreads - 1 ? 0.35 : 1 }}
          >
            Próximo →
          </button>
        </div>
      </div>

      {/* Edit content dialog */}
      {editingContent && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 210, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setEditingContent(false)}
        >
          <div
            style={{
              background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(14,10,3,.97) 100%), #2E2210',
              border: '1px solid rgba(139,112,48,0.42)',
              borderTop: '2px solid #7A6030',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
              padding: '20px 24px',
              width: 540,
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-light)' }}>
              Editar Conteúdo — {item.name}
            </div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={'# Título\n\nEscreva aqui em **Markdown**...\n\nPalavras *em itálico*, **negrito**, listas, etc.'}
              style={{
                width: '100%',
                height: 360,
                background: 'var(--ink-deep)',
                border: '1px solid rgba(139,112,48,0.28)',
                color: 'var(--parchment-light)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                padding: '10px 12px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} style={{
                flex: 1, background: 'rgba(42,80,69,0.3)', border: '1px solid #2A5045',
                color: 'var(--bone-white)', fontFamily: 'var(--font-heading)', fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 0', cursor: 'pointer',
              }}>
                Salvar
              </button>
              <button onClick={() => setEditingContent(false)} style={{
                flex: 1, background: 'rgba(42,34,16,0.4)', border: '1px solid rgba(139,112,48,0.3)',
                color: 'var(--bone-muted)', fontFamily: 'var(--font-heading)', fontSize: 9,
                letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 0', cursor: 'pointer',
              }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
