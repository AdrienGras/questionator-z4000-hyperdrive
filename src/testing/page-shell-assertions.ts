import { expect } from 'vitest'
import { screen } from '@testing-library/react'

/** Nom accessible d'un élément interactif : `aria-label`, sinon texte. */
export function accessibleName(el: Element): string {
  return el.getAttribute('aria-label') ?? el.textContent ?? ''
}

/**
 * Barre de titre de `PageShell` : le `header` qui porte un `h1`. Pas `getByRole('banner')` : jsdom
 * prête ce rôle à tout `header` visible, y compris celui des cartes de l'aperçu de l'éditeur
 * (`QuestionPreview`), rendues après la validation différée ; la requête échouait alors sur
 * « multiple elements » si l'aperçu arrivait avant l'assertion (machine chargée, #87). Le `h1` de
 * l'écran projeté de l'aperçu est masqué (canevas `aria-hidden`) ; on garde quand même le seul `h1`
 * placé dans un `header` pour ne pas dépendre de ce masquage.
 */
function pageBanner(): HTMLElement {
  const banners = screen
    .getAllByRole('heading', { level: 1 })
    .map((heading) => heading.closest('header'))
    .filter((header): header is HTMLElement => header !== null)
  const [banner] = banners
  if (banner === undefined || banners.length > 1) {
    throw new Error(`barre de titre : ${banners.length} trouvée(s)`)
  }
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
