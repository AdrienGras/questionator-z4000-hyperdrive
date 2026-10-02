// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DOCS_NAVIGATION_DENYLIST } from './docs-navigation-denylist.ts'

const BASE = '/questionator-z4000-hyperdrive/'

describe('DOCS_NAVIGATION_DENYLIST', () => {
  it.each([
    `${BASE}docs`,
    `${BASE}docs/`,
    `${BASE}docs/guide/prise-en-main.html`,
    `${BASE}docs?x=1`,
  ])('exclut %s du repli de navigation', (url) => {
    expect(DOCS_NAVIGATION_DENYLIST.test(url)).toBe(true)
  })

  it.each([BASE, `${BASE}?docs=1`, `${BASE}docsfoo`, `${BASE}index.html`])(
    'laisse %s au repli de navigation',
    (url) => {
      expect(DOCS_NAVIGATION_DENYLIST.test(url)).toBe(false)
    },
  )
})
