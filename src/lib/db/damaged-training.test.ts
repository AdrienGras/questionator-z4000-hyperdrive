import { describe, expect, it } from 'vitest'
import { damagedTrainingName, isDamagedTraining } from './damaged-training'
import { makeTraining } from '@/testing/training-fixtures'

describe('damagedTrainingName', () => {
  it('renvoie le name du brut quand il est lisible', () => {
    expect(
      damagedTrainingName({
        id: 'x',
        damaged: true,
        raw: { id: 'x', name: 'Révisions' },
        issues: [],
      }),
    ).toBe('Révisions')
  })

  it('retombe sur l’id quand le name est absent ou vide', () => {
    expect(damagedTrainingName({ id: 'x', damaged: true, raw: { id: 'x' }, issues: [] })).toBe('x')
    expect(
      damagedTrainingName({ id: 'x', damaged: true, raw: { id: 'x', name: '  ' }, issues: [] }),
    ).toBe('x')
    expect(damagedTrainingName({ id: 'x', damaged: true, raw: null, issues: [] })).toBe('x')
  })
})

describe('isDamagedTraining', () => {
  it('distingue la forme endommagée d’un entraînement sain', () => {
    expect(isDamagedTraining(makeTraining())).toBe(false)
    expect(isDamagedTraining({ id: 'x', damaged: true, raw: {}, issues: [] })).toBe(true)
  })
})
