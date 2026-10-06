import { describe, expect, test } from 'vitest'
import { makeDraw, makeTraining, makeTrainingConfig } from '@/testing/training-fixtures'
import { diffTrainingConfig, replaceTrainingConfig } from './replace-config'

function configWithoutA3() {
  const config = makeTrainingConfig()
  config.exam.title = 'Nouveau titre'
  const [a] = config.categories
  if (a) a.questions = a.questions.filter((q) => q.id !== 'a-3')
  return config
}

describe('replaceTrainingConfig', () => {
  test('remplace la config et suit le nom', () => {
    const config = configWithoutA3()
    const { training } = replaceTrainingConfig(makeTraining(), config, [])
    expect(training.config).toBe(config)
    expect(training.name).toBe('Nouveau titre')
  })

  test('liste les tirages en cours dont la question a disparu', () => {
    const draws = [
      makeDraw({ id: 1, questionId: 'a-3' }),
      makeDraw({ id: 2, questionId: 'a-1' }),
      makeDraw({ id: 3, questionId: 'a-3', outcome: { kind: 'passed' } }),
    ]
    const { orphanPendingIds } = replaceTrainingConfig(makeTraining(), configWithoutA3(), draws)
    expect(orphanPendingIds).toEqual([1])
  })

  test('ne liste aucun tirage quand toutes les questions existent encore', () => {
    const draws = [makeDraw({ id: 1, questionId: 'a-1' })]
    const { orphanPendingIds } = replaceTrainingConfig(makeTraining(), makeTrainingConfig(), draws)
    expect(orphanPendingIds).toEqual([])
  })

  test('ne modifie ni le journal ni updatedAt', () => {
    const draws = [makeDraw({ id: 1, questionId: 'a-3' })]
    const snapshot = structuredClone(draws)
    const training = makeTraining()
    const result = replaceTrainingConfig(training, configWithoutA3(), draws)
    expect(draws).toEqual(snapshot)
    expect(result.training.updatedAt).toBe(training.updatedAt)
  })
})

describe('diffTrainingConfig', () => {
  test('configs identiques : tout est conservé', () => {
    expect(diffTrainingConfig(makeTrainingConfig(), makeTrainingConfig())).toEqual({
      kept: 4,
      added: 0,
      removed: 0,
    })
  })

  test('une question retirée, une ajoutée', () => {
    const next = configWithoutA3()
    const [a] = next.categories
    if (a) a.questions = [...a.questions, { ...a.questions[0]!, id: 'a-9' }]
    expect(diffTrainingConfig(makeTrainingConfig(), next)).toEqual({
      kept: 3,
      added: 1,
      removed: 1,
    })
  })

  test('tous les ids changent : rien de conservé', () => {
    const next = makeTrainingConfig()
    for (const c of next.categories)
      c.questions = c.questions.map((q) => ({ ...q, id: `n-${q.id}` }))
    expect(diffTrainingConfig(makeTrainingConfig(), next)).toEqual({
      kept: 0,
      added: 4,
      removed: 4,
    })
  })

  test('une question déplacée de catégorie reste conservée', () => {
    const next = makeTrainingConfig()
    const [a, b] = next.categories
    if (a && b) {
      const moved = a.questions.find((q) => q.id === 'a-3')!
      a.questions = a.questions.filter((q) => q.id !== 'a-3')
      b.questions = [...b.questions, moved]
    }
    expect(diffTrainingConfig(makeTrainingConfig(), next)).toEqual({
      kept: 4,
      added: 0,
      removed: 0,
    })
  })
})
