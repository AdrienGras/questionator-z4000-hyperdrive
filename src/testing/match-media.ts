export const DARK_QUERY = '(prefers-color-scheme: dark)'

type ChangeListener = (event: { matches: boolean; media: string }) => void

let systemDark = false
const listeners = new Set<ChangeListener>()

function mediaQueryList(query: string): MediaQueryList {
  const list = {
    get matches() {
      return query === DARK_QUERY && systemDark
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
    addListener: (listener: ChangeListener) => listeners.add(listener),
    removeListener: (listener: ChangeListener) => listeners.delete(listener),
    dispatchEvent: () => true,
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- simulation de test : seuls `matches`, `media` et les ecouteurs sont utilises par l'app.
  return list as unknown as MediaQueryList
}

export function installMatchMedia(): void {
  window.matchMedia = mediaQueryList
}

export function setSystemDark(value: boolean): void {
  systemDark = value
  for (const listener of listeners) listener({ matches: value, media: DARK_QUERY })
}

export function resetMatchMedia(): void {
  systemDark = false
  listeners.clear()
}
