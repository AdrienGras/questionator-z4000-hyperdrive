import type { Locator, Page } from '@playwright/test'
import { HomePage } from './home-page.ts'

/** Écran d'entraînement (`#/training/$trainingId`, F43.3) : tuiles, ou la question tirée. */
export class TrainingPage {
  /** Liste des tuiles de catégorie « Choisissez une catégorie ». */
  readonly tiles: Locator

  /** Région « Question en cours », qui remplace les tuiles après un tirage. */
  readonly question: Locator

  /** Titre de la question tirée. */
  readonly questionTitle: Locator

  /** Bouton « Voir la réponse », présent tant que la réponse est masquée. */
  readonly revealButton: Locator

  /** Titre « Réponse », présent une fois la réponse révélée. */
  readonly answerTitle: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.tiles = page.getByRole('list', { name: 'Choisissez une catégorie' })
    this.question = page.getByRole('region', { name: 'Question en cours' })
    this.questionTitle = this.question.getByRole('heading', { level: 2 })
    this.revealButton = this.question.getByRole('button', { name: 'Voir la réponse' })
    this.answerTitle = this.question.getByRole('heading', { level: 3, name: 'Réponse' })
  }

  /** Tire une question de la catégorie `categoryLabel` et attend qu'elle s'affiche. */
  async draw(categoryLabel: string): Promise<void> {
    await this.tiles
      .getByRole('button', { name: new RegExp(String.raw`^${categoryLabel}\b`) })
      .click()
    await this.question.waitFor()
  }

  async reveal(): Promise<void> {
    await this.revealButton.click()
  }

  /** Note la question révélée (`value` formatée, ex. « 0,5 ») ; les tuiles reviennent. */
  async score(value: string): Promise<void> {
    await this.question.getByRole('button', { name: `Noter ${value}`, exact: true }).click()
    await this.tiles.waitFor()
  }

  /** « Passer » : la question est écartée sans note ; les tuiles reviennent. */
  async pass(): Promise<void> {
    await this.question.getByRole('button', { name: 'Passer' }).click()
    await this.tiles.waitFor()
  }

  /** Recharge la page et attend que l'écran soit remonté (tuiles ou question). */
  async reload(): Promise<void> {
    await this.page.reload()
    await this.tiles.or(this.question).waitFor()
  }

  /** « Retour à l'accueil ». */
  async backHome(): Promise<HomePage> {
    await this.page.getByRole('link', { name: 'Retour à l’accueil' }).click()
    await this.page.waitForURL(/#\/$/)
    return new HomePage(this.page)
  }
}
