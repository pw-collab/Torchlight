'use client'

import { motion } from 'framer-motion'
import type { RollResult } from '@/lib/dice'
import { DICE_SPRING } from '@/lib/diceMotion'
import { useNow } from '@/hooks/useNow'
import { RollCard, ROLL_FRESH_MS, rollTone } from '@/components/sheet/RollCard'

interface Props {
  rolls: RollResult[]
  /** Fortuna disponível — sem token, a oferta de rerrolar nem aparece. */
  fortuneLeft?: number
  /** Gasta um token e rola de novo (§5.2). */
  onSpendFortune?: (roll: RollResult) => void
}

/**
 * The fresh rolls, as toasts in the top-right corner — the phone layout,
 * which has no dock to keep a history in. The desktop sheet shows the same
 * cards in the dock instead (see RollHistory).
 */
export function RollToasts({ rolls, fortuneLeft = 0, onSpendFortune }: Props) {
  const now = useNow(1000)
  const visible = rolls.filter(r => now - r.timestamp < ROLL_FRESH_MS)

  return (
    <div style={{
      position: 'fixed',
      top: 58,
      right: 10,
      zIndex: 150,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {/* Só a rolagem mais recente oferece a Fortuna: a segunda chance é da
          jogada que acabou de assentar, não de qualquer coisa ainda na tela. */}
      {visible.map((roll, index) => {
        const canReroll = index === 0 && fortuneLeft > 0 && Boolean(onSpendFortune)
        const tone = rollTone(roll)

        return (
          <motion.div
            key={roll.id}
            className="worn-border"
            initial={{ opacity: 0, x: 26, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={DICE_SPRING.panel}
            style={{
              background: tone.background,
              border: `1px solid ${tone.border}`,
              boxShadow: tone.shadow,
              padding: '10px 14px',
              minWidth: 140,
              maxWidth: 180,
              // A pilha inteira é atravessável pelo ponteiro; só o cartão que
              // oferece a Fortuna precisa receber o clique.
              pointerEvents: canReroll ? 'auto' : 'none',
            }}
          >
            <RollCard
              roll={roll}
              fortuneLeft={fortuneLeft}
              onSpendFortune={canReroll ? () => onSpendFortune?.(roll) : undefined}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
