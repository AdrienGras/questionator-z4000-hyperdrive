import { describe, expect, it } from 'vitest'
import { asMilli } from '@/domain/scoring/milli'
import { mean, median, populationStdDev } from './numbers'

const milli = (values: number[]) => values.map(asMilli)

describe('mean', () => {
  it('renvoie la moyenne décimale', () => {
    expect(mean(milli([12000, 14000, 16000]))).toBe(14)
  })
  it('renvoie null pour une liste vide', () => {
    expect(mean([])).toBeNull()
  })
})

describe('median', () => {
  it('prend la valeur centrale d’un effectif impair', () => {
    expect(median(milli([16000, 12000, 14000]))).toBe(14)
  })
  it('moyenne les deux valeurs centrales d’un effectif pair', () => {
    expect(median(milli([10000, 12000, 14000, 17000]))).toBe(13)
    expect(median(milli([1000, 2000]))).toBe(1.5)
  })
  it('renvoie null pour une liste vide', () => {
    expect(median([])).toBeNull()
  })
  it('ne modifie pas la liste reçue', () => {
    const values = milli([3000, 1000, 2000])
    median(values)
    expect(values).toEqual([3000, 1000, 2000])
  })
})

describe('populationStdDev', () => {
  it('divise par n (jeu classique)', () => {
    expect(populationStdDev(milli([2000, 4000, 4000, 4000, 5000, 5000, 7000, 9000]))).toBe(2)
  })
  it('vaut 0 pour un seul élément', () => {
    expect(populationStdDev(milli([7000]))).toBe(0)
  })
  it('renvoie null pour une liste vide', () => {
    expect(populationStdDev([])).toBeNull()
  })
})
