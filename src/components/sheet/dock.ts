/**
 * The dock's two roll buttons, attacks and dice: solid ember, filling their
 * cell of the dock's grid (the rows are 53px). Shared so the pair never
 * drifts apart.
 *
 * The button base shrinks any svg without a size class to 16px; the icons
 * here bring their own size, so the rule is turned back off.
 */
export const DOCK_BUTTON_CLASS =
  'border-input-border bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/85 data-popup-open:bg-primary ' +
  'h-full min-h-0 w-full min-w-0 px-0 transition-colors duration-[250ms] [&_svg]:size-auto'
