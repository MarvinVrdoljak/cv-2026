/** Direct DOM helpers for the interaction layer. The CV is server-rendered
    HTML (so it reads without JavaScript); the client controller reaches into
    it through the stable `[data-entry]` contract rather than re-rendering it. */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function entryEl(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-entry='${id}']`)
}

/** Sets `data-highlight` on exactly the given ids, clearing every other. */
export function applyHighlight(ids: Set<string>): void {
  document.querySelectorAll<HTMLElement>('[data-entry]').forEach((el) => {
    const on = ids.has(el.dataset.entry ?? '')
    if (on) el.setAttribute('data-highlight', 'true')
    else el.removeAttribute('data-highlight')
  })
}

/** Scrolls an entry into view, respecting reduced-motion. */
export function scrollToEntry(id: string): void {
  entryEl(id)?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'center',
  })
}

/**
 * Reorders the experience entries by a ranked id list and animates the move
 * with a FLIP transform, so positions change as real motion, not a rebuild.
 * Entries absent from `order` keep their document order after the ranked ones.
 */
export function reorderExperience(order: string[]): void {
  const items = [...document.querySelectorAll<HTMLElement>("[data-entry^='exp-']")]
  if (items.length === 0) return

  const reduce = prefersReducedMotion()
  const first = new Map(items.map((el) => [el, el.getBoundingClientRect().top]))

  const rank = new Map(order.map((id, index) => [id, index]))
  items.forEach((el) => {
    const id = el.dataset.entry ?? ''
    // Ranked entries first (0…n), unranked pushed below in original order.
    el.style.order = String(rank.has(id) ? rank.get(id)! : order.length + items.indexOf(el))
  })

  if (reduce) return

  for (const el of items) {
    const before = first.get(el)
    if (before === undefined) continue
    const delta = before - el.getBoundingClientRect().top
    if (!delta) continue
    el.animate([{transform: `translateY(${delta}px)`}, {transform: 'translateY(0)'}], {
      duration: 400,
      easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
    })
  }
}

/** Clears any relevance ordering, returning entries to document order. */
export function clearExperienceOrder(): void {
  document
    .querySelectorAll<HTMLElement>("[data-entry^='exp-']")
    .forEach((el) => el.style.removeProperty('order'))
}

/** The ids of currently marked (checked) entries, read from the CV form. */
export function readMarkedIds(): string[] {
  return [...document.querySelectorAll<HTMLInputElement>('[data-mark]:checked')].map(
    (input) => input.value
  )
}
