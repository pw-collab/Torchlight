'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  /** Symbol drawn in the arch window on the face and in the popover badge. */
  glyph: ReactNode
  title: string
  /** Small uppercase category label under the face divider. */
  caption: string
  /** Accent colour for the divider, caption and popover chrome. */
  accent: string
  /** Preview text on the face — clamped to five lines. */
  description?: string
  /** Compact counter under the glyph, e.g. `2/3`. */
  status?: { text: string; color: string } | null
  /** Ornament in the middle of the face divider. */
  dividerGlyph?: string
  /** Popover body — the detail revealed once the card is opened. */
  children?: ReactNode
  /** Row pinned below the popover body, outside its scroll area. */
  footer?: ReactNode
  /** Extra layer rendered inside the popover portal, over the backdrop. */
  overlay?: ReactNode
  /** Popover height in px — raise it for denser detail. */
  popoverHeight?: number
  /** Controlled open state. Left out, the card tracks its own. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * The sheet's card face: arch window, name, accented divider, category label
 * and a clamped description, opening onto a centred popover with the detail.
 * Shared by the class block's techniques and the talent list.
 */
export function GlyphCard({
  glyph, title, caption, accent, description, status,
  dividerGlyph = '⨝', children, footer, overlay,
  popoverHeight = 360, open: openProp, onOpenChange,
}: Props) {
  const [uncontrolled, setUncontrolled] = useState(false)
  const open = openProp ?? uncontrolled

  // Held in a ref so the Escape listener below never has to re-bind.
  const onOpenChangeRef = useRef(onOpenChange)
  useEffect(() => { onOpenChangeRef.current = onOpenChange })

  const setOpen = useCallback((next: boolean) => {
    setUncontrolled(next)
    onOpenChangeRef.current?.(next)
  }, [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [open, setOpen])

  const popover = open
    ? createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', padding: 16 }}
        >
          {/* Central card — centered both axes, fixed height. Centering is
              `inset + margin` rather than a translate because inkSpread's
              `both` fill-mode would overwrite a transform of our own. */}
          <div
            onClick={e => e.stopPropagation()}
            className="animate-ink-spread"
            style={{ position: 'absolute', inset: 0, margin: 'auto', background: 'var(--secondary)', border: '1px solid var(--border)', boxShadow: '0 4px 7px rgba(0,0,0,0.65)', padding: 4, width: 'min(340px, calc(100vw - 32px))', height: `min(${popoverHeight}px, calc(100dvh - 32px))`, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ border: '1px solid var(--border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 9px 12px' }}>
              {/* Heading */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
                <span style={{ width: 32, height: 32, flexShrink: 0, border: `1px solid ${accent}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: accent, lineHeight: 1 }}>
                  {glyph}
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: accent, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {title}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 8, color: accent, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1 }}>
                    {caption}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="shrink-0 text-sm leading-none text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--foreground)]"
                >
                  ✕
                </Button>
              </div>
              {/* Divider */}
              <div style={{ height: 1, background: accent, flexShrink: 0 }} />
              {/* Scrollable content */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {children}
              </div>
              {/* Actions */}
              {footer && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 2 }}>
                  {footer}
                </div>
              )}
            </div>
          </div>

          {overlay}
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        title={title}
        variant="secondary"
        aria-expanded={open}
        className={cn(
          'tactile card-lift h-56 w-full flex-col p-1 shadow-[0_4px_7px_rgba(0,0,0,0.65)]',
          'transition-[border-color] duration-[250ms]',
        )}
        style={{ borderColor: open ? accent : 'var(--border)' }}
      >
        <div style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '10px 9px 12px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          {/* Corner marks + roll arrow */}
          <div aria-hidden style={{ position: 'absolute', inset: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 6, color: 'var(--muted-foreground)', lineHeight: '6px' }}>
              <span>✦</span><span>✦</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: 6, color: 'var(--muted-foreground)', lineHeight: '6px' }}>
              <span>✦</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 10, letterSpacing: '2.7px', color: accent, lineHeight: 1 }}>↝</span>
              <span>✦</span>
            </div>
          </div>

          {/* Arch icon */}
          <div style={{ width: 56, height: 56, border: '1px solid var(--border)', borderRadius: '999px 999px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 22, color: 'var(--foreground)', lineHeight: 1, userSelect: 'none' }}>{glyph}</span>
            {status && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: status.color, lineHeight: 1, letterSpacing: '0.04em' }}>{status.text}</span>
            )}
          </div>

          {/* Title */}
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--foreground)', textAlign: 'center', width: '100%', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '0 12px', boxSizing: 'border-box' }}>
            <span style={{ flex: 1, height: 1, background: accent }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: accent, lineHeight: 1 }}>{dividerGlyph}</span>
            <span style={{ flex: 1, height: 1, background: accent }} />
          </div>

          {/* Caption */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 8, color: accent, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>
            {caption}
          </p>

          {/* Description */}
          <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0, textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {description}
            </p>
          </div>
        </div>
      </Button>
      {popover}
    </>
  )
}
