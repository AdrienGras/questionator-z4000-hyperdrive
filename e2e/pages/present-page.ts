import type { Locator, Page } from '@playwright/test'

/** Vue projetée (`#/present/<id>`), ouverte dans une fenêtre à part. */
export class PresentPage {
  readonly waitingMessage: Locator
  readonly questionIndex: Locator
  /** Région de l'énoncé en cours ; absente tant que l'animation de tirage n'est pas terminée. */
  readonly prompt: Locator

  /** Un jeton de code colorié par Shiki dans la question en cours (`prompt`). */
  readonly highlightedCode: Locator

  /** Tous les blocs de code colorés (`pre` marqué `data-highlighted="true"`). */
  readonly highlightedBlocks: Locator

  readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.highlightedBlocks = page.locator('pre[data-highlighted="true"]')
    this.waitingMessage = page.getByText("L'épreuve va bientôt commencer.")
    this.prompt = page.getByRole('region', { name: 'Question en cours' })
    this.highlightedCode = this.prompt.locator('pre span[style*="--shiki-"]').first()
    this.questionIndex = page.getByText(/^Question \d+ \/ \d+$/)
  }

  /** Locator du nom de l'étudiant projeté (titre de niveau 1). */
  studentName(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name })
  }

  /** Tout le texte affiché dans la fenêtre. */
  text(): Promise<string> {
    return this.page.getByRole('main').innerText()
  }

  async close(): Promise<void> {
    await this.page.close()
  }
}
