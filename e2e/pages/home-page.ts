import type { Locator, Page } from '@playwright/test'
import { ConfigEditorPage } from './config-editor-page.ts'
import { CreateSessionPage } from './create-session-page.ts'

/** Page d'accueil (`#/`). */
export class HomePage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(): Promise<void> {
    await this.page.goto('#/')
  }

  /** Suit le lien « Créer une session » et renvoie l'écran de création. */
  async createSession(): Promise<CreateSessionPage> {
    await this.page.getByRole('link', { name: 'Créer une session' }).first().click()
    return new CreateSessionPage(this.page)
  }

  /** Suit le lien « Ouvrir l'éditeur » de la carte « Éditer une config ». */
  async openEditor(): Promise<ConfigEditorPage> {
    await this.page.getByRole('link', { name: "Ouvrir l'éditeur" }).click()
    return new ConfigEditorPage(this.page)
  }

  /** Ouvre « Supprimer » dans le menu de la carte de la session et renvoie la modale de confirmation. */
  async openDeleteDialog(sessionName: string): Promise<Locator> {
    await this.page.getByRole('button', { name: `Actions pour « ${sessionName} »` }).click()
    await this.page.getByRole('menuitem', { name: 'Supprimer' }).click()
    return this.page.getByRole('alertdialog')
  }
}
