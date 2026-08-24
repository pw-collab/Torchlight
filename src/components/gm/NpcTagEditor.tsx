'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
}

/**
 * As tags de uma ficha, editadas onde ela está aberta.
 *
 * Fica em volta do statblock, não dentro: o card é a ficha como ela é lida em
 * voz alta na mesa, e a tag é trabalho de organização — assunto do Mestre com
 * o arquivo dele, não do monstro consigo mesmo.
 */
export function NpcTagEditor({ tags, suggestions, onChange }: Props) {
  const [draft, setDraft] = useState('')

  function add(tag: string) {
    const clean = tag.trim().toLowerCase()
    if (!clean || tags.includes(clean)) return
    onChange([...tags, clean])
    setDraft('')
  }

  const unused = suggestions.filter(tag => !tags.includes(tag)).slice(0, 6)

  return (
    <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
      <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
        Tags
      </span>

      {tags.map(tag => (
        <span
          key={tag}
          className="font-heading inline-flex items-center gap-1 border border-[var(--border)] bg-[var(--card)] px-2 py-[3px] text-[8px] tracking-[0.1em] text-[var(--foreground)] uppercase"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter(t => t !== tag))}
            aria-label={`Tirar a tag ${tag}`}
            className="cursor-pointer pl-0.5 leading-none opacity-60 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        </span>
      ))}

      <Input
        value={draft}
        onChange={e => setDraft(e.target.value.slice(0, 20))}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(draft) } }}
        onBlur={() => add(draft)}
        placeholder="+ tag"
        aria-label="Nova tag"
        className="font-body border-border bg-secondary h-7 w-24 text-[11px] italic"
      />

      {unused.map(tag => (
        <Button
          key={tag}
          type="button"
          variant="ghost"
          onClick={() => add(tag)}
          title={`Marcar como ${tag}`}
          className="font-heading h-7 min-h-7 px-1.5 text-[8px] tracking-[0.1em] text-[var(--muted-foreground)] uppercase opacity-60 hover:opacity-100"
        >
          + {tag}
        </Button>
      ))}
    </div>
  )
}
