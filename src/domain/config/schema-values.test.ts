import { describe, expect, test } from 'vitest'
import { collectValues, hoverValues } from './schema-values'

describe('collectValues', () => {
  test('enum, const, booléen et null, en parcourant les anyOf', () => {
    const out: unknown[] = []
    collectValues(
      { anyOf: [{ enum: ['a', 'b'] }, { const: 1 }, { type: ['boolean', 'null'] }] },
      out,
    )
    expect(out).toEqual(['a', 'b', 1, true, false, null])
  })
})

describe('hoverValues', () => {
  test('enum : valeurs en littéraux JSON', () => {
    expect(hoverValues({ type: 'string', enum: ['nearest', 'up', 'down'] })).toEqual({
      kind: 'closed',
      values: ['"nearest"', '"up"', '"down"'],
    })
  })

  test('const : une seule valeur', () => {
    expect(hoverValues({ type: 'number', const: 1 })).toEqual({ kind: 'closed', values: ['1'] })
  })

  test('nombre nullable : null seul', () => {
    expect(hoverValues({ anyOf: [{ type: 'number' }, { type: 'null' }] })).toEqual({
      kind: 'closed',
      values: ['null'],
    })
  })

  test('booléen : aucune ligne', () => {
    expect(hoverValues({ type: 'boolean' })).toBeUndefined()
  })

  test('champ libre : aucune ligne', () => {
    expect(hoverValues({ type: 'string' })).toBeUndefined()
  })

  test('anyOf qui accepte aussi une chaîne libre : liste ouverte', () => {
    expect(hoverValues({ anyOf: [{ enum: ['leaf', 'star'] }, { type: 'string' }] })).toEqual({
      kind: 'open',
    })
  })

  test('doublons écartés', () => {
    expect(hoverValues({ anyOf: [{ enum: ['a'] }, { const: 'a' }] })).toEqual({
      kind: 'closed',
      values: ['"a"'],
    })
  })
})
