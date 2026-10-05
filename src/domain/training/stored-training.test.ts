import { describe, expect, test } from 'vitest'
import { acceptAllCss } from '@/testing/backup-fixtures'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'
import { checkStoredTraining, parseStoredDraws } from './stored-training'

const deps = { cssSupports: acceptAllCss }

describe('checkStoredTraining', () => {
  test('entraînement sain : ok, config validée', () => {
    const training = makeTraining()
    const result = checkStoredTraining(training, deps)
    expect(result).toEqual({ ok: true, training })
  })

  test('clé inconnue : refusé avec un chemin training', () => {
    const result = checkStoredTraining({ ...makeTraining(), extra: 1 }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues.every((i) => i.path[0] === 'training')).toBe(true)
  })

  test('config invalide : refusé avec un chemin training.config', () => {
    const training = makeTraining()
    const config = { ...training.config, categories: [] }
    const result = checkStoredTraining({ ...training, config }, deps)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues.every((i) => i.path[0] === 'training' && i.path[1] === 'config')).toBe(
      true,
    )
  })
})

describe('parseStoredDraws', () => {
  test('écarte les lignes invalides et garde les autres dans l’ordre', () => {
    const good1 = makeDraw({ id: 1 })
    const good2 = makeDraw({ id: 2, outcome: { kind: 'scored', points: 1.5, max: 2 } })
    const bogus = { ...makeDraw({ id: 3 }), outcome: { kind: 'bogus' } }
    const { questionId: _q, ...noQuestion } = makeDraw({ id: 4 })
    expect(parseStoredDraws([good1, bogus, noQuestion, good2, null])).toEqual([good1, good2])
  })

  test('écarte une ligne dont les points ne sont pas finis', () => {
    const infinite = makeDraw({ id: 1, outcome: { kind: 'scored', points: Infinity, max: 2 } })
    const good = makeDraw({ id: 2 })
    expect(parseStoredDraws([infinite, good])).toEqual([good])
  })

  test('écarte une ligne dont drawnAt n’est pas une date ISO', () => {
    const bad = makeDraw({ id: 1, drawnAt: 'hier' })
    const good = makeDraw({ id: 2 })
    expect(parseStoredDraws([bad, good])).toEqual([good])
  })
})
