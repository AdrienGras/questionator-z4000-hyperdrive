import type { Locator, Page } from '@playwright/test'

/** Page de l'espace Sessions (`#/sessions`). */
export class SessionsPage {
  /** Section « Liste des sessions » (titre réservé aux lecteurs d'écran). */
  readonly list: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.list = page.getByRole('region', { name: 'Liste des sessions' })
  }

  async goto(): Promise<void> {
    await this.page.goto('#/sessions')
  }

  /** Carte de la session `name`. */
  sessionCard(name: string): Locator {
    return this.list
      .getByRole('listitem')
      .filter({ has: this.page.getByRole('heading', { name, exact: true }) })
  }

  /** Ouvre « Supprimer » dans le menu de la carte de la session et renvoie la modale de confirmation. */
  async openDeleteDialog(sessionName: string): Promise<Locator> {
    await this.page.getByRole('button', { name: `Actions pour « ${sessionName} »` }).click()
    await this.page.getByRole('menuitem', { name: 'Supprimer' }).click()
    return this.page.getByRole('alertdialog')
  }
}
