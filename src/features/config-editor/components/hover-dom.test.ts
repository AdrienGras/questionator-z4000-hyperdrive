import { describe, expect, test } from 'vitest'
import { hoverDom, type HoverLabels } from './hover-dom'

const labels: HoverLabels = {
  default: 'Défaut :',
  values: 'Valeurs possibles :',
  iconSearch: 'Rechercher une icône sur tabler.io',
  iconHint: 'Ctrl+Espace propose les noms connus.',
}

describe('hoverDom', () => {
  test('description, puis valeurs possibles en code, puis défaut', () => {
    const dom = hoverDom(
      { from: 0, to: 1, description: 'Sens', values: ['"nearest"', '"up"'], default: 'nearest' },
      labels,
    )
    const lines = [...dom.querySelectorAll('p')].map((p) => p.textContent)
    expect(lines).toEqual(['Sens', 'Valeurs possibles : "nearest", "up"', 'Défaut : "nearest"'])
    expect([...dom.querySelectorAll('code')].map((code) => code.textContent)).toEqual([
      '"nearest"',
      '"up"',
      '"nearest"',
    ])
  })

  test('liste ouverte : lien vers Tabler dans un nouvel onglet et rappel de l’autocomplétion', () => {
    const dom = hoverDom({ from: 0, to: 1, description: 'Icône', openValues: true }, labels)
    const link = dom.querySelector('a')
    expect(link?.textContent).toBe('Rechercher une icône sur tabler.io')
    expect(link?.getAttribute('href')).toBe('https://tabler.io/icons')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(dom.textContent).toContain('Ctrl+Espace propose les noms connus.')
    expect(dom.textContent).not.toContain('Valeurs possibles')
  })

  test('texte posé tel quel, jamais interprété comme du HTML', () => {
    const dom = hoverDom({ from: 0, to: 1, description: '<b>gras</b>' }, labels)
    expect(dom.querySelector('b')).toBeNull()
    expect(dom.textContent).toBe('<b>gras</b>')
  })
})
