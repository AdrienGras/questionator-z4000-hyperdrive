import type { Locator, Page } from '@playwright/test'
import { ExaminerPage } from './examiner-page.ts'

/** Écran des statistiques de session (`#/session/<id>/stats`). */
export class StatsPage {
  /** Tableau accessible de l'histogramme (masqué à l'œil, lu par les lecteurs d'écran). */
  readonly histogram: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.histogram = page
      .getByRole('region', { name: 'Histogramme' })
      .getByRole('table', { name: 'Histogramme' })
  }

  /** Valeur (`dd`) de l'indicateur d'effectif de libellé `label` (ex. « Terminés »). */
  headcount(label: string): Locator {
    // Le `dd` suit son `dt` dans un même `div` : le `div` le plus profond est le dernier trouvé.
    return this.page
      .getByRole('region', { name: 'Effectifs' })
      .locator('div')
      .filter({ has: this.page.getByRole('term').getByText(label, { exact: true }) })
      .last()
      .getByRole('definition')
  }

  /** Retour à l'écran de passage. */
  async backToPassage(): Promise<ExaminerPage> {
    await this.page.getByRole('link', { name: 'Retour au passage' }).click()
    return new ExaminerPage(this.page)
  }
}
