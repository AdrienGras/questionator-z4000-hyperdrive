import { expect } from 'vitest'
import { screen } from '@testing-library/react'

/** Nom accessible d'un élément interactif : `aria-label`, sinon texte. */
export function accessibleName(el: Element): string {
  return el.getAttribute('aria-label') ?? el.textContent ?? ''
}

/**
 * Barre de titre de `PageShell` : le `header` qui porte le `h1`. Pas `getByRole('banner')` : jsdom
 * prête ce rôle à tout `header`, y compris ceux de l'aperçu de l'éditeur (`QuestionPreview`,
 * `StudentScreen`), rendus après la validation différée ; la requête échouait alors sur « multiple
 * elements » si l'aperçu arrivait avant l'assertion (machine chargée, #87).
 */
function pageBanner(): HTMLElement {
  const banner = screen.getByRole('heading', { level: 1 }).closest('header')
  if (banner === null) throw new Error('barre de titre absente')
  return banner
}

/** Noms accessibles des éléments interactifs de la barre de titre, dans l'ordre du DOM. */
export function bannerInteractiveNames(): string[] {
  return [...pageBanner().querySelectorAll('a[href], button')].map(accessibleName)
}

/** Vérifie que le bouton de thème est le dernier élément interactif de la barre (F19). */
export function expectColorModeToggleLast(): void {
  const names = bannerInteractiveNames()
  expect(names.at(-1)).toMatch(/^(Mode d'affichage|Display mode)/)
}
