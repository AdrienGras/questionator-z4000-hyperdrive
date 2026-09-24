import { describe, expect, test } from 'vitest'
import { configError, configWarning, formatPath } from './issues'

describe('formatPath', () => {
  test('indices entre crochets, clés séparées par des points', () => {
    expect(formatPath(['categories', 2, 'questions', 5, 'id'])).toBe(
      'categories[2].questions[5].id',
    )
    expect(formatPath(['theme', 'dark', 'card-foreground'])).toBe('theme.dark.card-foreground')
    expect(formatPath([])).toBe('')
    expect(formatPath([0, 'a'])).toBe('[0].a')
  })
})

describe('configError / configWarning', () => {
  test('construisent une issue sans propriété message', () => {
    const error = configError('unknown_key', ['exam', 'titel'], { key: 'titel' })
    expect(error).toEqual({
      severity: 'error',
      code: 'unknown_key',
      path: ['exam', 'titel'],
      params: { key: 'titel' },
    })
    expect(configWarning('unknown_icon', ['x'], { icon: 'y' }).severity).toBe('warning')
  })
})
