"use client"

import * as React from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

/**
 * A card that opens beside something while it is looked at, and only reads.
 *
 * It is `Popover`'s read-only sibling. A popover is a small dialog: it moves
 * focus into itself and puts guards in the tab order so its contents can be
 * reached, which is wrong for a card with nothing to reach. This one keeps no
 * focus and no tab stops, and says nothing to a screen reader on its own, so
 * whoever uses it carries the same facts somewhere else (a label, a
 * description) and passes `role="tooltip"` and an `id` when the trigger points
 * at it.
 *
 * Open it controlled (`open`), and give `HoverCardContent` the `anchor` to hang
 * from; there is no trigger part because what opens it is the caller's to say.
 */
function HoverCard({ ...props }: PreviewCardPrimitive.Root.Props) {
  return <PreviewCardPrimitive.Root {...props} />
}

/** The same collision defaults as `PopoverContent`: slide along the edge, don't jump across. */
const DEFAULT_COLLISION_AVOIDANCE: PreviewCardPrimitive.Positioner.Props["collisionAvoidance"] =
  { side: "flip", align: "shift", fallbackAxisSide: "start" }

function HoverCardContent({
  className,
  positionerClassName,
  anchor,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  collisionAvoidance = DEFAULT_COLLISION_AVOIDANCE,
  collisionBoundary,
  collisionPadding = 12,
  sticky,
  positionMethod,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    | "anchor"
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "collisionAvoidance"
    | "collisionBoundary"
    | "collisionPadding"
    | "sticky"
    | "positionMethod"
  > & {
    /** Classes for the positioner box around the card, e.g. `pointer-events-none` to let the pointer through. */
    positionerClassName?: string
  }) {
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        anchor={anchor}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionAvoidance={collisionAvoidance}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        sticky={sticky}
        positionMethod={positionMethod}
        className={cn("isolate z-50", positionerClassName)}
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            // The popover's chrome: surface, ring, and the open/close motion.
            "cn-popover-content cn-popover-content-logical z-50 w-72 origin-(--transform-origin) outline-hidden",
            // Never taller or wider than the room the positioner found.
            "max-h-(--available-height) max-w-(--available-width) overflow-y-auto",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardContent }
