/** Promesse résolue à la demande (`resolve`), pour suspendre une écriture ou un chargement. */
export function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  const box: { resolve?: (value: T) => void } = {}
  const promise = new Promise<T>((resolve) => {
    box.resolve = resolve
  })
  return { promise, resolve: (value: T) => box.resolve?.(value) }
}
