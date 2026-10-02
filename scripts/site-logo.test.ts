import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('le logo de la doc est l’icône de l’app (F27)', () => {
  expect(readFileSync('site/public/logo.svg')).toEqual(readFileSync('public/icons/icon.svg'))
})
