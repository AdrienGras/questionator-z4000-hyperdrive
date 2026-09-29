import type { Locator, Page } from '@playwright/test'

/** Vue projetée (`#/present/<id>`), ouverte dans une fenêtre à part. */
export class PresentPage {
  readonly waitingMessage: Locator
  readonly questionIndex: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.waitingMessage = page.getByText("L'épreuve va bientôt commencer.")
    this.questionIndex = page.getByText(/^Question \d+ \/ \d+$/)
  }

  /** Locator du nom de l'étudiant projeté (titre de niveau 1). */
  studentName(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name })
  }

  /** Tout le texte affiché dans la fenêtre. */
  async text(): Promise<string> {
    return this.page.getByRole('main').innerText()
  }

  async close(): Promise<void> {
    await this.page.close()
  }
}
