import { describe, expect, it } from 'vitest'
import { isKnownLanguage } from '@/domain/config/code-languages'

describe('isKnownLanguage', () => {
  it.each(['python', 'py', 'PY', 'yml', 'dockerfile', 'sh', 'PHP'])('reconnaît %s', (language) => {
    expect(isKnownLanguage(language)).toBe(true)
  })

  it('ne reconnaît pas une faute de frappe', () => {
    expect(isKnownLanguage('pyhton')).toBe(false)
  })

  it("ne reconnaît pas un pseudo-langage (il n'est pas dans le catalogue)", () => {
    expect(isKnownLanguage('text')).toBe(false)
  })
})
