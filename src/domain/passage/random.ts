/** Source d'entropie : remplit et renvoie le buffer (permet de simuler `crypto.getRandomValues`). */
export type RandomFill = (buffer: Uint32Array<ArrayBuffer>) => Uint32Array<ArrayBuffer>

const defaultFill: RandomFill = (buffer) => crypto.getRandomValues(buffer)

/** Entier uniforme dans `[0, n[` sans biais de modulo (rejection sampling). */
export function cryptoRandomInt(n: number, fill: RandomFill = defaultFill): number {
  if (!Number.isInteger(n) || n < 1 || n > 2 ** 32) {
    throw new RangeError(`n invalide : ${n}`)
  }
  const limit = 2 ** 32 - (2 ** 32 % n)
  let value: number
  do {
    const drawn = fill(new Uint32Array(1))[0]
    if (drawn === undefined) throw new Error('Buffer vide : aucune valeur tirée')
    value = drawn
  } while (value >= limit)
  return value % n
}

/** Tire un élément uniformément, via `random(items.length)`. */
export function pickUniform<T>(items: readonly T[], random: (n: number) => number): T {
  if (items.length === 0) throw new RangeError('Liste vide')
  const picked = items[random(items.length)]
  if (picked === undefined) throw new RangeError('Index hors limites renvoyé par random')
  return picked
}
