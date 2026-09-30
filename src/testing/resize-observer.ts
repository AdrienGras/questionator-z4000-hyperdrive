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
