import { vi } from 'vitest'

/**
 * `ResizeObserver` de test qui mesure tout élément observé à 384 px, dès `observe` : l'aperçu de
 * projection (F22) sort de `visibility: hidden` sans rappel déclenché à la main. À installer par
 * `vi.stubGlobal('ResizeObserver', FixedWidthResizeObserver)`, retiré par `vi.unstubAllGlobals()`.
 */
export class FixedWidthResizeObserver {
  static readonly width = 384
  private readonly cb: (entries: { contentRect: { width: number } }[]) => void
  constructor(cb: (entries: { contentRect: { width: number } }[]) => void) {
    this.cb = cb
  }
  observe() {
    this.cb([{ contentRect: { width: FixedWidthResizeObserver.width } }])
  }
  disconnect() {
    // Rien à libérer : aucune observation réelle.
  }
}

type ResizeCallback = (entries: { contentRect: { width: number } }[]) => void

/**
 * `ResizeObserver` de test piloté à la main : rien n'est mesuré avant `resize(width)`, qui rappelle
 * le dernier observateur créé (à envelopper dans `act`). `observed` et `disconnected` espionnent
 * les appels de toutes les instances ; `reset()` remet le tout à zéro entre deux tests. À installer
 * par `vi.stubGlobal('ResizeObserver', ManualResizeObserver)`.
 */
export class ManualResizeObserver {
  private static callback: ResizeCallback | undefined
  static readonly observed = vi.fn<(element: Element) => void>()
  static readonly disconnected = vi.fn<() => void>()

  static reset(): void {
    ManualResizeObserver.callback = undefined
    ManualResizeObserver.observed.mockClear()
    ManualResizeObserver.disconnected.mockClear()
  }

  static resize(width: number): void {
    ManualResizeObserver.callback?.([{ contentRect: { width } }])
  }

  constructor(cb: ResizeCallback) {
    ManualResizeObserver.callback = cb
  }

  observe(element: Element): void {
    ManualResizeObserver.observed(element)
  }

  disconnect(): void {
    ManualResizeObserver.disconnected()
  }
}
