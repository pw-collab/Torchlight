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
        <span className="font-mono text-[9px] text-[var(--muted-foreground)]">{text.length}/280 · Ctrl+Enter envia</span>
        <Button
          type="button"
          variant="outline"
          onClick={send}
          disabled={!ready}
          className="font-heading ml-auto h-10 min-h-10 rounded-[1px] border-[var(--primary)] px-4 text-[10px] font-bold tracking-[0.14em] uppercase disabled:opacity-30"
        >
          💬 Contar à mesa
        </Button>
      </div>
    </div>
  )
}
