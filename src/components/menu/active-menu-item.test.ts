import { expect, test } from 'vitest'
import { activeMenuItem } from './active-menu-item'

test.each([
  ['/', 'home'],
  ['/sessions', 'sessions'],
  ['/new', 'sessions'],
  ['/session/abc', 'sessions'],
  ['/session/abc/stats', 'sessions'],
  ['/editor', 'editor'],
  ['/trainings', 'training'],
  ['/training/new', 'training'],
  ['/training/t1', 'training'],
  ['/training/t1/stats', 'training'],
  ['/training/t1/update', 'training'],
  ['/nope', undefined],
  ['/sessionsx', undefined],
  ['/editor-old', undefined],
] as const)('%s → %s', (pathname, expected) => {
  expect(activeMenuItem(pathname)).toBe(expected)
})
