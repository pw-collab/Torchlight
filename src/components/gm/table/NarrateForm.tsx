'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

/**
 * Uma linha de narração para a mesa inteira: "a porta range e algo respira do
 * outro lado". Vai para o log como nota do Mestre e aparece como aviso na
 * ficha de cada jogador.
 */
export function NarrateForm({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const ready = text.trim().length > 0

  function send() {
    if (!ready) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value.slice(0, 280))}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() }
        }}
        placeholder="A porta range. Algo respira do outro lado…"
        aria-label="Narração para a mesa"
        className="font-body border-border bg-secondary min-h-[96px] text-[13px] leading-relaxed italic"
      />
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{text.length}/280 · Ctrl+Enter envia</span>
        <Button
          type="button"
          onClick={send}
          disabled={!ready}
          className="ml-auto h-10 px-4 text-[11px] tracking-[0.12em] disabled:opacity-40"
        >
          Contar à mesa
        </Button>
      </div>
    </div>
  )
}
