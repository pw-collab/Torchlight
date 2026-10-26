/**
 * The dock's two roll buttons, attacks and dice, on the floor of the side
 * column under the vitals: 56px tall, filling their grid cell. The dice take
 * the terracotta fill with soot ink; the attacks sit on --muted with a bone
 * icon. Shared so the pair never drifts apart.
 *
 * The button base shrinks any svg without a size class to 16px; the icons
 * here bring their own size, so the rule is turned back off.
 */
const DOCK_BUTTON_BASE =
  'h-14 min-h-14 w-full min-w-0 border-0 px-0 transition-colors duration-[250ms] [&_svg]:size-auto'

/** The dice: the terracotta square. */
export const DOCK_BUTTON_CLASS =
  `${DOCK_BUTTON_BASE} bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/85 data-popup-open:bg-primary`

/** The attacks: the same square on --muted. */
export const DOCK_MUTED_BUTTON_CLASS =
  `${DOCK_BUTTON_BASE} bg-muted text-foreground hover:bg-accent data-popup-open:bg-accent`
