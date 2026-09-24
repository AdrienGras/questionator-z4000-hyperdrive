import { describe, expect, test } from 'vitest'
import { minimalConfig } from '../test/config-fixtures'
import { normalize } from './normalize'

const question = (id: string) => [{ id, prompt: id }]

describe('normalize', () => {
  test('applique tous les défauts de §6.2', () => {
    const config = minimalConfig()
    delete config.skips
    expect(normalize(config)).toEqual({
      schemaVersion: 1,
      exam: { title: 'Oral de test' },
      scoring: {
        questionsPerStudent: 1,
        maxRawScore: 2,
        finalScale: 20,
        rounding: { mode: 'nearest', decimals: 2, step: null },
      },
      absent: { export: 'label', label: 'ABS' },
      skips: { enabled: true, maxPerStudent: 1, reasons: [], allowFreeText: true },
      presentation: {
        showCumulativeScore: true,
        finalScoreDisplay: 'both',
        showStatsOnFinal: false,
        drawAnimation: true,
        defaultColorMode: 'system',
      },
      theme: { light: {}, dark: {} },
      categories: [
        {
          id: 'a',
          label: 'A',
          scale: [0, 1, 2],
          order: 1,
          questions: [{ id: 'a-1', title: 'Question A1', tags: [], prompt: 'Question A1' }],
        },
      ],
    })
  })

  test('retire $schema et laisse locale absente', () => {
    const normalized = normalize({ ...minimalConfig(), $schema: 'https://x' })
    expect('$schema' in normalized).toBe(false)
    expect('locale' in normalized).toBe(false)
    expect(normalize({ ...minimalConfig(), locale: 'en' }).locale).toBe('en')
  })

  test('conserve les valeurs fournies', () => {
    const config = minimalConfig()
    config.exam.subject = 'PHP'
    config.absent = { export: 'value', value: 0 }
    config.theme = { dark: { primary: 'red' } }
    config.categories[0]!.color = 'red'
    config.categories[0]!.icon = 'leaf'
    config.categories[0]!.questions[0] = {
      id: 'a-1',
      title: 'Titre',
      tags: ['bases'],
      prompt: 'P',
      answer: 'R',
    }
    const normalized = normalize(config)
    expect(normalized.exam.subject).toBe('PHP')
    expect(normalized.absent).toEqual({ export: 'value', label: 'ABS', value: 0 })
    expect(normalized.theme).toEqual({ light: {}, dark: { primary: 'red' } })
    expect(normalized.categories[0]).toMatchObject({ color: 'red', icon: 'leaf' })
    expect(normalized.categories[0]!.questions[0]).toEqual({
      id: 'a-1',
      title: 'Titre',
      tags: ['bases'],
      prompt: 'P',
      answer: 'R',
    })
  })

  test('trie les catégories par order puis par position, et réécrit order en 1…n', () => {
    const config = minimalConfig()
    config.categories = [
      { id: 'c', label: 'C', scale: [1], order: 5, questions: question('c-1') },
      { id: 'a', label: 'A', scale: [1], order: 1, questions: question('a-1') },
      { id: 'b', label: 'B', scale: [1], order: 1, questions: question('b-1') },
    ]
    const normalized = normalize(config)
    expect(normalized.categories.map(({ id, order }) => [id, order])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])
  })

  test('ne modifie pas la config d’entrée', () => {
    const config = minimalConfig()
    const snapshot = structuredClone(config)
    normalize(config)
    expect(config).toEqual(snapshot)
  })
})
