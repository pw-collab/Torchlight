'use client'

import { useState } from 'react'
import type { Character } from '@/types/character.types'
import { rollDie, rollFormula, withDc } from '@/lib/dice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props {
  attacker: string
  bonus: number
  damage: string
  /** Os PCs de pé na mesa. Bater em quem já caiu não é decisão do app. */
  targets: Character[]
  onResolved: (payload: Record<string, unknown>) => void
  onApply: (target: Character, amount: number) => void
}

interface Resolution {
  targetId: string
  total: number
  ac: number
  hit: boolean
  critical: boolean
  damage: number | null
}

/**
 * O ataque do NPC contra a CA de verdade (§6.6).
 *
 * A maior fricção de rodar combate era esta: o Mestre rolava, olhava a ficha do
 * jogador para lembrar a CA, comparava de cabeça, perguntava o HP e mandava
 * anotar. Aqui o alvo é escolhido de uma lista de quem está de pé, a CA vem da
 * ficha dele, e o dano — quando acerta — vai direto para lá pelo mesmo caminho
 * de sempre, virando linha do log.
 *
 * O bônus e o dado vêm do statblock (`lib/npcAttack`), que é prosa: ficam
 * editáveis aqui porque o palpite pode não servir.
 */
export function NpcAttack({ attacker, bonus, damage, targets, onResolved, onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [atk, setAtk] = useState(String(bonus))
  const [dmg, setDmg] = useState(damage)
  const [result, setResult] = useState<Resolution | null>(null)

  const parsedBonus = parseInt(atk, 10)
  const attackBonus = Number.isFinite(parsedBonus) ? parsedBonus : 0
  const target = targets.find(t => t.id === result?.targetId) ?? null

  function attack(against: Character) {
    const rolled = rollDie('d20', `${attacker} ataca`, against.name, attackBonus)
    // Contra CA o veredito é o mesmo do DC: natural 20 sempre acerta, natural
    // 1 sempre erra — é a mesma regra de d20 que o resto do app já aplica.
    const settled = withDc(rolled, against.ac)
    const hit = settled.success === true

    const rolledDamage = hit && dmg.trim() ? rollFormula(dmg.trim(), 'Dano', attacker).total : null

    setResult({
      targetId: against.id,
      total: settled.total,
      ac: against.ac,
      hit,
      critical: settled.isCritical === true,
      damage: rolledDamage,
    })
    onResolved({ targetName: against.name, hit, ac: against.ac, total: settled.total })
  }

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) setResult(null)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={targets.length === 0}
            title={targets.length === 0 ? 'Ninguém de pé para atacar' : `Atacar com ${attacker}`}
            className="font-heading h-7 min-h-7 shrink-0 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase disabled:opacity-30"
          >
            ⚔
          </Button>
        }
      />

      <PopoverContent align="end" className="w-[250px]">
        <PopoverHeader>
          <PopoverTitle>{attacker} ataca</PopoverTitle>
        </PopoverHeader>

        <div className="flex flex-col gap-2.5 p-3.5 pt-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-[8px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
              Atq
            </span>
            <Input
              value={atk}
              onChange={e => setAtk(e.target.value.replace(/[^0-9+-]/g, '').slice(0, 3))}
              aria-label="Bônus de ataque"
              className="font-mono border-border bg-secondary h-8 w-12 px-1 text-center text-[12px]"
            />
            <span className="font-heading text-[8px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
              Dano
            </span>
            <Input
              value={dmg}
              onChange={e => setDmg(e.target.value.slice(0, 12))}
              placeholder="1d6"
              aria-label="Dado de dano"
              className="font-mono border-border bg-secondary h-8 flex-1 px-1 text-center text-[12px]"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {targets.map(t => (
              <Button
                key={t.id}
                type="button"
                variant="outline"
                onClick={() => attack(t)}
                title={`CA ${t.ac} · PV ${t.hpCurrent}/${t.hpMax}`}
                className="font-heading h-7 min-h-7 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase"
              >
                {t.name}
              </Button>
            ))}
          </div>

          {result && target && (
            <div
              className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-2.5"
              style={{ color: result.hit ? 'var(--destructive)' : 'var(--muted-foreground)' }}
            >
              <span className="font-heading text-[10px] tracking-[0.12em] uppercase">
                {result.critical && '✦ '}
                {result.hit ? 'Acertou' : 'Errou'} {target.name}
              </span>
              <span className="font-mono text-[9px] text-[var(--muted-foreground)]">
                {result.total} vs CA {result.ac}
              </span>

              {result.hit && result.damage !== null && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onApply(target, result.damage as number)
                    setResult(null)
                    setOpen(false)
                  }}
                  className={cn(
                    'font-heading h-8 min-h-8 rounded-[1px] border-[var(--destructive)] px-2.5',
                    'text-[8.5px] tracking-[0.12em] text-[var(--destructive)] uppercase',
                  )}
                >
                  Aplicar {result.damage} de dano
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
