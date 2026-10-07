/**
 * The horizontal room something hanging off `el` can use before it is cut:
 * the nearest ancestor that clips its overflow (a block that scrolls on its
 * own, like the sheet's panels), or the window when nothing does — less a
 * small margin, so a panel never sits flush against the edge.
 *
 * Popups that are positioned inside the page rather than portalled out of it
 * (the tag details, a card's actions) measure against this instead of the
 * window, so a block that scrolls on its own doesn't slice them in half.
 */
export function clipBounds(el: HTMLElement, margin = 8): { left: number; right: number } {
  for (let node = el.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).overflowX === 'visible') continue
    const { left, right } = node.getBoundingClientRect()
    return {
      left: Math.max(left, 0) + margin,
      right: Math.min(right, window.innerWidth) - margin,
    }
  }
  return { left: margin, right: window.innerWidth - margin }
}
