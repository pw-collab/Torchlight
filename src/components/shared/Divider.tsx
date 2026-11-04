import { HugeiconsIcon } from '@hugeicons/react'
import { SkullIcon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

/**
 * The Figma's divider (component 250:1233): a rule, a small skull, a rule,
 * all in --border-outline. Decorative, so it stays out of the a11y tree.
 */
export function Divider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('flex shrink-0 items-center gap-1 text-[var(--border-outline)]', className)}>
      <span className="h-px flex-1 bg-current" />
      <HugeiconsIcon icon={SkullIcon} size={12} strokeWidth={2} />
      <span className="h-px flex-1 bg-current" />
    </div>
  )
}
