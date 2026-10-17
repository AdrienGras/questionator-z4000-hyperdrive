import type { Locator, Page } from '@playwright/test'
import { TrainingPage } from './training-page.ts'
import { TrainingStatsPage } from './training-stats-page.ts'

/** Page de l'espace Entraînement (`#/trainings`). */
export class TrainingsPage {
  /** Section « Mes entraînements » (titre réservé aux lecteurs d'écran). */
  readonly trainings: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.trainings = page.getByRole('region', { name: 'Mes entraînements' })
  }

  async goto(): Promise<void> {
    await this.page.goto('#/trainings')
  }

  /** Carte de l'entraînement `name`. */
  trainingCard(name: string): Locator {
    return this.trainings
      .getByRole('listitem')
      .filter({ has: this.page.getByRole('heading', { name, exact: true }) })
  }

  /** Suit « Reprendre » sur la carte de l'entraînement `name` et renvoie son écran. */
  async openTraining(name: string): Promise<TrainingPage> {
    await this.trainingCard(name)
      .getByRole('link', { name: /^Reprendre/ })
      .click()
    const training = new TrainingPage(this.page)
    await training.tiles.or(training.question).waitFor()
    return training
  }

  /** Suit « Stats » sur la carte de l'entraînement `name` et renvoie l'écran de stats. */
  async openTrainingStats(name: string): Promise<TrainingStatsPage> {
    await this.trainingCard(name).getByRole('link', { name: 'Stats', exact: true }).click()
    const stats = new TrainingStatsPage(this.page)
    await stats.keyFigures.waitFor()
    return stats
  }
}
