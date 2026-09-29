import { describe, expect, it } from 'vitest'
import { minimalConfig } from '@/testing/config-fixtures'
import { attemptOf, sessionWith } from '@/testing/stats-fixtures'
import { computeTags } from './tags'

function taggedConfig() {
  const config = minimalConfig()
  config.categories = [
    {
      id: 'b',
      label: 'B',
      order: 2,
      scale: [0, 1],
      questions: [{ id: 'b-1', prompt: 'B1', tags: ['objets'] }],
    },
    {
      id: 'a',
      label: 'A',
      order: 1,
      scale: [0, 1, 2],
      questions: [
        { id: 'a-1', prompt: 'A1', tags: ['boucles', 'tableaux'] },
        { id: 'a-2', prompt: 'A2', tags: ['boucles'] },
      ],
    },
  ]
  return config
}

describe('computeTags', () => {
  it('cumule les notes par tag, une question comptant dans chacun de ses tags', () => {
    const session = sessionWith(
      [[attemptOf('a', 'a-1', 2), attemptOf('a', 'a-2', 0)]],
      taggedConfig(),
    )
    expect(computeTags(session)).toEqual([
      { tag: 'boucles', scored: 2, successRate: 0.5 },
      { tag: 'tableaux', scored: 1, successRate: 1 },
      { tag: 'objets', scored: 0, successRate: null },
    ])
  })

  it('n’intègre ni les skips ni les attempts en cours', () => {
    const session = sessionWith(
      [[attemptOf('a', 'a-1', { skipped: 'x' }), attemptOf('a', 'a-2', 'pending')]],
      taggedConfig(),
    )
    expect(computeTags(session).every((t) => t.scored === 0 && t.successRate === null)).toBe(true)
  })

  it('suit l’ordre de première apparition (catégories par order, questions, tags)', () => {
    const tags = computeTags(sessionWith([[]], taggedConfig())).map((t) => t.tag)
    expect(tags).toEqual(['boucles', 'tableaux', 'objets'])
  })

  it('ignore un absent aux attempts résiduels', () => {
    const session = sessionWith([[attemptOf('a', 'a-1', 2)]], taggedConfig(), () => ({
      absent: true,
    }))
    expect(computeTags(session).every((t) => t.scored === 0)).toBe(true)
  })
})
