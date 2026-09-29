import { describe, expect, test } from 'vitest'
import { identityKey } from './identity'

describe('identityKey', () => {
  test('ignore la casse et les diacritiques', () => {
    expect(identityKey('Durand', 'Élodie')).toBe(identityKey('DURAND', 'elodie'))
  })

  test('distingue deux prénoms différents', () => {
    expect(identityKey('Durand', 'Alice')).not.toBe(identityKey('Durand', 'Alicia'))
  })

  test('sépare nom et prénom sans ambiguïté', () => {
    expect(identityKey('ab', 'c')).not.toBe(identityKey('a', 'bc'))
  })
})
