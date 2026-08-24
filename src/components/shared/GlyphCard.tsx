'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The description runs until it hits the bottom of the card, so the cut lands
 * mid-line. Fading it out reads as "there is more here" rather than as a
 * rendering glitch. The bottom `FACE_CLEARANCE` px stay clear of the ✦ ↝ ✦
 * corner marks, which the text would otherwise run straight into.
 */
const FACE_CLEARANCE = 10
const FACE_FADE =
  `linear-gradient(to bottom, #000 calc(100% - 26px), transparent calc(100% - ${FACE_CLEARANCE}px))`

/** Prose on the card's detail face. Shared so the decks stay in step. */
export const DETAIL_BODY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  letterSpacing: 'normal',
  color: 'var(--foreground)',
  lineHeight: 1.5,
  textAlign: 'left',
  margin: 0,
}

interface Props {
  /** Symbol drawn in the card's masthead and beside the detail heading. */
  glyph: ReactNode
  title: string
  /** Small uppercase category label under the masthead rule. */
  caption: string
  /** Accent colour for the roll arrow and the detail face's chrome. */
  accent: string
  /** Preview text on the face — clamped to whatever the masthead left. */
  description?: string
  /** Compact counter beside the caption, e.g. `2/3`. */
  status?: { text: string; color: string } | null
  /**
   * Cards the character *spends* — activations — carry a filled masthead and
   * a lit caption; the passive ones stay hollow and dim. The design tells the
   * two apart by weight rather than by hue.
   */
  tone?: 'passive' | 'activation'
  /** Detail face — what the card reveals once it is turned over. */
  children?: ReactNode
  /** Button row in the floating actions popover. */
  footer?: ReactNode
  /** Richer controls above that row — pips, ability cards, and the like. */
  controls?: ReactNode
  /** Extra classes on the card's outer box. */
  className?: string
  /** Controlled open state. Left out, the card tracks its own. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * The sheet's card face: a ruled masthead carrying the symbol, the name and
 * the category label, over a clamped description.
 *
 * Opening turns the card over in place — same card, same size, same spot in
 * the deck, the detail written on its far side. Anything to press comes up as
 * a popover hanging off the bottom edge, since the two faces leave no room
 * for it. Shared by the class block's techniques, the talent list and the
 * grimoire.
 */
export function GlyphCard({
  glyph, title, caption, accent, description, status,
  tone = 'passive', children, footer, controls, className,
  open: openProp, onOpenChange,
}: Props) {
  const [uncontrolled, setUncontrolled] = useState(false)
  const open = openProp ?? uncontrolled

  const rootRef = useRef<HTMLDivElement>(null)
  const faceRef = useRef<HTMLButtonElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  // Held in a ref so the Escape listener below never has to re-bind.
  const onOpenChangeRef = useRef(onOpenChange)
  useEffect(() => { onOpenChangeRef.current = onOpenChange })

  const setOpen = useCallback((next: boolean) => {
    setUncontrolled(next)
    onOpenChangeRef.current?.(next)
  }, [])

  // Escape turns the card back over. Nothing is covered any more — the detail
  // is the card itself — so the page keeps its scroll.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, setOpen])

  // Focus follows the turn, so a card opened from the keyboard can be read and
  // closed from there too. Only when focus was already on this card: a
  // controlled card opened from elsewhere must not steal it.
  const wasOpen = useRef(open)
  useEffect(() => {
    if (wasOpen.current === open) return
    wasOpen.current = open
    const active = document.activeElement
    if (!active || !rootRef.current?.contains(active)) return
    ;(open ? detailRef.current : faceRef.current)?.focus()
  }, [open])

  return (
    <div
      ref={rootRef}
      data-open={open}
      className={cn(
        // The design's face ratio (246 × 384): the card takes its width from
        // the panel column and its height from that ratio, so a deck keeps
        // its shape at any width — and never drops below the 224px floor.
        'card-flip card-lift aspect-[246/384] min-h-[224px] w-full',
        className,
      )}
      // Enough to lift the open card and its popover over the rest of the deck,
      // whatever the DOM order — and no higher, so the app's own chrome (fixed
      // bars, modals) still sits on top.
      style={open ? { zIndex: 1 } : undefined}
    >
      <div className="card-flip__inner">
        {/* ── Front: the face ───────────────────────────────────────────── */}
        <Button
          ref={faceRef}
          onClick={() => setOpen(!open)}
          title={title}
          variant="secondary"
          aria-expanded={open}
          // The turned-away face is still in the layout; keep it off the tab
          // order and out of the pointer's reach while it faces the table.
          inert={open}
          className={cn(
            'card-flip__face tactile h-auto w-full flex-col p-1',
            'bg-input border-input',
            // Button's base is a label: nowrap + uppercase. The face holds
            // prose, so it wraps and keeps the casing it was written in.
            'whitespace-normal normal-case',
          )}
        >
          <div style={{
            position: 'relative',
            flex: 1,
            width: '100%',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}>
            {/* Corner marks + roll arrow */}
            <div aria-hidden style={{ position: 'absolute', inset: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 6, color: 'var(--border)', lineHeight: '6px' }}>
                <span>✦</span><span>✦</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: 6, color: 'var(--border)', lineHeight: '6px' }}>
                <span>✦</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 10, letterSpacing: '2.7px', color: accent, lineHeight: 1 }}>↝</span>
                <span>✦</span>
              </div>
            </div>

            {/* Masthead — the origin's symbol, the name, and the type under a
                rule. Filled for activations, hollow for everything passive. */}
            <div
              className={cn('[&>svg]:size-8', tone === 'activation' && 'bg-input')}
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 16,
                boxSizing: 'border-box',
                flexShrink: 0,
                color: 'var(--foreground)',
                /* Text glyphs (the creator's tier numerals) need a size of
                   their own; icon children are sized by the rule above. */
                fontFamily: 'var(--font-body)',
                fontSize: 22,
                lineHeight: 1,
              }}
            >
              {glyph}

              {/* Title — wraps onto a second line, then clamps */}
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--foreground)', textAlign: 'center', width: '100%', lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere', margin: 0 }}>
                {title}
              </p>

              {/* Type label, with the use counter beside it when there is one */}
              <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 6, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 8,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  lineHeight: '11.429px',
                  textAlign: 'center',
                  margin: 0,
                  color: tone === 'activation' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}>
                  {caption}
                </p>
                {status && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: status.color, lineHeight: '11.429px', letterSpacing: '0.04em' }}>
                    {status.text}
                  </span>
                )}
              </div>
            </div>

            {/* Description — fills whatever the masthead left, fading at the cut */}
            <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', paddingBottom: FACE_CLEARANCE, boxSizing: 'border-box', maskImage: FACE_FADE, WebkitMaskImage: FACE_FADE }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: 'normal', color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0, textAlign: 'left', overflowWrap: 'anywhere' }}>
                {description}
              </p>
            </div>
          </div>
        </Button>

        {/* ── Back: the detail ──────────────────────────────────────────── */}
        <div
          ref={detailRef}
          tabIndex={-1}
          inert={!open}
          aria-label={title}
          className="card-flip__face--back card-flip__face bg-input flex flex-col p-1 outline-none"
          style={{ border: `1px solid ${accent}`, boxSizing: 'border-box' }}
        >
          <div style={{ border: '1px solid var(--border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 9px 12px' }}>
            {/* Heading */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
              <span
                className="[&>svg]:size-4"
                style={{ width: 32, height: 32, flexShrink: 0, border: `1px solid ${accent}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: accent, lineHeight: 1 }}
              >
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
            {/* The detail itself — scrolls, because the card will not grow */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions — floating clear of the turned card ───────────────────── */}
      {open && (footer || controls) && (
        <div className="card-actions">
          {controls}
          {footer && <div className="card-actions__row">{footer}</div>}
        </div>
      )}
    </div>
  )
}
