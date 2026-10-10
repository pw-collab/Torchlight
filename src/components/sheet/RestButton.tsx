'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  /** Quantas rações ainda há na mochila. */
  rations: number
  hpFull: boolean
  busy?: boolean
  onRest: () => void
}

/**
 * Acampar.
 *
 * O loop de Shadowdark é explorar → gastar → recuperar, e a última parte era
 * feita de cabeça: rolar o dado de vida à parte, lembrar de riscar a ração,
 * lembrar de anotar. Um botão fecha o ciclo e o registra na mesa.
 */
export function RestButton({ rations, hpFull, busy, onRest }: Props) {
  const noFood = rations === 0

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onRest}
      disabled={busy}
      title={
        noFood
          ? 'Sem rações na mochila — descansar de estômago vazio não recupera nada'
          : hpFull
            ? 'Vida cheia: descansar ainda devolve magias e técnicas, e consome uma ração'
            : `Rolar a recuperação da classe, recuperar magias e técnicas, e consumir uma ração (${rations} restante${rations === 1 ? '' : 's'})`
      }
      className={cn(
        'font-heading h-9 min-h-9 shrink-0 gap-1.5 rounded-[1px] px-3 text-[8.5px] tracking-[0.14em] uppercase',
        noFood
          ? 'border-[var(--destructive)] text-[var(--destructive)]'
          : 'border-[var(--border)] text-[var(--muted-foreground)]',
      )}
    >
      ⛺ Descansar
      <span className="font-mono text-[8px] opacity-70">
        {noFood ? 'sem ração' : `${rations} ✦`}
      </span>
    </Button>
  )
}
