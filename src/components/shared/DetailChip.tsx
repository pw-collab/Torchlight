'use client'

import { useState, useRef, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  /** Name shown on the closed chip, e.g. `Bard`. */
  label: string
  /** Value after the divider, e.g. `D6`. Left out, the chip is name-only. */
  trailing?: string
  /** Detail revealed on hover (desktop) or tap (mobile). */
  children: ReactNode
  /** Announced on the trigger, since the label alone doesn't say what opens. */
  detailLabel: string
}

const PANEL_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted-foreground)',
  marginBottom: 3,
}

const PANEL_VALUE: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--muted-foreground)',
  lineHeight: 1.4,
}

/** A labelled row inside a chip's detail panel. */
export function ChipDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={PANEL_LABEL}>{label}</div>
      <div style={PANEL_VALUE}>{children}</div>
    </div>
  )
}

/**
 * Solid header tag that condenses a block's identity — `[ Bard | D6 ]` — and
 * keeps the rest of the detail one hover away (a tap on mobile, where there
 * is no hover to give). Used for the class and ancestry tags on the sheet.
 */
export function DetailChip({ label, trailing, children, detailLabel }: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // The panel hangs off the chip's left edge, which pushes it past the right
  // of the screen for any chip that isn't the first one. Measure once it is up
  // and slide it back inside, never past the left edge either. Written onto
  // the node rather than held in state: the panel mounts fresh at left: 0 on
  // every open, so there is nothing to keep between them.
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const panel = panelRef.current
    if (!open || !wrap || !panel) return
    const { left } = wrap.getBoundingClientRect()
    const overflow = left + panel.offsetWidth - (window.innerWidth - 16)
    if (overflow > 0) panel.style.left = `${-Math.min(overflow, Math.max(0, left - 16))}px`
  }, [open])

  // Tapping opens on mobile, so tapping elsewhere is what closes it again.
  useEffect(() => {
    if (!open || !isMobile) return
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, isMobile])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Desktop drives the panel from the wrapper — hover for pointers, focus for
  // keyboards. Both stay off on mobile: a tap focuses the trigger too, so an
  // open-on-focus there would fight the click that is meant to toggle it.
  const desktopProps = isMobile
    ? {}
    : {
        onPointerEnter: () => setOpen(true),
        onPointerLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
        },
      }

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', minWidth: 0 }}
      {...desktopProps}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${label}${trailing ? ` ${trailing}` : ''} — ${detailLabel}`}
        onClick={isMobile ? () => setOpen(o => !o) : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 8,
          minWidth: 0,
          padding: '5px 12px 7px',
          background: 'var(--secondary)',
          color: 'var(--primary-foreground)',
          border: '1px solid var(--input)',
          cursor: isMobile ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 24, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        {trailing && (
          <>
            <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 20, lineHeight: 1, color: 'var(--border)', opacity: 0.45, flexShrink: 0 }}>
              |
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, lineHeight: 1, textTransform: 'uppercase', flexShrink: 0 }}>
              {trailing}
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 30,
            width: 'max-content',
            minWidth: '100%',
            maxWidth: 'min(340px, calc(100vw - 32px))',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.7)',
            padding: '10px 12px 12px',
            textAlign: 'left',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
