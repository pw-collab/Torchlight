/**
 * A button filling its cell of the desktop dock's grid (the rows are 53px).
 * The button base shrinks any svg without a size class to 16px; the icons
 * here bring their own size, so the rule is turned back off.
 */
export const DOCK_CELL_CLASS =
  'h-full min-h-0 w-full min-w-0 px-0 transition-colors duration-[250ms] [&_svg]:size-auto'

/** The dock's primary roll button, the d20: solid ember, as the Figma's Primary icon button. */
export const DOCK_BUTTON_CLASS =
  'border-2 border-border-frame bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/85 data-popup-open:bg-primary ' +
  DOCK_CELL_CLASS
