import { expect, test } from 'vitest'
import { categoryAccent } from './category-accent'

test('pose la couleur brute et son encre, dérivée selon le mode', () => {
  expect(categoryAccent('#22c55e')).toEqual({
    '--category-color': '#22c55e',
    '--category-ink': 'color-mix(in oklch, #22c55e var(--category-ink-mix), black)',
  })
})

test('sans couleur : aucun style, les replis des classes s’appliquent', () => {
  expect(categoryAccent(undefined)).toBeUndefined()
})
