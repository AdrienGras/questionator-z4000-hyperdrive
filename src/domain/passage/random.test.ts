import { describe, expect, test } from 'vitest'
import { cryptoRandomInt, pickUniform, type RandomFill } from './random'

/** Source simulée : renvoie les valeurs fournies dans l'ordre, une par appel. */
const fillWith = (...values: number[]): RandomFill => {
  let i = 0
  return (buffer) => {
    buffer[0] = values[i++]!
    return buffer
  }
}

describe('cryptoRandomInt', () => {
  test('valeur sous la limite : renvoie value % n', () => {
    expect(cryptoRandomInt(6, fillWith(0))).toBe(0)
    expect(cryptoRandomInt(6, fillWith(4_294_967_291))).toBe(5)
  })

  test("valeur au-dessus de la limite : rejetée, retire jusqu'à une valeur valide", () => {
    expect(cryptoRandomInt(6, fillWith(4_294_967_295, 7))).toBe(1)
  })

  test('n = 1 : toujours 0', () => {
    expect(cryptoRandomInt(1, fillWith(123))).toBe(0)
  })

  test('sans source fournie : utilise crypto.getRandomValues, reste dans {0, 1, 2}', () => {
    for (let i = 0; i < 1000; i++) {
      expect([0, 1, 2]).toContain(cryptoRandomInt(3))
    }
  })

  test.each([0, -1, 1.5, 2 ** 32 + 1, Number.NaN])('n invalide (%j) lève', (n) => {
    expect(() => cryptoRandomInt(n)).toThrow(RangeError)
  })
})

describe('pickUniform', () => {
  test('distribution uniforme sur un random déterministe', () => {
    const items = ['a', 'b', 'c'] as const
    let i = 0
    const random = (n: number) => i++ % n
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 }
    for (let draw = 0; draw < 300; draw++) {
      const picked = pickUniform(items, random)
      counts[picked] = (counts[picked] ?? 0) + 1
    }
    expect(counts).toEqual({ a: 100, b: 100, c: 100 })
  })

  test('liste vide lève', () => {
    expect(() => pickUniform([], () => 0)).toThrow(RangeError)
  })
})
