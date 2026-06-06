// Injects clickable <span> wrappers around dice formulas in an HTML string.
// Use with event delegation: check e.target.dataset.formula on the container's onClick.
export function injectDiceSpans(html: string): string {
  return html.replace(
    /(<[^>]*>)|(\b(?:\d+)?d\d+(?:[+-]\d+)?\b)/gi,
    (match, tag) => {
      if (tag) return tag
      return `<span class="dice-formula" data-formula="${match}" title="Clique para rolar ${match}">${match}</span>`
    },
  )
}
