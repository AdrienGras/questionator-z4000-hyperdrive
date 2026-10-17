import type { Locator, Page } from '@playwright/test'

/**
 * Menu de l'application (D102, D103) : le menu latéral (`aside`) à partir de 768 px, la barre du
 * haut et son tiroir en dessous. Les liens sont cherchés dans le menu, jamais dans toute la page :
 * le fil d'Ariane et l'accueil ont des liens de même nom.
 */
export class AppMenu {
  readonly aside: Locator
  /** Bouton « Menu » de la barre du haut (écran étroit). */
  readonly menuButton: Locator
  /** Tiroir ouvert par « Menu ». */
  readonly drawer: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.aside = page.getByRole('complementary')
    this.menuButton = page.getByRole('button', { name: 'Menu', exact: true })
    this.drawer = page.getByRole('dialog', { name: 'Menu' })
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(`#${path}`)
  }

  /** Lien `name` du menu latéral. */
  link(name: string): Locator {
    return this.aside.getByRole('link', { name, exact: true })
  }

  /** Bouton de repli : « Replier le menu » ou « Déplier le menu » selon l'état. */
  toggle(collapsed: boolean): Locator {
    return this.aside.getByRole('button', {
      name: collapsed ? 'Déplier le menu' : 'Replier le menu',
    })
  }

  async collapse(): Promise<void> {
    await this.toggle(false).click()
    await this.toggle(true).waitFor()
  }

  /** Ouvre le tiroir (écran étroit) et renvoie son lien `name`. */
  async openDrawer(): Promise<Locator> {
    await this.menuButton.click()
    await this.drawer.waitFor()
    return this.drawer
  }
}
