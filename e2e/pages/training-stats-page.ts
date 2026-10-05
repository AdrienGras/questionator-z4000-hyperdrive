import type { Locator, Page } from '@playwright/test'
import { TrainingPage } from './training-page.ts'

/** Écran des stats d'un entraînement (`#/training/$trainingId/stats`, F43.4). */
export class TrainingStatsPage {
  /** Région « Chiffres clés » : réponses notées, passées, couverture. */
  readonly keyFigures: Locator

  /** Liste « À revoir » (absente quand aucune question n'est à revoir). */
  readonly reviewList: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.keyFigures = page.getByRole('region', { name: 'Chiffres clés' })
    this.reviewList = page
      .getByRole('region', { name: 'À revoir' })
      .getByRole('list', { name: 'À revoir' })
  }

  /** Ligne de la liste « À revoir » dont le titre est `title`. */
  reviewItem(title: string): Locator {
    return this.reviewList.getByRole('listitem').filter({ hasText: title })
  }

  /** « Retour à l’entraînement » : renvoie l'écran d'entraînement, une fois les tuiles montées. */
  async backToTraining(): Promise<TrainingPage> {
    await this.page.getByRole('link', { name: 'Retour à l’entraînement' }).click()
    const training = new TrainingPage(this.page)
    await training.tiles.or(training.question).waitFor()
    return training
  }
}
