/**
 * The dock's two roll buttons — attacks and dice — on the floor of the card
 * under the vitals: solid red, 56px tall, filling their grid cell. Shared so
 * the pair never drifts apart.
 *
 * The button base shrinks any svg without a size class to 16px; the icons
 * here bring their own size, so the rule is turned back off.
 */
export const DOCK_BUTTON_CLASS =
  'border-input bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/85 data-popup-open:bg-primary ' +
  'h-14 min-h-14 w-full min-w-0 px-0 transition-colors duration-[250ms] [&_svg]:size-auto'
