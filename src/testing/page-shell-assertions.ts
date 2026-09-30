import { expect } from 'vitest'
import { screen } from '@testing-library/react'

/** Nom accessible d'un élément interactif : `aria-label`, sinon texte. */
export function accessibleName(el: Element): string {
  return el.getAttribute('aria-label') ?? el.textContent ?? ''
}

/** Noms accessibles des éléments interactifs de la barre de titre, dans l'ordre du DOM. */
export function bannerInteractiveNames(): string[] {
  const banner = screen.getByRole('banner')
  return [...banner.querySelectorAll('a[href], button')].map(accessibleName)
}

/** Vérifie que le bouton de thème est le dernier élément interactif de la barre (F19). */
export function expectColorModeToggleLast(): void {
  const names = bannerInteractiveNames()
  expect(names.at(-1)).toMatch(/^(Mode d'affichage|Display mode)/)
}
