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
    // Le `dd` qui suit immédiatement le `dt` du libellé, sans dépendre de l'imbrication des `div`.
    return this.page
      .getByRole('region', { name: 'Effectifs' })
      .getByRole('term')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator('xpath=following-sibling::dd[1]')
  }

  /** Retour à l'écran de passage. */
  async backToPassage(): Promise<ExaminerPage> {
    await this.page.getByRole('link', { name: 'Retour au passage' }).click()
    return new ExaminerPage(this.page)
  }
}
