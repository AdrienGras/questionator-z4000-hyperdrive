import type { Page } from '@playwright/test'
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
}
