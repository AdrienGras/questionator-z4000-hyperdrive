import { expect, test } from 'vitest'
import { cn } from './utils'

test('cn fusionne les classes et résout les conflits Tailwind', () => {
  expect(cn('px-2', 'px-4', undefined, 'text-sm')).toBe('px-4 text-sm')
})

test.each(['display', 'h1', 'h2', 'h3', 'score-xl', 'score-md', 'body', 'small', 'label'])(
  'taille de texte text-%s du design system gardée à côté d’une couleur',
  (size) => {
    expect(cn(`text-${size}`, 'text-destructive')).toBe(`text-${size} text-destructive`)
  },
)

test('deux tailles du design system : la dernière l’emporte', () => {
  expect(cn('text-small', 'text-score-md')).toBe('text-score-md')
})
