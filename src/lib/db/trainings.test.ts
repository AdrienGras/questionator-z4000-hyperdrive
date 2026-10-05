import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { TrainingError } from '@/domain/training/errors'
import type { Training } from '@/domain/training/types'
import { makeDraw, makeTraining, makeTrainingConfig } from '@/testing/training-fixtures'
import { db } from './db'
import { isDamagedTraining, type StoredTraining } from './damaged-training'
import { TrainingDamagedError, TrainingExistsError, TrainingNotFoundError } from './errors'
import {
  createTraining,
  deleteTraining,
  drawTrainingQuestion,
  getTraining,
  getTrainingDraws,
  listTrainings,
  passTrainingDraw,
  replaceTrainingConfigInDb,
  scoreTrainingDraw,
} from './trainings'

const NOW = '2026-10-05T12:00:00.000Z'
const now = () => new Date(NOW)
const first = () => 0

beforeEach(async () => {
  await db.trainings.clear()
  await db.trainingDraws.clear()
})

function healthyTraining(stored: StoredTraining | null): Training {
  if (stored === null || isDamagedTraining(stored)) throw new Error('entraînement sain attendu')
  return stored
}

/** Config sans la question `a-1`, sous un autre titre d'examen. */
function configWithoutA1(): NormalizedConfig {
  const config = makeTrainingConfig()
  return {
    ...config,
    exam: { ...config.exam, title: 'Nouvel examen' },
    categories: config.categories.map((c) =>
      c.id === 'a' ? { ...c, questions: c.questions.filter((q) => q.id !== 'a-1') } : c,
    ),
  }
}

describe('lecture', () => {
  test('createTraining puis getTraining', async () => {
    await createTraining(makeTraining())
    expect(await getTraining('training-1')).toEqual(makeTraining())
  })

  test('createTraining refuse un id existant sans rien écraser', async () => {
    await createTraining(makeTraining())
    const error = await createTraining(makeTraining({ name: 'Autre' })).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(TrainingExistsError)
    expect(error).toMatchObject({ id: 'training-1' })
    expect(healthyTraining(await getTraining('training-1')).name).toBe(makeTraining().name)
  })

  test('getTraining renvoie null pour un entraînement absent', async () => {
    expect(await getTraining('absent')).toBeNull()
  })

  test('getTraining d’un enregistrement incohérent renvoie la forme endommagée', async () => {
    const raw = { ...makeTraining(), name: '' }
    await db.trainings.put(raw)
    const stored = await getTraining('training-1')
    if (stored === null || !isDamagedTraining(stored)) throw new Error('forme endommagée attendue')
    expect(stored.raw).toEqual(raw)
    expect(stored.issues.length).toBeGreaterThan(0)
  })

  test('listTrainings trie par updatedAt décroissant', async () => {
    await createTraining(makeTraining({ id: 'a', updatedAt: '2026-10-05T08:00:00.000Z' }))
    await createTraining(makeTraining({ id: 'b', updatedAt: '2026-10-05T10:00:00.000Z' }))
    await createTraining(makeTraining({ id: 'c', updatedAt: '2026-10-05T09:00:00.000Z' }))
    expect((await listTrainings()).map((t) => t.id)).toEqual(['b', 'c', 'a'])
  })

  test('listTrainings sur une table vide renvoie une liste vide', async () => {
    expect(await listTrainings()).toEqual([])
  })

  test('getTrainingDraws : ordre d’insertion, cet entraînement seul, lignes invalides écartées', async () => {
    await db.trainingDraws.add(makeDraw({ questionId: 'a-2', outcome: { kind: 'passed' } }))
    await db.trainingDraws.add(makeDraw({ trainingId: 'autre' }))
    await db.trainingDraws.add({ ...makeDraw(), questionId: '' })
    await db.trainingDraws.add(makeDraw({ questionId: 'a-1' }))
    const draws = await getTrainingDraws('training-1')
    expect(draws.map((d) => d.questionId)).toEqual(['a-2', 'a-1'])
    expect(draws.every((d) => typeof d.id === 'number')).toBe(true)
  })
})

describe('drawTrainingQuestion', () => {
  test('écrit un tirage pending, le renvoie avec son id et pose updatedAt', async () => {
    await createTraining(makeTraining())
    const draw = await drawTrainingQuestion('training-1', 'a', { random: first, now })
    expect(typeof draw.id).toBe('number')
    expect(draw).toEqual({
      id: draw.id,
      trainingId: 'training-1',
      questionId: 'a-1',
      drawnAt: NOW,
      outcome: { kind: 'pending' },
    })
    expect(await getTrainingDraws('training-1')).toEqual([draw])
    expect(healthyTraining(await getTraining('training-1')).updatedAt).toBe(NOW)
  })

  test('deux tirages concurrents : un seul pending, l’autre refusé pending_exists', async () => {
    await createTraining(makeTraining())
    const results = await Promise.allSettled([
      drawTrainingQuestion('training-1', 'a', { random: first, now }),
      drawTrainingQuestion('training-1', 'a', { random: first, now }),
    ])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(rejected).toHaveLength(1)
    const reason: unknown = rejected[0]?.reason
    expect(reason).toBeInstanceOf(TrainingError)
    expect(reason).toMatchObject({ code: 'pending_exists' })
    const pending = (await db.trainingDraws.toArray()).filter((d) => d.outcome.kind === 'pending')
    expect(pending).toHaveLength(1)
  })

  test('catégorie inconnue : TrainingError category_not_found, rien d’écrit', async () => {
    await createTraining(makeTraining())
    await expect(
      drawTrainingQuestion('training-1', 'zzz', { random: first, now }),
    ).rejects.toMatchObject({ code: 'category_not_found' })
    expect(await db.trainingDraws.count()).toBe(0)
    expect(healthyTraining(await getTraining('training-1')).updatedAt).toBe(
      makeTraining().updatedAt,
    )
  })

  test('validateur pas encore chargé : le premier tirage aboutit (la transaction n’expire pas)', async () => {
    await createTraining(makeTraining())
    vi.resetModules()
    const fresh = await import('./trainings')
    const draw = await fresh.drawTrainingQuestion('training-1', 'a', { random: first, now })
    expect(draw.outcome).toEqual({ kind: 'pending' })
  })
})

describe('scoreTrainingDraw et passTrainingDraw', () => {
  test('noter puis relire : scored avec le max figé, updatedAt posé', async () => {
    await createTraining(makeTraining())
    const draw = await drawTrainingQuestion('training-1', 'b', {
      random: first,
      now: () => new Date('2026-10-05T11:00:00.000Z'),
    })
    await scoreTrainingDraw('training-1', draw.id!, 0.5, { now })
    expect(await getTrainingDraws('training-1')).toEqual([
      { ...draw, outcome: { kind: 'scored', points: 0.5, max: 1 } },
    ])
    expect(healthyTraining(await getTraining('training-1')).updatedAt).toBe(NOW)
  })

  test('une note hors barème est refusée sans rien écrire', async () => {
    await createTraining(makeTraining())
    const draw = await drawTrainingQuestion('training-1', 'b', { random: first, now })
    await expect(scoreTrainingDraw('training-1', draw.id!, 0.7, { now })).rejects.toMatchObject({
      code: 'score_not_in_scale',
    })
    expect((await getTrainingDraws('training-1'))[0]?.outcome).toEqual({ kind: 'pending' })
  })

  test('passer un tirage en cours', async () => {
    await createTraining(makeTraining())
    const draw = await drawTrainingQuestion('training-1', 'a', { random: first, now })
    await passTrainingDraw('training-1', draw.id!, { now })
    expect((await getTrainingDraws('training-1'))[0]?.outcome).toEqual({ kind: 'passed' })
  })

  test('un tirage déjà résolu ou inconnu : not_pending', async () => {
    await createTraining(makeTraining())
    const draw = await drawTrainingQuestion('training-1', 'a', { random: first, now })
    await passTrainingDraw('training-1', draw.id!, { now })
    await expect(passTrainingDraw('training-1', draw.id!, { now })).rejects.toMatchObject({
      code: 'not_pending',
    })
    await expect(scoreTrainingDraw('training-1', 9999, 1, { now })).rejects.toMatchObject({
      code: 'not_pending',
    })
  })

  test('un tirage d’un autre entraînement : not_pending, rien d’écrit', async () => {
    await createTraining(makeTraining())
    await createTraining(makeTraining({ id: 'training-2' }))
    const other = await drawTrainingQuestion('training-2', 'a', { random: first, now })
    await expect(passTrainingDraw('training-1', other.id!, { now })).rejects.toMatchObject({
      code: 'not_pending',
    })
    await expect(scoreTrainingDraw('training-1', other.id!, 1, { now })).rejects.toMatchObject({
      code: 'not_pending',
    })
    expect((await getTrainingDraws('training-2'))[0]?.outcome).toEqual({ kind: 'pending' })
  })
})

describe('replaceTrainingConfigInDb', () => {
  test('pending orphelin passé à passed, name suivi, journal conservé', async () => {
    await createTraining(makeTraining())
    await db.trainingDraws.add(
      makeDraw({ questionId: 'a-2', outcome: { kind: 'scored', points: 2, max: 2 } }),
    )
    await db.trainingDraws.add(makeDraw({ questionId: 'a-1' }))
    const config = configWithoutA1()
    await replaceTrainingConfigInDb('training-1', config, { now })

    const training = healthyTraining(await getTraining('training-1'))
    expect(training.name).toBe('Nouvel examen')
    expect(training.config).toEqual(config)
    expect(training.updatedAt).toBe(NOW)
    expect(training.createdAt).toBe(makeTraining().createdAt)
    expect((await getTrainingDraws('training-1')).map((d) => [d.questionId, d.outcome])).toEqual([
      ['a-2', { kind: 'scored', points: 2, max: 2 }],
      ['a-1', { kind: 'passed' }],
    ])
  })

  test('un pending dont la question existe encore reste pending', async () => {
    await createTraining(makeTraining())
    await db.trainingDraws.add(makeDraw({ questionId: 'a-2' }))
    await replaceTrainingConfigInDb('training-1', configWithoutA1(), { now })
    expect((await getTrainingDraws('training-1'))[0]?.outcome).toEqual({ kind: 'pending' })
  })
})

describe('deleteTraining', () => {
  test('supprime l’entraînement et son journal, pas celui des autres', async () => {
    await createTraining(makeTraining())
    await createTraining(makeTraining({ id: 'training-2' }))
    await db.trainingDraws.add(makeDraw())
    await db.trainingDraws.add(makeDraw({ trainingId: 'training-2' }))
    await deleteTraining('training-1')
    expect(await getTraining('training-1')).toBeNull()
    expect(await getTrainingDraws('training-1')).toEqual([])
    expect(await getTraining('training-2')).not.toBeNull()
    expect(await getTrainingDraws('training-2')).toHaveLength(1)
  })

  test('ne lève pas sur un entraînement absent', async () => {
    await expect(deleteTraining('absent')).resolves.toBeUndefined()
  })
})

describe('écritures refusées', () => {
  const writes: [string, () => Promise<unknown>][] = [
    ['drawTrainingQuestion', () => drawTrainingQuestion('training-1', 'a', { random: first, now })],
    ['scoreTrainingDraw', () => scoreTrainingDraw('training-1', 1, 1, { now })],
    ['passTrainingDraw', () => passTrainingDraw('training-1', 1, { now })],
    [
      'replaceTrainingConfigInDb',
      () => replaceTrainingConfigInDb('training-1', makeTrainingConfig(), { now }),
    ],
  ]

  test.each(writes)('%s : entraînement absent → TrainingNotFoundError', async (_name, write) => {
    const error = await write().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(TrainingNotFoundError)
    expect(error).toMatchObject({ id: 'training-1' })
  })

  test.each(writes)(
    '%s : entraînement endommagé → TrainingDamagedError, rien d’écrit',
    async (_name, write) => {
      const raw = { ...makeTraining(), name: '' }
      await db.trainings.put(raw)
      await db.trainingDraws.add(makeDraw({ id: 1 }))
      const error = await write().catch((e: unknown) => e)
      expect(error).toBeInstanceOf(TrainingDamagedError)
      expect(error).toMatchObject({ id: 'training-1' })
      expect(await db.trainings.get('training-1')).toEqual(raw)
      expect(await db.trainingDraws.toArray()).toEqual([makeDraw({ id: 1 })])
    },
  )
})
