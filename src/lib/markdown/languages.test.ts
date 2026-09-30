import { describe, expect, it } from 'vitest'
import { isPlainLanguage, normalizeLanguage } from '@/lib/markdown/languages'

describe('normalizeLanguage', () => {
  it("garde le premier mot de l'info string, en minuscules", () => {
    expect(normalizeLanguage('PHP title=x')).toBe('php')
  })

  it('ignore les espaces autour', () => {
    expect(normalizeLanguage('  py  ')).toBe('py')
  })

  it('renvoie une chaîne vide pour une info string vide', () => {
    expect(normalizeLanguage('')).toBe('')
    expect(normalizeLanguage('   ')).toBe('')
  })
})

describe('isPlainLanguage', () => {
  it.each(['text', 'txt', 'plain', 'plaintext'])('reconnaît %s comme texte brut', (l) => {
    expect(isPlainLanguage(l)).toBe(true)
  })

  it('ne prend pas un vrai langage pour du texte brut', () => {
    expect(isPlainLanguage('python')).toBe(false)
  })
})
