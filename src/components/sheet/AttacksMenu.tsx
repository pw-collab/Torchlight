'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { Sword01Icon } from '@hugeicons/core-free-icons'
import type { InventoryItem } from '@/types/inventory.types'
import type { RollResult } from '@/lib/dice'
import { attackRoll, damageRoll, heldForCombat, parryRoll, type AttackContext } from '@/lib/attacks'
import { DICE_SPRING } from '@/lib/diceMotion'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import { DOCK_BUTTON_CLASS } from '@/components/sheet/dock'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Props extends AttackContext {
  inventory: InventoryItem[]
  onRoll: (result: RollResult) => void
  /** Where weapons get equipped — offered when the hands are empty. */
  onOpenInventory?: () => void
}

const ROLL_BUTTON_CLASS =
  'font-heading bg-input border-input hover:border-primary h-9 min-h-9 shrink-0 px-2.5 text-[10px] font-bold tracking-[0.12em] uppercase'

/**
 * The quick attack menu on the dock: whatever is in hand, ready to roll.
 *
 * The same attack, damage and parry rolls the inventory makes off its
 * equipped slots (see `lib/attacks`) — this only saves the trip to the
 * inventory tab in the middle of a fight. Equipping still happens there.
 */
export function AttacksMenu({ inventory, str, dex, meleeBonus, rangedBonus, onRoll, onOpenInventory }: Props) {
  const [open, setOpen] = useState(false)
  const held = heldForCombat(inventory)
  const ctx = { str, dex, meleeBonus, rangedBonus }

  function roll(result: RollResult | null) {
    if (!result) return
    setOpen(false)
    onRoll(result)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            title="Ataques"
            aria-label="Abrir ataques"
            render={
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.9 }}
                transition={DICE_SPRING.tap}
              />
            }
            className={DOCK_BUTTON_CLASS}
          />
        }
      >
        <HugeiconsIcon icon={Sword01Icon} size={28} strokeWidth={1.5} />
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        aria-label="Ataques"
        className={
          'bg-popover border-border z-70 flex w-[min(320px,calc(100vw-32px))] flex-col gap-3 ' +
          'border-2 px-3 pt-3.5 pb-4 shadow-[0_-6px_32px_rgba(0,0,0,0.85)]'
        }
      >
        <PopoverHeader className="p-0">
          <PopoverTitle className="font-heading text-popover-foreground text-sm font-extrabold tracking-[0.14em] uppercase">
            Ataques
          </PopoverTitle>
        </PopoverHeader>

        {held.length === 0 ? (
          <div className="flex flex-col gap-2.5">
            <p className="font-body m-0 text-[11px] leading-snug text-[var(--muted-foreground)] italic">
              Nada em mãos. Equipe uma arma ou um escudo no inventário.
            </p>
            {onOpenInventory && (
              <Button
                variant="outline"
                className="font-heading bg-input border-input hover:border-primary h-10 text-[11px] font-bold tracking-[0.12em] uppercase"
                onClick={() => { setOpen(false); onOpenInventory() }}
              >
                Abrir inventário
              </Button>
            )}
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {held.map(item => (
              <li key={item.id} className="bg-input flex items-center gap-2 border border-[var(--border)] px-2.5 py-2">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-heading truncate text-[13px] leading-tight text-[var(--foreground)]">
                    {item.name}
                  </span>
                  <span className="font-mono text-[9px] text-[var(--muted-foreground)]">
                    {item.type === 'shield'
                      ? 'Escudo'
                      : [item.weaponKind === 'ranged' ? 'Distância' : 'Corpo a corpo', item.damageDie]
                          .filter(Boolean)
                          .join(' · ')}
                  </span>
                </span>

                {item.type === 'weapon' ? (
                  <>
                    <RollModeMenu
                      label={`Rolar ataque com ${item.name}`}
                      align="end"
                      onRoll={mode => roll(attackRoll(item, ctx, mode))}
                    >
                      <Button render={<span />} nativeButton={false} variant="outline" className={ROLL_BUTTON_CLASS}>
                        Atk
                      </Button>
                    </RollModeMenu>
                    {item.damageDie && (
                      <Button variant="outline" className={ROLL_BUTTON_CLASS} onClick={() => roll(damageRoll(item))}>
                        Dano
                      </Button>
                    )}
                  </>
                ) : (
                  <Button variant="outline" className={ROLL_BUTTON_CLASS} onClick={() => roll(parryRoll(item, dex))}>
                    Aparar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
