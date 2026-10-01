import { describe, expect, it } from 'vitest'
import { damagedName } from './damaged-session'

describe('damagedName', () => {
  it('retombe sur l’id quand le name est composé d’espaces', () => {
    expect(damagedName({ id: 'x', damaged: true, raw: { id: 'x', name: '   ' }, issues: [] })).toBe(
      'x',
    )
  })

  it('renvoie le name quand il est lisible', () => {
    expect(damagedName({ id: 'x', damaged: true, raw: { id: 'x', name: 'Bob' }, issues: [] })).toBe(
      'Bob',
    )
  })
})
